import { spawn } from 'child_process';
import { locateBinaries } from './binaryLocator.js';
import { QualityScore } from '../../../shared/types.js';

/**
 * Computes SSIM and PSNR visual metrics comparing compressed video to the original source.
 */
export async function calculateQualityMetrics(
  originalPath: string,
  compressedPath: string,
  sampleDurationSeconds = 10
): Promise<QualityScore> {
  const { ffmpegPath } = await locateBinaries();

  return new Promise((resolve) => {
    // Compare up to sampleDurationSeconds to keep calculation fast and responsive
    const args = [
      '-t', sampleDurationSeconds.toString(),
      '-i', compressedPath,
      '-t', sampleDurationSeconds.toString(),
      '-i', originalPath,
      '-filter_complex', '[0:v][1:v]ssim;[0:v][1:v]psnr',
      '-f', 'null',
      process.platform === 'win32' ? 'NUL' : '/dev/null',
    ];

    const proc = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = '';

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', () => {
      const result: QualityScore = {};

      // Parse SSIM: SSIM Y:0.965432 ... All:0.971234 (15.4dB)
      const ssimMatch = stderr.match(/SSIM.*All:([0-9.]+)/i);
      if (ssimMatch && ssimMatch[1]) {
        result.ssim = Math.round(parseFloat(ssimMatch[1]) * 10000) / 10000;
      }

      // Parse PSNR: PSNR y:42.34 ... average:41.28
      const psnrMatch = stderr.match(/PSNR.*average:([0-9.]+)/i);
      if (psnrMatch && psnrMatch[1]) {
        result.psnr = Math.round(parseFloat(psnrMatch[1]) * 100) / 100;
      }

      resolve(result);
    });

    proc.on('error', () => {
      resolve({});
    });
  });
}
