import { execFile } from 'child_process';
import { promisify } from 'util';
import { locateBinaries } from './binaryLocator.js';
import { HardwareStatus, HardwareEncoderSupport } from '../../../shared/types.js';

const execFileAsync = promisify(execFile);

let cachedHardwareStatus: HardwareStatus | null = null;

/**
 * Probes FFmpeg build to detect available hardware encoders.
 */
export async function detectHardwareCapabilities(): Promise<HardwareStatus> {
  if (cachedHardwareStatus) {
    return cachedHardwareStatus;
  }

  const { ffmpegPath } = await locateBinaries();

  let encodersOutput = '';
  try {
    const { stdout } = await execFileAsync(ffmpegPath, ['-encoders']);
    encodersOutput = stdout;
  } catch (err: any) {
    encodersOutput = err.stdout || '';
  }

  const hasEncoder = (name: string): boolean => {
    const regex = new RegExp(`^\\s*V[F.][S.][X.][B.][D.]\\s+${name}\\s+`, 'm');
    return regex.test(encodersOutput);
  };

  const candidateEncoders: Array<{
    id: string;
    name: string;
    codec: 'h264' | 'hevc' | 'av1';
    type: 'nvenc' | 'qsv' | 'amf' | 'mf' | 'cpu';
  }> = [
    // NVIDIA
    { id: 'h264_nvenc', name: 'NVIDIA NVENC H.264', codec: 'h264', type: 'nvenc' },
    { id: 'hevc_nvenc', name: 'NVIDIA NVENC HEVC (H.265)', codec: 'hevc', type: 'nvenc' },
    { id: 'av1_nvenc', name: 'NVIDIA NVENC AV1', codec: 'av1', type: 'nvenc' },
    // Intel QuickSync
    { id: 'h264_qsv', name: 'Intel QuickSync H.264', codec: 'h264', type: 'qsv' },
    { id: 'hevc_qsv', name: 'Intel QuickSync HEVC', codec: 'hevc', type: 'qsv' },
    { id: 'av1_qsv', name: 'Intel QuickSync AV1', codec: 'av1', type: 'qsv' },
    // AMD AMF
    { id: 'h264_amf', name: 'AMD AMF H.264', codec: 'h264', type: 'amf' },
    { id: 'hevc_amf', name: 'AMD AMF HEVC', codec: 'hevc', type: 'amf' },
    { id: 'av1_amf', name: 'AMD AMF AV1', codec: 'av1', type: 'amf' },
    // CPU fallback
    { id: 'libx264', name: 'x264 (Software CPU)', codec: 'h264', type: 'cpu' },
    { id: 'libx265', name: 'x265 (Software CPU)', codec: 'hevc', type: 'cpu' },
    { id: 'libsvtav1', name: 'SVT-AV1 (Software CPU)', codec: 'av1', type: 'cpu' },
  ];

  const encoders: HardwareEncoderSupport[] = candidateEncoders.map(enc => ({
    ...enc,
    available: hasEncoder(enc.id),
  }));

  const hasNvidia = encoders.some(e => e.type === 'nvenc' && e.available);
  const hasIntel = encoders.some(e => e.type === 'qsv' && e.available);
  const hasAmd = encoders.some(e => e.type === 'amf' && e.available);

  let recommendedH264 = 'libx264';
  if (hasNvidia && encoders.find(e => e.id === 'h264_nvenc')?.available) {
    recommendedH264 = 'h264_nvenc';
  } else if (hasIntel && encoders.find(e => e.id === 'h264_qsv')?.available) {
    recommendedH264 = 'h264_qsv';
  } else if (hasAmd && encoders.find(e => e.id === 'h264_amf')?.available) {
    recommendedH264 = 'h264_amf';
  }

  let recommendedHEVC = 'libx265';
  if (hasNvidia && encoders.find(e => e.id === 'hevc_nvenc')?.available) {
    recommendedHEVC = 'hevc_nvenc';
  } else if (hasIntel && encoders.find(e => e.id === 'hevc_qsv')?.available) {
    recommendedHEVC = 'hevc_qsv';
  } else if (hasAmd && encoders.find(e => e.id === 'hevc_amf')?.available) {
    recommendedHEVC = 'hevc_amf';
  }

  cachedHardwareStatus = {
    hasNvidia,
    hasIntel,
    hasAmd,
    encoders,
    recommendedH264,
    recommendedHEVC,
  };

  return cachedHardwareStatus;
}
