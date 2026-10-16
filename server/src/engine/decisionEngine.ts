import {
  MediaProbeResult,
  CompressionJobConfig,
  DecisionEstimate,
  VideoCodec,
  EncoderSpeedPreset,
  ResolutionPreset,
} from '../../../shared/types.js';

export interface ResolutionDimensions {
  width: number;
  height: number;
}

/**
 * Resolves standard target resolution based on preset and source aspect ratio.
 */
export function resolveResolution(
  preset: ResolutionPreset,
  sourceWidth: number,
  sourceHeight: number,
  customWidth?: number,
  customHeight?: number
): ResolutionDimensions {
  if (preset === 'original' || !sourceWidth || !sourceHeight) {
    return { width: sourceWidth || 1920, height: sourceHeight || 1080 };
  }

  const aspectRatio = sourceWidth / sourceHeight;
  const isVertical = sourceHeight > sourceWidth;

  const targetHeightMap: Record<string, number> = {
    '4k': 2160,
    '1440p': 1440,
    '1080p': 1080,
    '720p': 720,
    '480p': 480,
  };

  const desiredHeight = targetHeightMap[preset];
  if (!desiredHeight) {
    if (customWidth && customHeight) {
      return {
        width: Math.round(customWidth / 2) * 2,
        height: Math.round(customHeight / 2) * 2,
      };
    }
    return { width: sourceWidth, height: sourceHeight };
  }

  // Never upscale in a compression studio
  if (desiredHeight >= sourceHeight) {
    return {
      width: Math.round(sourceWidth / 2) * 2,
      height: Math.round(sourceHeight / 2) * 2,
    };
  }

  let finalWidth: number;
  let finalHeight: number;

  if (isVertical) {
    finalWidth = desiredHeight;
    finalHeight = Math.round(finalWidth / aspectRatio);
  } else {
    finalHeight = desiredHeight;
    finalWidth = Math.round(finalHeight * aspectRatio);
  }

  // FFmpeg requires even dimensions for H.264/H.265 (yuv420p)
  finalWidth = Math.round(finalWidth / 2) * 2;
  finalHeight = Math.round(finalHeight / 2) * 2;

  return { width: finalWidth, height: finalHeight };
}

/**
 * Intelligent decision engine that converts user intent into verified FFmpeg configuration.
 */
export function makeCompressionDecision(
  probe: MediaProbeResult,
  config: CompressionJobConfig,
  availableHardwareEncoders: string[] = []
): DecisionEstimate {
  const warnings: string[] = [];
  const primaryVideo = probe.primaryVideo;
  const sourceWidth = primaryVideo?.width || 1920;
  const sourceHeight = primaryVideo?.height || 1080;
  const sourceFps = primaryVideo?.fps || 30;
  const durationSeconds = Math.max(1, probe.durationSeconds);
  const sourceSizeBytes = probe.fileSizeBytes;
  const sourceBitrateKbps = probe.overallBitrate ? Math.round(probe.overallBitrate / 1000) : Math.round((sourceSizeBytes * 8) / (durationSeconds * 1000));

  let resolvedCodec: VideoCodec = 'libx264';
  let resolvedPreset: EncoderSpeedPreset = 'medium';
  let resolvedWidth = sourceWidth;
  let resolvedHeight = sourceHeight;
  let resolvedFps = sourceFps;
  let crf: number | undefined = 23;
  let targetVideoBitrateKbps: number | undefined;
  let targetAudioBitrateKbps = 128;
  let twoPass = false;
  let estimatedSizeBytes = Math.round(sourceSizeBytes * 0.5);
  let explanation = '';

  const hasNvenc = availableHardwareEncoders.includes('h264_nvenc');

  // --- A. SIMPLE MODE ---
  if (config.mode === 'simple') {
    const simple = config.simpleConfig || { goal: 'balanced', speedPriority: 'balanced' };

    switch (simple.goal) {
      case 'max_compression': {
        resolvedCodec = 'libx265';
        crf = 28;
        resolvedPreset = simple.speedPriority === 'fast' ? 'fast' : 'slow';
        targetAudioBitrateKbps = 96;

        // Auto downscale 4K/1440p to 1080p for massive size reduction
        if (sourceHeight > 1080) {
          const dims = resolveResolution('1080p', sourceWidth, sourceHeight);
          resolvedWidth = dims.width;
          resolvedHeight = dims.height;
          warnings.push(`Downscaled from ${sourceHeight}p to 1080p to maximize compression ratio.`);
        }

        estimatedSizeBytes = Math.round(sourceSizeBytes * 0.28);
        explanation = 'Maximum Compression: Using high-efficiency H.265/HEVC with CRF 28 and 96k audio to achieve up to 70–80% size reduction.';
        break;
      }

      case 'archive': {
        resolvedCodec = 'libx265';
        crf = 21;
        resolvedPreset = 'slow';
        targetAudioBitrateKbps = 192;
        estimatedSizeBytes = Math.round(sourceSizeBytes * 0.70);
        explanation = 'Archival Quality: Using H.265/HEVC at low CRF 21 with slow preset to ensure visually near-lossless preservation.';
        break;
      }

      case 'discord_25': {
        // Target 24.5 MB for safety margin under 25MB limit
        return calculateTargetSizeDecision(probe, {
          targetSizeMB: 24.5,
          twoPass: true,
          allowDownscale: true,
          audioBitrateKbps: 96,
        }, availableHardwareEncoders);
      }

      case 'discord_10': {
        return calculateTargetSizeDecision(probe, {
          targetSizeMB: 9.5,
          twoPass: true,
          allowDownscale: true,
          audioBitrateKbps: 80,
        }, availableHardwareEncoders);
      }

      case 'whatsapp_hd': {
        resolvedCodec = 'libx264';
        crf = 24;
        resolvedPreset = 'fast';
        targetAudioBitrateKbps = 128;
        if (sourceHeight > 720) {
          const dims = resolveResolution('720p', sourceWidth, sourceHeight);
          resolvedWidth = dims.width;
          resolvedHeight = dims.height;
        }
        estimatedSizeBytes = Math.round(sourceSizeBytes * 0.35);
        explanation = 'WhatsApp Optimized: Formatted to 720p H.264 Baseline/Main profile for instant playback on iOS & Android devices.';
        break;
      }

      case 'telegram_fast': {
        const workingHwEncoder = availableHardwareEncoders.includes('h264_nvenc')
          ? 'h264_nvenc'
          : availableHardwareEncoders.includes('h264_mf')
          ? 'h264_mf'
          : availableHardwareEncoders.includes('h264_qsv')
          ? 'h264_qsv'
          : availableHardwareEncoders.includes('h264_amf')
          ? 'h264_amf'
          : undefined;

        resolvedCodec = simple.useHardwareAccel && workingHwEncoder ? (workingHwEncoder as VideoCodec) : 'libx264';
        crf = 25;
        resolvedPreset = 'veryfast';
        targetAudioBitrateKbps = 128;
        estimatedSizeBytes = Math.round(sourceSizeBytes * 0.40);
        explanation = 'Telegram Fast: Optimized for rapid encoding and high mobile compatibility.';
        break;
      }

      case 'gif_export': {
        resolvedCodec = 'gif';
        resolvedFps = Math.min(15, sourceFps > 0 ? sourceFps : 15);
        crf = undefined;
        targetAudioBitrateKbps = 0;
        if (sourceHeight > 720) {
          const dims = resolveResolution('720p', sourceWidth, sourceHeight);
          resolvedWidth = dims.width;
          resolvedHeight = dims.height;
          warnings.push(`Downscaled to 720p to maintain efficient GIF file size.`);
        }
        const effectiveGifDuration = Math.min(15, durationSeconds);
        if (durationSeconds > 15) {
          warnings.push('Animated GIF export duration capped to the first 15 seconds for optimal web messaging and file size.');
        }
        estimatedSizeBytes = Math.round(resolvedWidth * resolvedHeight * resolvedFps * effectiveGifDuration * 0.22);
        explanation = 'Animated GIF: Exporting high-fidelity animated GIF using 256-color palettegen with Lanczos scaling and Bayer dithering.';
        break;
      }

      case 'balanced':
      default: {
        resolvedCodec = 'libx264';
        crf = 23;
        resolvedPreset = simple.speedPriority === 'fast' ? 'faster' : 'medium';
        targetAudioBitrateKbps = 128;
        estimatedSizeBytes = Math.round(sourceSizeBytes * 0.48);
        explanation = 'Balanced: Standard industry recommendation balancing visually transparent quality and ~50% size reduction.';
        break;
      }
    }
  }

  // --- B. TARGET SIZE MODE ---
  else if (config.mode === 'target_size') {
    const targetConfig = config.targetSizeConfig || {
      targetSizeMB: Math.max(5, Math.round(sourceSizeBytes / (1024 * 1024 * 2))),
      twoPass: true,
      allowDownscale: true,
      audioBitrateKbps: 128,
    };
    return calculateTargetSizeDecision(probe, targetConfig, availableHardwareEncoders);
  }

  // --- C. ADVANCED MODE ---
  else if (config.mode === 'advanced') {
    const adv = config.advancedConfig || {
      codec: 'libx264',
      crf: 23,
      twoPass: false,
      preset: 'medium',
      resolution: 'original',
      audioAction: 'aac',
      audioBitrateKbps: 128,
      keepSubtitles: true,
      stripMetadata: false,
    };

    resolvedCodec = adv.codec;
    resolvedPreset = adv.preset;
    twoPass = adv.twoPass;

    const dims = resolveResolution(adv.resolution, sourceWidth, sourceHeight, adv.customScaleWidth, adv.customScaleHeight);
    resolvedWidth = dims.width;
    resolvedHeight = dims.height;
    resolvedFps = adv.fps && adv.fps > 0 ? adv.fps : sourceFps;

    if (adv.codec === 'gif') {
      resolvedCodec = 'gif';
      crf = undefined;
      targetAudioBitrateKbps = 0;
      resolvedFps = adv.fps && adv.fps > 0 ? adv.fps : Math.min(15, sourceFps > 0 ? sourceFps : 15);
      estimatedSizeBytes = Math.round(resolvedWidth * resolvedHeight * resolvedFps * durationSeconds * 0.22);
      explanation = `Advanced GIF: Animated GIF export at ${resolvedWidth}x${resolvedHeight} @ ${resolvedFps}fps.`;
    } else if (adv.videoBitrateKbps && adv.videoBitrateKbps > 0) {
      targetVideoBitrateKbps = adv.videoBitrateKbps;
      crf = undefined;
      const totalBitrate = targetVideoBitrateKbps + adv.audioBitrateKbps;
      estimatedSizeBytes = Math.round((totalBitrate * 1000 * durationSeconds) / 8);
    } else {
      crf = adv.crf ?? 23;
      // Heuristic CRF estimation relative to source bitrate
      const crfFactor = Math.pow(0.88, crf - 18);
      const resFactor = (resolvedWidth * resolvedHeight) / (sourceWidth * sourceHeight);
      estimatedSizeBytes = Math.min(
        sourceSizeBytes * 0.95,
        Math.max(1024 * 100, Math.round(sourceSizeBytes * crfFactor * resFactor))
      );
    }

    targetAudioBitrateKbps = adv.audioAction === 'remove' ? 0 : adv.audioBitrateKbps;
    explanation = `Advanced: Custom configuration using ${resolvedCodec} with ${crf !== undefined ? `CRF ${crf}` : `${targetVideoBitrateKbps} kbps`} at ${resolvedWidth}x${resolvedHeight}.`;
  }

  // Boundary Warnings
  if (estimatedSizeBytes >= sourceSizeBytes) {
    warnings.push('Estimated compressed size is close to or exceeds original size. Consider increasing CRF or lowering resolution.');
  }
  if (targetVideoBitrateKbps && targetVideoBitrateKbps >= sourceBitrateKbps) {
    warnings.push(`Target video bitrate (${targetVideoBitrateKbps} kbps) is higher than source bitrate (${sourceBitrateKbps} kbps). Re-encoding will increase file size without adding quality.`);
  }

  const estimatedSizeMB = Math.round((estimatedSizeBytes / (1024 * 1024)) * 100) / 100;
  const estimatedReductionPercent = Math.max(0, Math.round(((sourceSizeBytes - estimatedSizeBytes) / sourceSizeBytes) * 100));

  // Heuristic duration estimate
  const isGpu = resolvedCodec.includes('nvenc') || resolvedCodec.includes('qsv') || resolvedCodec.includes('amf');
  const speedMultiplier = isGpu ? 3.5 : resolvedPreset === 'ultrafast' ? 4.0 : resolvedPreset === 'fast' ? 2.0 : 1.2;
  const estimatedDurationSeconds = Math.max(2, Math.round((durationSeconds / speedMultiplier) * (twoPass ? 2.1 : 1.0)));

  return {
    resolvedCodec,
    resolvedPreset,
    resolvedWidth,
    resolvedHeight,
    resolvedFps,
    crf,
    targetVideoBitrateKbps,
    targetAudioBitrateKbps,
    twoPass,
    estimatedSizeBytes,
    estimatedSizeMB,
    estimatedReductionPercent,
    estimatedDurationSeconds,
    warnings,
    explanation,
  };
}

/**
 * Dedicated mathematical budget calculation for Target Size Mode.
 */
function calculateTargetSizeDecision(
  probe: MediaProbeResult,
  targetConfig: { targetSizeMB: number; twoPass: boolean; allowDownscale: boolean; audioBitrateKbps: number },
  availableHardwareEncoders: string[]
): DecisionEstimate {
  const warnings: string[] = [];
  const primaryVideo = probe.primaryVideo;
  let sourceWidth = primaryVideo?.width || 1920;
  let sourceHeight = primaryVideo?.height || 1080;
  const sourceFps = primaryVideo?.fps || 30;
  const durationSeconds = Math.max(1, probe.durationSeconds);
  const targetBytes = targetConfig.targetSizeMB * 1024 * 1024;
  const targetBits = targetBytes * 8;

  // Audio budget
  let audioBitrateKbps = targetConfig.audioBitrateKbps || 128;
  let audioBits = audioBitrateKbps * 1000 * durationSeconds;

  // If audio alone exceeds 35% of target budget, clamp audio bitrate down
  if (audioBits > targetBits * 0.35) {
    audioBitrateKbps = Math.max(48, Math.round((targetBits * 0.20) / (durationSeconds * 1000)));
    audioBits = audioBitrateKbps * 1000 * durationSeconds;
    warnings.push(`Reduced audio bitrate to ${audioBitrateKbps} kbps to allocate sufficient budget for video.`);
  }

  const remainingBitsForVideo = Math.max(targetBits * 0.5, targetBits - audioBits);
  let targetVideoBitrateKbps = Math.round(remainingBitsForVideo / (durationSeconds * 1000));

  // Determine ideal resolution for this bitrate to avoid blocky compression artifacts
  const bpp = (targetVideoBitrateKbps * 1000) / (sourceWidth * sourceHeight * sourceFps);
  let resolvedWidth = sourceWidth;
  let resolvedHeight = sourceHeight;

  // Bits-per-pixel threshold: if bpp is too low (< 0.04), downscaling yields dramatically sharper visuals
  if (targetConfig.allowDownscale) {
    if (bpp < 0.04 && sourceHeight > 1080) {
      const dims = resolveResolution('1080p', sourceWidth, sourceHeight);
      resolvedWidth = dims.width;
      resolvedHeight = dims.height;
      warnings.push(`Auto-downscaled to 1080p: Target size is too low for ${sourceHeight}p; 1080p produces significantly higher visual clarity.`);
    } else if (bpp < 0.03 && sourceHeight > 720) {
      const dims = resolveResolution('720p', sourceWidth, sourceHeight);
      resolvedWidth = dims.width;
      resolvedHeight = dims.height;
      warnings.push(`Auto-downscaled to 720p: Low bitrate budget requires 720p to prevent severe compression artifacts.`);
    } else if (bpp < 0.02 && sourceHeight > 480) {
      const dims = resolveResolution('480p', sourceWidth, sourceHeight);
      resolvedWidth = dims.width;
      resolvedHeight = dims.height;
      warnings.push(`Auto-downscaled to 480p to fit extreme target size constraint.`);
    }
  }

  // Codec choice: x265 or x264
  const resolvedCodec: VideoCodec = 'libx264';
  const resolvedPreset: EncoderSpeedPreset = 'medium';
  const twoPass = targetConfig.twoPass !== false;

  const estimatedSizeBytes = targetBytes;
  const estimatedSizeMB = targetConfig.targetSizeMB;
  const estimatedReductionPercent = Math.max(0, Math.round(((probe.fileSizeBytes - estimatedSizeBytes) / probe.fileSizeBytes) * 100));
  const estimatedDurationSeconds = Math.round(durationSeconds * (twoPass ? 1.8 : 0.9));

  return {
    resolvedCodec,
    resolvedPreset,
    resolvedWidth,
    resolvedHeight,
    resolvedFps: sourceFps,
    targetVideoBitrateKbps,
    targetAudioBitrateKbps: audioBitrateKbps,
    twoPass,
    estimatedSizeBytes,
    estimatedSizeMB,
    estimatedReductionPercent,
    estimatedDurationSeconds,
    warnings,
    explanation: `Target Size: Calibrated 2-Pass average video bitrate of ${targetVideoBitrateKbps} kbps + ${audioBitrateKbps} kbps audio to strictly match ${targetConfig.targetSizeMB} MB.`,
  };
}
