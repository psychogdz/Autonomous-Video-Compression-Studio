import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { locateBinaries } from '../server/src/engine/binaryLocator.js';
import { probeMedia } from '../server/src/engine/probeService.js';
import { detectHardwareCapabilities } from '../server/src/engine/hardwareAccel.js';
import { makeCompressionDecision } from '../server/src/engine/decisionEngine.js';
import { startCompressionJob, cancelCompressionJob } from '../server/src/engine/encoderService.js';
import { calculateQualityMetrics } from '../server/src/engine/qualityMetrics.js';
import { EncodingProgress } from '../shared/types.js';

const testVideoPath = path.resolve(process.cwd(), 'tests/fixtures/sample_test_video.mp4');

describe('Phase 1: LuminaPress Core Video Engine & Functional Prototype', () => {
  beforeAll(() => {
    expect(fs.existsSync(testVideoPath), 'Test video fixture must exist').toBe(true);
  });

  it('1. Binary Locator should discover and validate local FFmpeg & FFprobe', async () => {
    const binaries = await locateBinaries();
    expect(binaries.ffmpegPath).toBeTruthy();
    expect(binaries.ffprobePath).toBeTruthy();
    expect(fs.existsSync(binaries.ffmpegPath)).toBe(true);
    expect(fs.existsSync(binaries.ffprobePath)).toBe(true);
    expect(binaries.version).toContain('9.0.2');
  });

  it('2. Probe Service should accurately extract video and audio metadata', async () => {
    const probe = await probeMedia(testVideoPath);

    expect(probe.fileName).toBe('sample_test_video.mp4');
    expect(probe.fileSizeBytes).toBeGreaterThan(100000);
    expect(probe.durationSeconds).toBeCloseTo(5.0, 0.5);
    expect(probe.hasVideo).toBe(true);
    expect(probe.hasAudio).toBe(true);

    const video = probe.primaryVideo;
    expect(video).toBeDefined();
    expect(video?.width).toBe(1920);
    expect(video?.height).toBe(1080);
    expect(video?.fps).toBe(30);
    expect(video?.codecName).toBe('h264');

    const audio = probe.primaryAudio;
    expect(audio).toBeDefined();
    expect(audio?.codecName).toBe('aac');
    expect(audio?.sampleRate).toBe(44100);
  });

  it('3. Hardware Detection should probe available encoders', async () => {
    const hw = await detectHardwareCapabilities();
    expect(hw.encoders).toBeInstanceOf(Array);
    expect(hw.encoders.length).toBeGreaterThan(0);
    // At minimum, CPU encoders are available
    expect(hw.encoders.some(e => e.id === 'libx264')).toBe(true);
  });

  it('4. Decision Engine should calculate optimal parameters for all 3 modes', async () => {
    const probe = await probeMedia(testVideoPath);

    // Simple Mode: Max Compression
    const simpleMax = makeCompressionDecision(probe, {
      sourceFilePath: testVideoPath,
      mode: 'simple',
      simpleConfig: { goal: 'max_compression', speedPriority: 'balanced' },
    });
    expect(simpleMax.resolvedCodec).toBe('libx265');
    expect(simpleMax.crf).toBe(28);
    expect(simpleMax.estimatedSizeBytes).toBeLessThan(probe.fileSizeBytes);

    // Target Size Mode: 0.5 MB budget
    const targetDecision = makeCompressionDecision(probe, {
      sourceFilePath: testVideoPath,
      mode: 'target_size',
      targetSizeConfig: {
        targetSizeMB: 0.5,
        twoPass: true,
        allowDownscale: true,
        audioBitrateKbps: 64,
      },
    });
    expect(targetDecision.twoPass).toBe(true);
    expect(targetDecision.targetVideoBitrateKbps).toBeGreaterThan(0);
    expect(targetDecision.estimatedSizeMB).toBe(0.5);

    // Advanced Mode: 720p scale down with CRF 26
    const advDecision = makeCompressionDecision(probe, {
      sourceFilePath: testVideoPath,
      mode: 'advanced',
      advancedConfig: {
        codec: 'libx264',
        crf: 26,
        twoPass: false,
        preset: 'fast',
        resolution: '720p',
        audioAction: 'aac',
        audioBitrateKbps: 96,
        keepSubtitles: true,
        stripMetadata: false,
      },
    });
    expect(advDecision.resolvedWidth).toBe(1280);
    expect(advDecision.resolvedHeight).toBe(720);
    expect(advDecision.crf).toBe(26);
  });

  it('5. End-to-End Compression should execute real FFmpeg encoding with live progress', async () => {
    const outputPath = path.resolve(process.cwd(), 'temp/e2e_compressed_test.mp4');
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    const progressEvents: EncodingProgress[] = [];

    const outcome = await startCompressionJob(
      'test_job_1',
      {
        sourceFilePath: testVideoPath,
        outputFilePath: outputPath,
        mode: 'simple',
        simpleConfig: { goal: 'max_compression', speedPriority: 'fast' },
      },
      (p) => {
        progressEvents.push(p);
      }
    );

    // Verify progress events were emitted
    expect(progressEvents.length).toBeGreaterThan(0);
    const lastProgress = progressEvents[progressEvents.length - 1];
    expect(lastProgress.percent).toBeGreaterThan(0);

    // Verify outcome
    expect(outcome.success).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);
    const outStat = fs.statSync(outputPath);
    expect(outStat.size).toBeGreaterThan(1000); // Non-empty valid file
    expect(outStat.size).toBeLessThan(outcome.originalSizeBytes); // Proven size reduction!
    expect(outcome.savedPercent).toBeGreaterThan(0);

    // Verify output playability using probe
    const outputProbe = await probeMedia(outputPath);
    expect(outputProbe.hasVideo).toBe(true);
    expect(outputProbe.primaryVideo?.codecName).toBe('hevc'); // x265 verified
    expect(outputProbe.durationSeconds).toBeCloseTo(5.0, 0.5);

    // Cleanup test output
    fs.unlinkSync(outputPath);
  });

  it('6. SSIM / PSNR Quality Service should measure visual fidelity', async () => {
    // Generate a quick compressed file to compare
    const outputPath = path.resolve(process.cwd(), 'temp/quality_test.mp4');
    await startCompressionJob('test_job_quality', {
      sourceFilePath: testVideoPath,
      outputFilePath: outputPath,
      mode: 'simple',
      simpleConfig: { goal: 'balanced', speedPriority: 'fast' },
    });

    const metrics = await calculateQualityMetrics(testVideoPath, outputPath, 3);
    expect(metrics.ssim).toBeDefined();
    expect(metrics.ssim!).toBeGreaterThan(0.85); // High visual similarity
    expect(metrics.psnr).toBeDefined();
    expect(metrics.psnr!).toBeGreaterThan(25);

    fs.unlinkSync(outputPath);
  });

  it('7. Cancellation should terminate process and clean up temporary files immediately', async () => {
    const cancelOutputPath = path.resolve(process.cwd(), 'temp/cancel_test.mp4');

    // Start slow encoding job
    const startPromise = startCompressionJob('test_job_cancel', {
      sourceFilePath: testVideoPath,
      outputFilePath: cancelOutputPath,
      mode: 'advanced',
      advancedConfig: {
        codec: 'libx265',
        preset: 'veryslow',
        twoPass: false,
        resolution: 'original',
        audioAction: 'aac',
        audioBitrateKbps: 128,
        keepSubtitles: false,
        stripMetadata: false,
      },
    });

    // Cancel after 150ms
    await new Promise((r) => setTimeout(r, 150));
    const wasCancelled = cancelCompressionJob('test_job_cancel');
    expect(wasCancelled).toBe(true);

    await expect(startPromise).rejects.toThrow();
    // Incomplete file must be deleted to avoid leaving corrupted partial output
    expect(fs.existsSync(cancelOutputPath)).toBe(false);
  });
});
