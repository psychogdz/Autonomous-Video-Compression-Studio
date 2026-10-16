import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { locateBinaries } from './binaryLocator.js';
import { MediaProbeResult, VideoStreamInfo, AudioStreamInfo } from '../../../shared/types.js';

const execFileAsync = promisify(execFile);

/**
 * Parses fractional frame rate string (e.g. "30000/1001" or "24/1") to numeric FPS.
 */
export function parseFps(fpsString?: string): number {
  if (!fpsString || fpsString === '0/0') return 30; // sensible fallback
  if (fpsString.includes('/')) {
    const [num, den] = fpsString.split('/').map(Number);
    if (!den || isNaN(num) || isNaN(den)) return 30;
    const result = Math.round((num / den) * 100) / 100;
    return result > 0 && result < 300 ? result : 30;
  }
  const parsed = parseFloat(fpsString);
  return !isNaN(parsed) && parsed > 0 ? parsed : 30;
}

/**
 * Computes standard aspect ratio string (e.g. "16:9", "4:3", "21:9").
 */
export function calculateAspectRatio(width: number, height: number): string {
  if (!width || !height) return '16:9';
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;

  // Approximate common ratios
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9';
  if (Math.abs(ratio - 4 / 3) < 0.05) return '4:3';
  if (Math.abs(ratio - 21 / 9) < 0.05) return '21:9';
  if (Math.abs(ratio - 1) < 0.05) return '1:1';
  if (Math.abs(ratio - 9 / 16) < 0.05) return '9:16 (Vertical)';

  return `${w}:${h}`;
}

/**
 * Analyzes video file using ffprobe.
 */
export async function probeMedia(filePath: string): Promise<MediaProbeResult> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Media file not found at: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    throw new Error('File is empty (0 bytes). Invalid video input.');
  }

  const { ffprobePath } = await locateBinaries();

  const args = [
    '-v', 'quiet',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    '-show_error',
    filePath,
  ];

  try {
    const { stdout } = await execFileAsync(ffprobePath, args, { maxBuffer: 10 * 1024 * 1024 });
    const data = JSON.parse(stdout);

    if (data.error) {
      throw new Error(`FFprobe error: ${data.error.string || 'Corrupted or unreadable media'}`);
    }

    const format = data.format || {};
    const rawStreams: any[] = data.streams || [];

    const videoStreams: VideoStreamInfo[] = [];
    const audioStreams: AudioStreamInfo[] = [];
    let subtitleCount = 0;

    for (const s of rawStreams) {
      if (s.codec_type === 'video') {
        const width = parseInt(s.width, 10) || 0;
        const height = parseInt(s.height, 10) || 0;
        const fps = parseFps(s.r_frame_rate || s.avg_frame_rate);
        const durationSeconds = parseFloat(s.duration || format.duration || '0');
        const frameCount = s.nb_frames ? parseInt(s.nb_frames, 10) : Math.round(durationSeconds * fps);

        videoStreams.push({
          index: s.index,
          codecName: s.codec_name || 'unknown',
          codecLongName: s.codec_long_name,
          profile: s.profile,
          width,
          height,
          aspectRatio: s.display_aspect_ratio || calculateAspectRatio(width, height),
          fps,
          pixelFormat: s.pix_fmt || 'yuv420p',
          bitrate: s.bit_rate ? parseInt(s.bit_rate, 10) : undefined,
          durationSeconds,
          frameCount,
        });
      } else if (s.codec_type === 'audio') {
        audioStreams.push({
          index: s.index,
          codecName: s.codec_name || 'unknown',
          channels: s.channels || 2,
          channelLayout: s.channel_layout || (s.channels === 1 ? 'mono' : 'stereo'),
          sampleRate: parseInt(s.sample_rate, 10) || 44100,
          bitrate: s.bit_rate ? parseInt(s.bit_rate, 10) : undefined,
          language: s.tags?.language,
        });
      } else if (s.codec_type === 'subtitle') {
        subtitleCount++;
      }
    }

    const durationSeconds = parseFloat(format.duration || '0') || videoStreams[0]?.durationSeconds || 0;
    const overallBitrate = format.bit_rate ? parseInt(format.bit_rate, 10) : undefined;

    return {
      filePath,
      fileName: path.basename(filePath),
      fileSizeBytes: stat.size,
      durationSeconds,
      containerFormat: format.format_name || path.extname(filePath).replace('.', ''),
      overallBitrate,
      videoStreams,
      audioStreams,
      subtitleCount,
      hasAudio: audioStreams.length > 0,
      hasVideo: videoStreams.length > 0,
      primaryVideo: videoStreams[0],
      primaryAudio: audioStreams[0],
    };
  } catch (err: any) {
    if (err.message && err.message.includes('Media file not found')) {
      throw err;
    }
    throw new Error(`Failed to probe video file: ${err.message || 'Unknown probe error'}`);
  }
}
