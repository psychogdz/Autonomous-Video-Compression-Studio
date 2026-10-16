import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import multer from 'multer';
import { locateBinaries } from './engine/binaryLocator.js';
import { probeMedia } from './engine/probeService.js';
import { detectHardwareCapabilities } from './engine/hardwareAccel.js';
import { makeCompressionDecision } from './engine/decisionEngine.js';
import {
  startCompressionJob,
  cancelCompressionJob,
  subscribeToJob,
  getActiveJob,
} from './engine/encoderService.js';
import { calculateQualityMetrics } from './engine/qualityMetrics.js';
import { queueManager } from './engine/queueManager.js';
import { CompressionJobConfig, EncodingProgress } from '../../shared/types.js';

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors());
app.use(express.json());

// Setup isolated directory structure:
// temp/uploads/ -> Incoming uploaded raw video source files
// temp/passes/  -> Temporary 2-pass log files (cleaned up after encode)
// outputs/      -> Dedicated permanent directory for completed deliverables
const uploadDir = path.join(process.cwd(), 'temp', 'uploads');
const passesDir = path.join(process.cwd(), 'temp', 'passes');
const outputsDir = path.join(process.cwd(), 'outputs');

[uploadDir, passesDir, outputsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 * 1024 } }); // 10GB limit

// 1. Health & Environment Status
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const binaries = await locateBinaries();
    res.json({
      status: 'ok',
      version: '1.0.0',
      ffmpeg: binaries,
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'error',
      message: err.message,
    });
  }
});

// 2. Hardware Acceleration Status
app.get('/api/hardware', async (_req: Request, res: Response) => {
  try {
    const hardware = await detectHardwareCapabilities();
    res.json(hardware);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Probe Video Metadata
app.post('/api/probe', async (req: Request, res: Response) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'filePath parameter is required' });
  }

  try {
    const metadata = await probeMedia(filePath);
    res.json(metadata);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. File Upload (for browser drag & drop)
app.post('/api/upload', upload.single('video'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  try {
    const metadata = await probeMedia(req.file.path);
    res.json({
      filePath: req.file.path,
      fileName: req.file.originalname,
      metadata,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Intelligent Decision Estimate
app.post('/api/decision', async (req: Request, res: Response) => {
  const { probe, config } = req.body;
  if (!probe || !config) {
    return res.status(400).json({ error: 'probe and config objects are required' });
  }

  try {
    const hw = await detectHardwareCapabilities();
    const availableEncoders = hw.encoders.filter(e => e.available).map(e => e.id);
    const estimate = makeCompressionDecision(probe, config, availableEncoders);
    res.json(estimate);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Start Compression Job
app.post('/api/compress', async (req: Request, res: Response) => {
  const config: CompressionJobConfig = req.body;
  if (!config || !config.sourceFilePath) {
    return res.status(400).json({ error: 'sourceFilePath is required' });
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Start job asynchronously in background
  startCompressionJob(jobId, config).catch(() => {
    // Handled in activeJob listeners
  });

  res.json({
    jobId,
    status: 'started',
  });
});

// 7. Server-Sent Events (SSE) for Real-Time Telemetry
app.get('/api/compress/:jobId/progress', async (req: Request, res: Response) => {
  const { jobId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let job = getActiveJob(jobId);
  if (!job) {
    // Wait up to 5 seconds in case the client connected before child process initialization
    for (let i = 0; i < 50; i++) {
      await new Promise(r => setTimeout(r, 100));
      job = getActiveJob(jobId);
      if (job) break;
    }
  }

  if (!job) {
    res.write(`event: job_error\ndata: ${JSON.stringify({ message: 'Job not found or already closed' })}\n\n`);
    return res.end();
  }

  if (job.status === 'completed' && job.result) {
    res.write(`event: complete\ndata: ${JSON.stringify(job.result)}\n\n`);
    return res.end();
  }

  if (job.status === 'failed') {
    res.write(`event: job_error\ndata: ${JSON.stringify({ message: job.error || 'Job failed' })}\n\n`);
    return res.end();
  }

  // Send initial connected ping
  res.write(`event: connected\ndata: ${JSON.stringify({ jobId, status: job.status })}\n\n`);

  const progressHandler = (progress: EncodingProgress) => {
    res.write(`event: progress\ndata: ${JSON.stringify(progress)}\n\n`);
  };

  const completeHandler = (outcome: any) => {
    res.write(`event: complete\ndata: ${JSON.stringify(outcome)}\n\n`);
    res.end();
  };

  const errorHandler = (err: Error) => {
    res.write(`event: job_error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
    res.end();
  };

  job.listeners.push(progressHandler);
  job.completionListeners.push(completeHandler);
  job.errorListeners.push(errorHandler);

  req.on('close', () => {
    job.listeners = job.listeners.filter(l => l !== progressHandler);
    job.completionListeners = job.completionListeners.filter(l => l !== completeHandler);
    job.errorListeners = job.errorListeners.filter(l => l !== errorHandler);
  });
});

// 8. Cancel Compression Job
app.post('/api/compress/:jobId/cancel', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const cancelled = cancelCompressionJob(jobId);
  res.json({ success: cancelled });
});

// 9. Calculate Quality Metrics (SSIM & PSNR)
app.post('/api/quality', async (req: Request, res: Response) => {
  const { originalPath, compressedPath } = req.body;
  if (!originalPath || !compressedPath) {
    return res.status(400).json({ error: 'originalPath and compressedPath are required' });
  }

  try {
    const scores = await calculateQualityMetrics(originalPath, compressedPath);
    res.json(scores);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Reveal File in OS File Explorer
app.post('/api/reveal', (req: Request, res: Response) => {
  const { filePath } = req.body;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File path does not exist' });
  }

  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  let command = '';
  if (isWindows) {
    command = `explorer.exe /select,"${filePath.replace(/\//g, '\\')}"`;
  } else if (isMac) {
    command = `open -R "${filePath}"`;
  } else {
    command = `xdg-open "${path.dirname(filePath)}"`;
  }

  exec(command, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to open file explorer' });
    }
    res.json({ success: true });
  });
});

// 11. Stream Video File with HTTP 206 Range Support for Web Player
app.get('/api/stream', (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.gif' ? 'image/gif' : ext === '.webm' ? 'video/webm' : 'video/mp4';

  if (range && contentType !== 'image/gif') {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// 12. Batch Queue Endpoints
app.get('/api/queue', (_req: Request, res: Response) => {
  res.json(queueManager.getQueue());
});

// 13. Export Compression Summary Report
app.post('/api/export-report', (req: Request, res: Response) => {
  const { outcome, format } = req.body;
  if (!outcome) {
    return res.status(400).json({ error: 'outcome is required' });
  }

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };

  if (format === 'json') {
    return res.json({
      application: 'LuminaPress Video Studio',
      timestamp: new Date().toISOString(),
      report: outcome,
    });
  }

  const markdownReport = `# LuminaPress Video Studio — Compression Audit Report
Generated: ${new Date().toLocaleString()}

## File Summary
- **Source File:** \`${outcome.sourceFilePath}\`
- **Output File:** \`${outcome.outputFilePath}\`
- **Original Size:** ${formatBytes(outcome.originalSizeBytes)} (${outcome.originalSizeBytes} bytes)
- **Compressed Size:** ${formatBytes(outcome.compressedSizeBytes)} (${outcome.compressedSizeBytes} bytes)
- **Space Saved:** ${formatBytes(outcome.savedBytes)} (**-${outcome.savedPercent}%**)

## Encoding Telemetry
- **Video Codec:** ${outcome.actualVideoCodec.toUpperCase()}
- **Duration:** ${outcome.durationSeconds.toFixed(1)}s
- **Processing Time:** ${outcome.processingTimeSeconds.toFixed(1)}s
- **Average FPS:** ${outcome.averageFps} fps
- **Average Encoding Speed:** ${outcome.averageSpeed}

${outcome.quality ? `## Quality Verification
- **SSIM (Structural Similarity):** ${outcome.quality.ssim ?? 'N/A'}
- **PSNR (Peak Signal-to-Noise Ratio):** ${outcome.quality.psnr ? `${outcome.quality.psnr} dB` : 'N/A'}
` : ''}
---
*Report generated automatically by LuminaPress Video Studio.*
`;

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', 'attachment; filename="compression_report.md"');
  res.send(markdownReport);
});

app.post('/api/queue/add', async (req: Request, res: Response) => {
  const { filePath, config } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath is required' });

  try {
    const item = await queueManager.addToQueue(filePath, config);
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/queue/start', (_req: Request, res: Response) => {
  queueManager.startQueue();
  res.json({ status: 'started' });
});

app.post('/api/queue/pause', (_req: Request, res: Response) => {
  queueManager.pauseQueue();
  res.json({ status: 'paused' });
});

// Real-Time Queue Updates via SSE
app.get('/api/queue/stream', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Initial queue state
  res.write(`data: ${JSON.stringify(queueManager.getQueue())}\n\n`);

  const unsubscribe = queueManager.subscribe((q) => {
    res.write(`data: ${JSON.stringify(q)}\n\n`);
  });

  _req.on('close', () => {
    unsubscribe();
  });
});

app.post('/api/queue/clear-completed', (_req: Request, res: Response) => {
  queueManager.clearCompleted();
  res.json({ status: 'cleared' });
});

app.post('/api/queue/:id/retry', async (req: Request, res: Response) => {
  const success = await queueManager.retryJob(req.params.id);
  res.json({ success });
});

app.post('/api/queue/:id/move', (req: Request, res: Response) => {
  const { direction } = req.body;
  const success = queueManager.moveJob(req.params.id, direction === 'up' ? 'up' : 'down');
  res.json({ success });
});

app.put('/api/queue/:id/config', (req: Request, res: Response) => {
  const { config } = req.body;
  const success = queueManager.updateJobConfig(req.params.id, config);
  res.json({ success });
});

app.post('/api/queue/:id/cancel', (req: Request, res: Response) => {
  const success = queueManager.cancelJob(req.params.id);
  res.json({ success });
});

app.delete('/api/queue/:id', (req: Request, res: Response) => {
  const success = queueManager.removeJob(req.params.id);
  res.json({ success });
});

// Serve frontend build in production
const clientDist = path.join(process.cwd(), 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`LuminaPress Engine Server running at http://localhost:${PORT}`);
  });
}
