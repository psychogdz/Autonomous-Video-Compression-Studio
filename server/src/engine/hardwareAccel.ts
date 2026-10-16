import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import { locateBinaries } from './binaryLocator.js';
import { HardwareStatus, HardwareEncoderSupport } from '../../../shared/types.js';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

let cachedHardwareStatus: HardwareStatus | null = null;

async function getGpuModel(): Promise<string | undefined> {
  if (process.platform === 'win32') {
    try {
      const { stdout } = await execAsync('powershell -NoProfile -Command "(Get-CimInstance Win32_VideoController).Name"');
      const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const dedicated = lines.find(l => !l.toLowerCase().includes('basic') && !l.toLowerCase().includes('virtual'));
      if (dedicated) return dedicated;
    } catch {
      // Fallback
    }
  }
  return undefined;
}

/**
 * Actively checks if an encoder can initialize on this specific hardware and driver.
 */
async function testEncoder(ffmpegPath: string, encoderId: string): Promise<boolean> {
  // Software encoders are always verified
  if (encoderId.startsWith('lib')) return true;

  try {
    const isWindows = process.platform === 'win32';
    const nullOut = isWindows ? 'NUL' : '/dev/null';
    await execFileAsync(ffmpegPath, [
      '-y',
      '-f', 'lavfi',
      '-i', 'color=s=64x64:d=0.04',
      '-c:v', encoderId,
      '-frames:v', '1',
      '-f', 'null',
      nullOut,
    ], { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Probes FFmpeg build to detect verified working hardware encoders.
 */
export async function detectHardwareCapabilities(): Promise<HardwareStatus> {
  if (cachedHardwareStatus) {
    return cachedHardwareStatus;
  }

  const { ffmpegPath } = await locateBinaries();
  const gpuModel = await getGpuModel();

  let encodersOutput = '';
  try {
    const { stdout } = await execFileAsync(ffmpegPath, ['-encoders']);
    encodersOutput = stdout;
  } catch (err: any) {
    encodersOutput = err.stdout || '';
  }

  const hasCompiledEncoder = (name: string): boolean => {
    const regex = new RegExp(`^\\s*V[F.][S.][X.][B.][D.]\\s+${name}\\s+`, 'm');
    return regex.test(encodersOutput);
  };

  const candidateEncoders: Array<{
    id: string;
    name: string;
    codec: 'h264' | 'hevc' | 'av1';
    type: 'nvenc' | 'qsv' | 'amf' | 'mf' | 'cpu';
  }> = [
    // NVIDIA NVENC
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
    // Windows MediaFoundation (DirectX Hardware MFT)
    { id: 'h264_mf', name: 'Windows GPU (MediaFoundation)', codec: 'h264', type: 'mf' },
    // CPU fallback
    { id: 'libx264', name: 'x264 (Software CPU)', codec: 'h264', type: 'cpu' },
    { id: 'libx265', name: 'x265 (Software CPU)', codec: 'hevc', type: 'cpu' },
    { id: 'libsvtav1', name: 'SVT-AV1 (Software CPU)', codec: 'av1', type: 'cpu' },
  ];

  const encoders: HardwareEncoderSupport[] = [];

  for (const enc of candidateEncoders) {
    if (!hasCompiledEncoder(enc.id)) {
      encoders.push({ ...enc, available: false });
      continue;
    }

    const actuallyWorks = await testEncoder(ffmpegPath, enc.id);
    encoders.push({ ...enc, available: actuallyWorks });
  }

  const hasNvidia = encoders.some(e => e.type === 'nvenc' && e.available);
  const hasIntel = encoders.some(e => e.type === 'qsv' && e.available);
  const hasAmd = encoders.some(e => e.type === 'amf' && e.available);
  const hasMf = encoders.some(e => e.type === 'mf' && e.available);

  let recommendedH264 = 'libx264';
  if (hasNvidia) {
    recommendedH264 = 'h264_nvenc';
  } else if (hasIntel) {
    recommendedH264 = 'h264_qsv';
  } else if (hasAmd) {
    recommendedH264 = 'h264_amf';
  } else if (hasMf) {
    recommendedH264 = 'h264_mf';
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
    hasMf,
    gpuModel,
    encoders,
    recommendedH264,
    recommendedHEVC,
  };

  return cachedHardwareStatus;
}
