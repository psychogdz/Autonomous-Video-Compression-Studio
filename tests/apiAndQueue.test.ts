import { describe, it, expect } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { app } from '../server/src/index.js';
import { queueManager } from '../server/src/engine/queueManager.js';

const testVideoPath = path.resolve(process.cwd(), 'tests/fixtures/sample_test_video.mp4');

describe('Phase 2 & 3: API Endpoints, Range Streaming & Queue Manager', () => {
  it('1. GET /api/health should return ok and FFmpeg binary details', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.ffmpeg).toBeDefined();
    expect(res.body.ffmpeg.version).toContain('9.0.2');
  });

  it('2. GET /api/hardware should return detected encoders', async () => {
    const res = await request(app).get('/api/hardware');
    expect(res.status).toBe(200);
    expect(res.body.encoders).toBeInstanceOf(Array);
    expect(res.body.encoders.length).toBeGreaterThan(0);
    expect(res.body.recommendedH264).toBeTruthy();
  });

  it('3. POST /api/probe should analyze file metadata', async () => {
    const res = await request(app)
      .post('/api/probe')
      .send({ filePath: testVideoPath });

    expect(res.status).toBe(200);
    expect(res.body.fileName).toBe('sample_test_video.mp4');
    expect(res.body.primaryVideo.width).toBe(1920);
    expect(res.body.primaryVideo.height).toBe(1080);
    expect(res.body.hasAudio).toBe(true);
  });

  it('4. POST /api/decision should return pre-flight estimates', async () => {
    const probeRes = await request(app)
      .post('/api/probe')
      .send({ filePath: testVideoPath });

    const decisionRes = await request(app)
      .post('/api/decision')
      .send({
        probe: probeRes.body,
        config: {
          sourceFilePath: testVideoPath,
          mode: 'simple',
          simpleConfig: { goal: 'max_compression', speedPriority: 'fast' },
        },
      });

    expect(decisionRes.status).toBe(200);
    expect(decisionRes.body.resolvedCodec).toBe('libx265');
    expect(decisionRes.body.estimatedReductionPercent).toBeGreaterThan(50);
  });

  it('5. GET /api/stream should support HTTP 206 partial content range requests', async () => {
    const res = await request(app)
      .get(`/api/stream?path=${encodeURIComponent(testVideoPath)}`)
      .set('Range', 'bytes=0-1024');

    expect(res.status).toBe(206);
    expect(res.headers['content-range']).toContain('bytes 0-1024/');
    expect(res.headers['content-type']).toBe('video/mp4');
  });

  it('6. Queue Manager should support adding, updating, and removing batch jobs', async () => {
    const job = await queueManager.addToQueue(testVideoPath, {
      mode: 'simple',
      simpleConfig: { goal: 'balanced', speedPriority: 'balanced' },
    });

    expect(job.id).toBeTruthy();
    expect(job.filePath).toBe(testVideoPath);

    const queue = queueManager.getQueue();
    expect(queue.some((j) => j.id === job.id)).toBe(true);

    // Cancel / remove job
    const removed = queueManager.removeJob(job.id);
    expect(removed).toBe(true);
  });
});
