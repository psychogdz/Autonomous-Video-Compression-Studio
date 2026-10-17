import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { locateBinaries } from './binaryLocator.js';
import { probeMedia } from './probeService.js';
import { makeCompressionDecision } from './decisionEngine.js';
import { detectHardwareCapabilities } from './hardwareAccel.js';
import {
  CompressionJobConfig,
  EncodingProgress,
  CompressionOutcome,
  DecisionEstimate,
} from '../../../shared/types.js';

export interface ActiveJob {
  jobId: string;
  process?: ChildProcess;
  config: CompressionJobConfig;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  outputFilePath: string;
  tempPassLogPrefix?: string;
  result?: CompressionOutcome;
  error?: string;
  listeners: Array<(progress: EncodingProgress) => void>;
  completionListeners: Array<(outcome: CompressionOutcome) => void>;
  errorListeners: Array<(err: Error) => void>;
}

const activeJobs = new Map<string, ActiveJob>();

/**
 * Parses timestamp string HH:MM:SS.ms to total seconds.
 */
export function parseTimeStringToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return parseFloat(timeStr) || 0;
}

/**
 * Builds safe default output file path with '_luminapress' suffix.
 * If source file is in temporary uploads, routes output to the dedicated 'outputs/' directory.
 */
export function generateSafeOutputPath(sourcePath: string, customOutputDir?: string, targetExtension?: string): string {
  let dir = customOutputDir && fs.existsSync(customOutputDir) ? customOutputDir : path.dirname(sourcePath);

  // Isolate temporary uploads away from compressed outputs
  const normalized = sourcePath.replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('/temp/uploads') || normalized.includes('/temp/')) {
    dir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const ext = targetExtension ? targetExtension : (path.extname(sourcePath) || '.mp4');
  const baseName = path.basename(sourcePath, path.extname(sourcePath));

  let candidate = path.join(dir, `${baseName}_luminapress${ext}`);
  let counter = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${baseName}_luminapress_${counter}${ext}`);
    counter++;
  }
  return candidate;
}

/**
 * Starts a video compression job.
 */
export async function startCompressionJob(
  jobId: string,
  config: CompressionJobConfig,
  onProgress?: (p: EncodingProgress) => void
): Promise<CompressionOutcome> {
  const job: ActiveJob = {
    jobId,
    config,
    status: 'running',
    outputFilePath: config.outputFilePath || '',
    listeners: onProgress ? [onProgress] : [],
    completionListeners: [],
    errorListeners: [],
  };
  activeJobs.set(jobId, job);

  const { ffmpegPath } = await locateBinaries();
  const probe = await probeMedia(config.sourceFilePath);
  const hardware = await detectHardwareCapabilities();
  const availableEncoders = hardware.encoders.filter(e => e.available).map(e => e.id);
  const decision = makeCompressionDecision(probe, config, availableEncoders);

  const isTargetGif = decision.resolvedCodec === 'gif';
  const targetExt = isTargetGif ? '.gif' : '.mp4';
  const outputFilePath = config.outputFilePath || generateSafeOutputPath(config.sourceFilePath, undefined, targetExt);
  job.outputFilePath = outputFilePath;

  // Ensure output directory exists
  const outDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const startTime = Date.now();
  let totalFramesEncoded = 0;
  let finalSpeed = '1.0x';

  try {
    if (decision.twoPass) {
      // 2-PASS ENCODING
      const tempPassLogPrefix = path.join(
        process.cwd(),
        'temp',
        'passes',
        `pass_${jobId}_${Date.now()}`
      );
      job.tempPassLogPrefix = tempPassLogPrefix;

      const tempDir = path.dirname(tempPassLogPrefix);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // PASS 1
      await executePass({
        ffmpegPath,
        sourceFilePath: config.sourceFilePath,
        targetFilePath: process.platform === 'win32' ? 'NUL' : '/dev/null',
        decision,
        passNumber: 1,
        passLogPrefix: tempPassLogPrefix,
        probe,
        job,
        jobId,
      });

      // PASS 2
      const pass2Result = await executePass({
        ffmpegPath,
        sourceFilePath: config.sourceFilePath,
        targetFilePath: outputFilePath,
        decision,
        passNumber: 2,
        passLogPrefix: tempPassLogPrefix,
        probe,
        job,
        jobId,
      });

      totalFramesEncoded = pass2Result.frames;
      finalSpeed = pass2Result.speed;

      // Clean up pass log files
      cleanPassLogs(tempPassLogPrefix);
    } else {
      // 1-PASS ENCODING (CRF or single-pass ABR)
      const passResult = await executePass({
        ffmpegPath,
        sourceFilePath: config.sourceFilePath,
        targetFilePath: outputFilePath,
        decision,
        passNumber: undefined,
        probe,
        job,
        jobId,
      });

      totalFramesEncoded = passResult.frames;
      finalSpeed = passResult.speed;
    }

    // Verify output file existence and size
    if (!fs.existsSync(outputFilePath)) {
      throw new Error('Compression finished but output file was not created.');
    }

    const outStat = fs.statSync(outputFilePath);
    if (outStat.size === 0) {
      fs.unlinkSync(outputFilePath);
      throw new Error('Compression resulted in an empty (0-byte) output file.');
    }

    const processingTimeSeconds = Math.max(0.1, (Date.now() - startTime) / 1000);
    const savedBytes = Math.max(0, probe.fileSizeBytes - outStat.size);
    const savedPercent = Math.round((savedBytes / probe.fileSizeBytes) * 1000) / 10;
    const averageFps = Math.round(totalFramesEncoded / processingTimeSeconds);

    const outcome: CompressionOutcome = {
      jobId,
      sourceFilePath: config.sourceFilePath,
      outputFilePath,
      originalSizeBytes: probe.fileSizeBytes,
      compressedSizeBytes: outStat.size,
      savedBytes,
      savedPercent,
      durationSeconds: probe.durationSeconds,
      processingTimeSeconds: Math.round(processingTimeSeconds * 10) / 10,
      averageFps,
      averageSpeed: finalSpeed,
      actualVideoCodec: decision.resolvedCodec,
      success: true,
    };

    job.result = outcome;
    job.status = 'completed';
    job.completionListeners.forEach(fn => fn(outcome));
    return outcome;
  } catch (err: any) {
    job.error = err.message;
    job.status = job.status === 'cancelled' ? 'cancelled' : 'failed';
    // Cleanup incomplete output file on failure or cancel
    if (fs.existsSync(outputFilePath)) {
      try {
        fs.unlinkSync(outputFilePath);
      } catch {
        // Ignore delete errors
      }
    }
    if (job.tempPassLogPrefix) {
      cleanPassLogs(job.tempPassLogPrefix);
    }

    job.errorListeners.forEach(fn => fn(err));
    throw err;
  } finally {
    setTimeout(() => {
      activeJobs.delete(jobId);
    }, 60000); // keep in memory for 1 minute for queries
  }
}

interface PassExecutionArgs {
  ffmpegPath: string;
  sourceFilePath: string;
  targetFilePath: string;
  decision: DecisionEstimate;
  passNumber?: 1 | 2;
  passLogPrefix?: string;
  probe: any;
  job: ActiveJob;
  jobId: string;
}

function executePass(args: PassExecutionArgs): Promise<{ frames: number; speed: string }> {
  return new Promise((resolve, reject) => {
    const {
      ffmpegPath,
      sourceFilePath,
      targetFilePath,
      decision,
      passNumber,
      passLogPrefix,
      probe,
      job,
      jobId,
    } = args;

    const ffmpegArgs: string[] = [
      '-y', // overwrite target if needed (already guarded by generateSafeOutputPath)
      '-v', 'info',
      '-progress', 'pipe:1',
      '-i', sourceFilePath,
    ];

    // Video Encoding or GIF Creation
    if (decision.resolvedCodec === 'gif') {
      const targetFps = decision.resolvedFps || 15;
      const targetWidth = decision.resolvedWidth;
      const targetHeight = decision.resolvedHeight;

      // Cap long video GIF exports to 15 seconds for web and messaging usability
      if (probe.durationSeconds > 15) {
        ffmpegArgs.push('-t', '15');
      }

      const filterComplex = `[0:v] fps=${targetFps},scale=${targetWidth}:${targetHeight}:flags=lanczos,split [a][b];[a] palettegen=max_colors=256:stats_mode=single [p];[b][p] paletteuse=dither=bayer:bayer_scale=5`;

      ffmpegArgs.push('-filter_complex', filterComplex);
      ffmpegArgs.push('-an'); // GIFs have no audio
      ffmpegArgs.push(targetFilePath);
    } else {
      // Video Filter: Resolution Scaling
      const sourceWidth = probe.primaryVideo?.width || decision.resolvedWidth;
      const sourceHeight = probe.primaryVideo?.height || decision.resolvedHeight;
      if (decision.resolvedWidth !== sourceWidth || decision.resolvedHeight !== sourceHeight) {
        ffmpegArgs.push('-vf', `scale=${decision.resolvedWidth}:${decision.resolvedHeight}`);
      }

      // Video Codec
      ffmpegArgs.push('-c:v', decision.resolvedCodec);

      // Preset
      if (decision.resolvedCodec.includes('mf')) {
        // MediaFoundation configures rate control and optimization internally
      } else if (!decision.resolvedCodec.includes('nvenc')) {
        ffmpegArgs.push('-preset', decision.resolvedPreset);
      } else {
        // NVENC uses p1 - p7 presets
        ffmpegArgs.push('-preset', 'p4');
      }

      // Pixel format
      ffmpegArgs.push('-pix_fmt', 'yuv420p');

      // Rate Control
      if (decision.twoPass && passNumber) {
        ffmpegArgs.push('-b:v', `${decision.targetVideoBitrateKbps}k`);
        ffmpegArgs.push('-maxrate', `${Math.round((decision.targetVideoBitrateKbps || 1000) * 1.5)}k`);
        ffmpegArgs.push('-bufsize', `${Math.round((decision.targetVideoBitrateKbps || 1000) * 2)}k`);
        ffmpegArgs.push('-pass', passNumber.toString());
        if (passLogPrefix) {
          ffmpegArgs.push('-passlogfile', passLogPrefix);
        }
      } else if (decision.targetVideoBitrateKbps) {
        ffmpegArgs.push('-b:v', `${decision.targetVideoBitrateKbps}k`);
        ffmpegArgs.push('-maxrate', `${Math.round(decision.targetVideoBitrateKbps * 1.5)}k`);
        ffmpegArgs.push('-bufsize', `${Math.round(decision.targetVideoBitrateKbps * 2)}k`);
      } else if (decision.crf !== undefined) {
        if (decision.resolvedCodec.includes('mf')) {
          ffmpegArgs.push('-b:v', '2500k');
        } else {
          ffmpegArgs.push('-crf', decision.crf.toString());
        }
      }

      // Audio & Output handling per pass
      if (passNumber === 1) {
        ffmpegArgs.push('-an'); // No audio on Pass 1
        ffmpegArgs.push('-f', 'null');
        ffmpegArgs.push(targetFilePath);
      } else {
        if (decision.targetAudioBitrateKbps === 0) {
          ffmpegArgs.push('-an');
        } else {
          ffmpegArgs.push('-c:a', 'aac');
          ffmpegArgs.push('-b:a', `${decision.targetAudioBitrateKbps}k`);
        }
        ffmpegArgs.push('-movflags', '+faststart'); // web streaming optimization
        ffmpegArgs.push(targetFilePath);
      }
    }

    // Apply CPU Thread Allotment based on cpuThrottle to prevent 100% CPU lockups
    const isGpu = decision.resolvedCodec.includes('mf') ||
                  decision.resolvedCodec.includes('nvenc') ||
                  decision.resolvedCodec.includes('qsv') ||
                  decision.resolvedCodec.includes('amf');

    if (!isGpu && decision.resolvedCodec !== 'gif') {
      const logicalCores = os.cpus()?.length || 4;
      let targetThreads = logicalCores;
      if (decision.cpuThrottle === 'eco') {
        // Eco Mode: Cap to 50% CPU threads (silent fans, computer stays totally smooth)
        targetThreads = Math.max(1, Math.floor(logicalCores * 0.5));
      } else if (decision.cpuThrottle === 'balanced') {
        // Balanced Mode: Cap to ~75% CPU threads (reserves 2-4 cores for Windows & UI)
        targetThreads = Math.max(1, Math.floor(logicalCores * 0.75));
      } else {
        // Max Power: all threads
        targetThreads = logicalCores;
      }
      ffmpegArgs.push('-threads', targetThreads.toString());
    }

    const proc = spawn(ffmpegPath, ffmpegArgs, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Lower process priority to BELOW_NORMAL so the OS scheduler guarantees
    // the user's browser, desktop, and games never lag during video encoding!
    if (proc.pid && typeof os.setPriority === 'function') {
      try {
        os.setPriority(proc.pid, os.constants.priority.PRIORITY_BELOW_NORMAL);
      } catch {
        // Ignore priority errors
      }
    }

    job.process = proc;

    let totalFrames = 0;
    let lastSpeed = '1.0x';
    const totalDuration = Math.max(1, probe.durationSeconds);
    const fps = probe.primaryVideo?.fps || 30;
    const totalEstimatedFrames = Math.round(totalDuration * fps);

    let stdoutBuffer = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || ''; // keep remaining incomplete line

      const progressData: Record<string, string> = {};
      for (const line of lines) {
        const [key, val] = line.split('=');
        if (key && val) {
          progressData[key.trim()] = val.trim();
        }
      }

      if (progressData['frame']) {
        const frame = parseInt(progressData['frame'], 10) || totalFrames;
        totalFrames = frame;
        const currentFps = parseFloat(progressData['fps'] || '0') || 0;
        const speed = progressData['speed'] || lastSpeed;
        lastSpeed = speed;
        const outTimeUs = parseInt(progressData['out_time_us'] || '0', 10);
        const currentTimeSeconds = outTimeUs > 0 ? outTimeUs / 1000000 : parseTimeStringToSeconds(progressData['out_time'] || '0');

        let percent = Math.min(99.9, (currentTimeSeconds / totalDuration) * 100);
        if (passNumber === 1) {
          percent = percent * 0.45; // Pass 1 is 45% of total
        } else if (passNumber === 2) {
          percent = 45 + percent * 0.55; // Pass 2 is remaining 55%
        }

        const speedMultiplier = parseFloat(speed.replace('x', '')) || 1.0;
        const remainingDuration = Math.max(0, totalDuration - currentTimeSeconds);
        const etaSeconds = speedMultiplier > 0 ? Math.round(remainingDuration / speedMultiplier) : 0;

        const progressEvent: EncodingProgress = {
          jobId,
          frame,
          totalEstimatedFrames,
          fps: currentFps,
          speed,
          currentSizeFormatted: formatBytes(parseInt(progressData['total_size'] || '0', 10)),
          currentTimeSeconds: Math.round(currentTimeSeconds * 10) / 10,
          totalDurationSeconds: Math.round(totalDuration * 10) / 10,
          percent: Math.round(percent * 10) / 10,
          etaSeconds,
          stage: passNumber === 1 ? 'pass_1' : passNumber === 2 ? 'pass_2' : 'encoding',
        };

        job.listeners.forEach(fn => fn(progressEvent));
      }
    });

    let stderrBuffer = '';
    proc.stderr.on('data', (chunk: Buffer) => {
      stderrBuffer += chunk.toString();
      if (stderrBuffer.length > 5000) {
        stderrBuffer = stderrBuffer.slice(-5000);
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`FFmpeg spawn error: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (job.status === 'cancelled') {
        return reject(new Error('Compression job was cancelled by user.'));
      }
      if (code === 0) {
        resolve({ frames: totalFrames, speed: lastSpeed });
      } else {
        const errorSummary = extractErrorSummary(stderrBuffer);
        reject(new Error(`FFmpeg exited with error code ${code}: ${errorSummary}`));
      }
    });
  });
}

function cleanPassLogs(passLogPrefix: string) {
  const dir = path.dirname(passLogPrefix);
  const base = path.basename(passLogPrefix);
  if (fs.existsSync(dir)) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.startsWith(base)) {
          fs.unlinkSync(path.join(dir, file));
        }
      }
    } catch {
      // Ignore cleanup error
    }
  }
}

function extractErrorSummary(stderr: string): string {
  const lines = stderr.split(/\r?\n/).filter(l => l.trim().length > 0);
  const errorLines = lines.filter(l => /error|invalid|failed|unsupported/i.test(l));
  if (errorLines.length > 0) {
    return errorLines.slice(-3).join('; ');
  }
  return lines.slice(-2).join(' ') || 'Unknown FFmpeg processing error';
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Cancels an active compression job.
 */
export function cancelCompressionJob(jobId: string): boolean {
  const job = activeJobs.get(jobId);
  if (!job) return false;

  job.status = 'cancelled';
  if (job.process && !job.process.killed) {
    if (process.platform === 'win32' && job.process.pid) {
      try {
        spawn('taskkill', ['/pid', job.process.pid.toString(), '/f', '/t']);
      } catch {
        job.process.kill('SIGKILL');
      }
    } else {
      job.process.kill('SIGKILL');
    }
  }

  // Cleanup partial output
  if (fs.existsSync(job.outputFilePath)) {
    try {
      fs.unlinkSync(job.outputFilePath);
    } catch {
      // Ignore unlink errors
    }
  }
  if (job.tempPassLogPrefix) {
    cleanPassLogs(job.tempPassLogPrefix);
  }

  return true;
}

/**
 * Subscribes a listener to an active job's progress.
 */
export function subscribeToJob(jobId: string, listener: (p: EncodingProgress) => void): boolean {
  const job = activeJobs.get(jobId);
  if (!job) return false;
  job.listeners.push(listener);
  return true;
}

export function getActiveJob(jobId: string): ActiveJob | undefined {
  return activeJobs.get(jobId);
}
