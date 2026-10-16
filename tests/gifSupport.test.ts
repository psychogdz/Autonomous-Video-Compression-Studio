import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { probeMedia } from '../server/src/engine/probeService.js';
import { makeCompressionDecision } from '../server/src/engine/decisionEngine.js';
import { startCompressionJob } from '../server/src/engine/encoderService.js';

const testVideoPath = path.resolve(process.cwd(), 'tests/fixtures/sample_test_video.mp4');
const testGifPath = path.resolve(process.cwd(), 'tests/fixtures/sample_test.gif');

describe('GIF Input & Output Support Verification', () => {
  beforeAll(() => {
    expect(fs.existsSync(testVideoPath), 'Sample test video must exist').toBe(true);
    expect(fs.existsSync(testGifPath), 'Sample test GIF must exist').toBe(true);
  });

  it('1. Probe Service should analyze animated GIF input files correctly', async () => {
    const probe = await probeMedia(testGifPath);
    expect(probe.fileName).toBe('sample_test.gif');
    expect(probe.hasVideo).toBe(true);
    expect(probe.hasAudio).toBe(false); // GIFs have no audio stream
    expect(probe.primaryVideo).toBeDefined();
    expect(probe.primaryVideo?.codecName).toBe('gif');
    expect(probe.primaryVideo?.width).toBe(320);
    expect(probe.primaryVideo?.height).toBe(240);
    expect(probe.primaryVideo?.fps).toBe(10);
    expect(probe.durationSeconds).toBeCloseTo(2.0, 0.5);
  });

  it('2. Decision Engine should calibrate parameters for GIF Export goal', async () => {
    const videoProbe = await probeMedia(testVideoPath);
    const decision = makeCompressionDecision(videoProbe, {
      sourceFilePath: testVideoPath,
      mode: 'simple',
      simpleConfig: { goal: 'gif_export', speedPriority: 'balanced' },
    });

    expect(decision.resolvedCodec).toBe('gif');
    expect(decision.targetAudioBitrateKbps).toBe(0);
    expect(decision.resolvedFps).toBeLessThanOrEqual(15);
    expect(decision.explanation).toContain('palettegen');
  });

  it('3. Video to Animated GIF Conversion should produce a valid, high-quality .gif file', async () => {
    const outputGifPath = path.resolve(process.cwd(), 'temp/e2e_output_test.gif');
    if (fs.existsSync(outputGifPath)) {
      fs.unlinkSync(outputGifPath);
    }

    const outcome = await startCompressionJob('test_video_to_gif', {
      sourceFilePath: testVideoPath,
      outputFilePath: outputGifPath,
      mode: 'simple',
      simpleConfig: { goal: 'gif_export', speedPriority: 'balanced' },
    });

    expect(outcome.success).toBe(true);
    expect(fs.existsSync(outputGifPath)).toBe(true);
    expect(outputGifPath.endsWith('.gif')).toBe(true);

    const probe = await probeMedia(outputGifPath);
    expect(probe.primaryVideo?.codecName).toBe('gif');
    expect(probe.hasVideo).toBe(true);

    fs.unlinkSync(outputGifPath);
  });

  it('4. Animated GIF to MP4 Conversion should compress GIF into high-efficiency video', async () => {
    const outputMp4Path = path.resolve(process.cwd(), 'temp/e2e_gif_to_video.mp4');
    if (fs.existsSync(outputMp4Path)) {
      fs.unlinkSync(outputMp4Path);
    }

    const outcome = await startCompressionJob('test_gif_to_video', {
      sourceFilePath: testGifPath,
      outputFilePath: outputMp4Path,
      mode: 'simple',
      simpleConfig: { goal: 'max_compression', speedPriority: 'fast' },
    });

    expect(outcome.success).toBe(true);
    expect(fs.existsSync(outputMp4Path)).toBe(true);

    const probe = await probeMedia(outputMp4Path);
    expect(probe.hasVideo).toBe(true);
    expect(probe.primaryVideo?.codecName).toBe('hevc'); // converted to H.265 video

    fs.unlinkSync(outputMp4Path);
  });
});
