/**
 * LuminaPress Video Studio — Shared Type Definitions
 */

export type CompressionMode = 'simple' | 'target_size' | 'advanced';

export type SimpleGoal =
  | 'max_compression'   // 70-80% reduction, aggressive CRF
  | 'balanced'          // 50% reduction, indistinguishable quality
  | 'archive'           // 20-35% reduction, high fidelity near-lossless
  | 'discord_25'        // Target <= 25MB for Discord/Email
  | 'discord_10'        // Target <= 10MB
  | 'whatsapp_hd'       // Optimized 720p/1080p for mobile apps
  | 'telegram_fast'     // Fast encoding for immediate share
  | 'gif_export';       // High-quality animated GIF with palettegen

export type VideoCodec =
  | 'libx264'
  | 'libx265'
  | 'libsvtav1'
  | 'h264_nvenc'
  | 'hevc_nvenc'
  | 'av1_nvenc'
  | 'h264_qsv'
  | 'hevc_qsv'
  | 'h264_amf'
  | 'hevc_amf'
  | 'h264_mf'
  | 'gif';

export type EncoderSpeedPreset =
  | 'ultrafast'
  | 'superfast'
  | 'veryfast'
  | 'faster'
  | 'fast'
  | 'medium'
  | 'slow'
  | 'slower'
  | 'veryslow';

export type ResolutionPreset =
  | 'original'
  | '4k'        // 3840x2160
  | '1440p'     // 2560x1440
  | '1080p'     // 1920x1080
  | '720p'      // 1280x720
  | '480p';      // 854x480

export type AudioAction =
  | 'copy'      // Lossless passthrough
  | 'aac'       // Standard AAC
  | 'opus'      // High efficiency Opus
  | 'mp3'
  | 'remove';   // Mute audio track

export interface VideoStreamInfo {
  index: number;
  codecName: string;
  codecLongName?: string;
  profile?: string;
  width: number;
  height: number;
  aspectRatio: string;
  fps: number;
  pixelFormat: string;
  bitrate?: number; // bits per second
  durationSeconds: number;
  frameCount?: number;
}

export interface AudioStreamInfo {
  index: number;
  codecName: string;
  channels: number;
  channelLayout?: string;
  sampleRate: number;
  bitrate?: number; // bits per second
  language?: string;
}

export interface MediaProbeResult {
  filePath: string;
  fileName: string;
  fileSizeBytes: number;
  durationSeconds: number;
  containerFormat: string;
  overallBitrate?: number;
  videoStreams: VideoStreamInfo[];
  audioStreams: AudioStreamInfo[];
  subtitleCount: number;
  hasAudio: boolean;
  hasVideo: boolean;
  primaryVideo?: VideoStreamInfo;
  primaryAudio?: AudioStreamInfo;
}

export interface SimpleModeConfig {
  goal: SimpleGoal;
  speedPriority: 'fast' | 'balanced' | 'best_quality';
  useHardwareAccel?: boolean;
}

export interface TargetSizeModeConfig {
  targetSizeMB: number;
  twoPass: boolean;
  allowDownscale: boolean; // Auto-downscale to 720p/480p if budget is too tight
  audioBitrateKbps: number;
  preferHardware?: boolean;
}

export interface AdvancedModeConfig {
  codec: VideoCodec;
  crf?: number; // 0-51 (lower = higher quality)
  videoBitrateKbps?: number; // For average bitrate / 2-pass
  twoPass: boolean;
  preset: EncoderSpeedPreset;
  resolution: ResolutionPreset;
  customScaleWidth?: number;
  customScaleHeight?: number;
  fps?: number; // 0 = keep original
  audioAction: AudioAction;
  audioBitrateKbps: number;
  keepSubtitles: boolean;
  stripMetadata: boolean;
}

export interface CompressionJobConfig {
  sourceFilePath: string;
  outputFilePath?: string; // Optional custom destination; auto-generated if omitted
  mode: CompressionMode;
  simpleConfig?: SimpleModeConfig;
  targetSizeConfig?: TargetSizeModeConfig;
  advancedConfig?: AdvancedModeConfig;
}

export interface DecisionEstimate {
  resolvedCodec: VideoCodec;
  resolvedPreset: EncoderSpeedPreset;
  resolvedWidth: number;
  resolvedHeight: number;
  resolvedFps: number;
  crf?: number;
  targetVideoBitrateKbps?: number;
  targetAudioBitrateKbps: number;
  twoPass: boolean;
  estimatedSizeBytes: number;
  estimatedSizeMB: number;
  estimatedReductionPercent: number;
  estimatedDurationSeconds: number;
  warnings: string[];
  explanation: string;
}

export interface EncodingProgress {
  jobId: string;
  frame: number;
  totalEstimatedFrames: number;
  fps: number;
  speed: string; // e.g. "2.4x"
  currentSizeFormatted: string;
  currentTimeSeconds: number;
  totalDurationSeconds: number;
  percent: number; // 0-100
  etaSeconds: number;
  stage: 'pass_1' | 'pass_2' | 'encoding' | 'finalizing';
}

export interface QualityScore {
  ssim?: number; // 0 - 1.0 (higher = closer to source)
  psnr?: number; // dB
  testedFrames?: number;
}

export interface CompressionOutcome {
  jobId: string;
  sourceFilePath: string;
  outputFilePath: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savedBytes: number;
  savedPercent: number;
  durationSeconds: number; // Duration of video
  processingTimeSeconds: number; // Wall-clock time to compress
  averageFps: number;
  averageSpeed: string;
  actualVideoCodec: string;
  quality?: QualityScore;
  success: boolean;
  errorMessage?: string;
}

export interface HardwareEncoderSupport {
  id: string;
  name: string;
  codec: 'h264' | 'hevc' | 'av1';
  type: 'nvenc' | 'qsv' | 'amf' | 'mf' | 'cpu';
  available: boolean;
}

export interface HardwareStatus {
  hasNvidia: boolean;
  hasIntel: boolean;
  hasAmd: boolean;
  hasMf: boolean;
  gpuModel?: string;
  encoders: HardwareEncoderSupport[];
  recommendedH264: string;
  recommendedHEVC: string;
}

export interface QueueJob {
  id: string;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  status: 'pending' | 'probing' | 'ready' | 'encoding' | 'completed' | 'failed' | 'cancelled';
  config: CompressionJobConfig;
  probeData?: MediaProbeResult;
  estimate?: DecisionEstimate;
  progress?: EncodingProgress;
  result?: CompressionOutcome;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}
