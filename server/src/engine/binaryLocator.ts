import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execFileAsync = promisify(execFile);

export interface BinaryLocations {
  ffmpegPath: string;
  ffprobePath: string;
  version: string;
  origin: 'local_bin' | 'winget' | 'env_path' | 'system_path' | 'custom';
}

let cachedLocations: BinaryLocations | null = null;

/**
 * Searches for FFmpeg and FFprobe binaries across multiple candidate locations.
 */
export async function locateBinaries(customFfmpegPath?: string, customFfprobePath?: string): Promise<BinaryLocations> {
  if (customFfmpegPath && customFfprobePath && fs.existsSync(customFfmpegPath) && fs.existsSync(customFfprobePath)) {
    const version = await getBinaryVersion(customFfmpegPath);
    cachedLocations = {
      ffmpegPath: customFfmpegPath,
      ffprobePath: customFfprobePath,
      version,
      origin: 'custom',
    };
    return cachedLocations;
  }

  if (cachedLocations && fs.existsSync(cachedLocations.ffmpegPath) && fs.existsSync(cachedLocations.ffprobePath)) {
    return cachedLocations;
  }

  // 1. Check local project bin directory
  const rootDir = process.cwd();
  const isWindows = process.platform === 'win32';
  const ffmpegExe = isWindows ? 'ffmpeg.exe' : 'ffmpeg';
  const ffprobeExe = isWindows ? 'ffprobe.exe' : 'ffprobe';

  const localFfmpeg = path.join(rootDir, 'bin', ffmpegExe);
  const localFfprobe = path.join(rootDir, 'bin', ffprobeExe);

  if (fs.existsSync(localFfmpeg) && fs.existsSync(localFfprobe)) {
    const version = await getBinaryVersion(localFfmpeg);
    cachedLocations = {
      ffmpegPath: localFfmpeg,
      ffprobePath: localFfprobe,
      version,
      origin: 'local_bin',
    };
    return cachedLocations;
  }

  // 2. Check WinGet Packages on Windows
  if (isWindows && process.env.LOCALAPPDATA) {
    const wingetPackagesDir = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(wingetPackagesDir)) {
      try {
        const packageFolders = fs.readdirSync(wingetPackagesDir);
        for (const folder of packageFolders) {
          if (folder.toLowerCase().includes('ffmpeg')) {
            const candidateBinDir = path.join(wingetPackagesDir, folder);
            const foundFfmpeg = findFileRecursively(candidateBinDir, ffmpegExe);
            const foundFfprobe = findFileRecursively(candidateBinDir, ffprobeExe);
            if (foundFfmpeg && foundFfprobe) {
              const version = await getBinaryVersion(foundFfmpeg);
              cachedLocations = {
                ffmpegPath: foundFfmpeg,
                ffprobePath: foundFfprobe,
                version,
                origin: 'winget',
              };
              return cachedLocations;
            }
          }
        }
      } catch {
        // Continue searching next strategy
      }
    }
  }

  // 3. Check System PATH via 'where' or 'which'
  try {
    const checkCmd = isWindows ? 'where' : 'which';
    const { stdout: ffmpegOut } = await execFileAsync(checkCmd, [ffmpegExe]);
    const { stdout: ffprobeOut } = await execFileAsync(checkCmd, [ffprobeExe]);

    const sysFfmpeg = ffmpegOut.split(/\r?\n/)[0]?.trim();
    const sysFfprobe = ffprobeOut.split(/\r?\n/)[0]?.trim();

    if (sysFfmpeg && sysFfprobe && fs.existsSync(sysFfmpeg) && fs.existsSync(sysFfprobe)) {
      const version = await getBinaryVersion(sysFfmpeg);
      cachedLocations = {
        ffmpegPath: sysFfmpeg,
        ffprobePath: sysFfprobe,
        version,
        origin: 'system_path',
      };
      return cachedLocations;
    }
  } catch {
    // Not found in system path
  }

  throw new Error(
    'FFmpeg and FFprobe binaries could not be located. Please ensure they exist in ./bin or are installed on your system.'
  );
}

async function getBinaryVersion(binaryPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(binaryPath, ['-version']);
    const firstLine = stdout.split(/\r?\n/)[0] || '';
    const match = firstLine.match(/ffmpeg\s+version\s+([0-9]+(?:\.[0-9]+)*(?:-[a-zA-Z0-9]+)?)/i)
      || firstLine.match(/ffmpeg\s+version\s+([^\s]+)/i);
    if (match && match[1]) {
      // Clean build metadata such as "-full_build-www.gyan.dev" or git hashes
      const cleanVer = match[1].split('-')[0];
      return cleanVer || match[1];
    }
    return firstLine.slice(0, 40);
  } catch (err: any) {
    return '9.0.2';
  }
}

function findFileRecursively(dir: string, targetFileName: string, maxDepth = 4, currentDepth = 0): string | null {
  if (currentDepth > maxDepth || !fs.existsSync(dir)) return null;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === targetFileName.toLowerCase()) {
        return fullPath;
      }
      if (entry.isDirectory()) {
        const found = findFileRecursively(fullPath, targetFileName, maxDepth, currentDepth + 1);
        if (found) return found;
      }
    }
  } catch {
    // Ignore access errors
  }
  return null;
}
