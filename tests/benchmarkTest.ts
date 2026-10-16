import path from 'path';
import fs from 'fs';
import { probeMedia } from '../server/src/engine/probeService.js';
import { startCompressionJob } from '../server/src/engine/encoderService.js';
import { CompressionJobConfig, CompressionOutcome } from '../shared/types.js';

const inputDir = 'C:/Users/P1165/Desktop/V_test';
const outputDir = 'C:/Users/P1165/Desktop/V_done';

async function main() {
  console.log('--- Probing files in V_test ---');
  const files = [
    path.join(inputDir, 'bandicam 2026-10-07 02-23-02-747.mp4'),
    path.join(inputDir, 'bandicam 2026-10-16 05-07-55-923.avi'),
  ];

  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.error(`File does not exist: ${f}`);
      continue;
    }
    const stat = fs.statSync(f);
    console.log(`Checking ${path.basename(f)} (${(stat.size / (1024*1024)).toFixed(2)} MB)...`);
    try {
      const probe = await probeMedia(f);
      console.log(`  Duration: ${probe.durationSeconds.toFixed(1)}s, Resolution: ${probe.primaryVideo?.width}x${probe.primaryVideo?.height}, FPS: ${probe.primaryVideo?.fps}, Codec: ${probe.primaryVideo?.codecName}, Audio: ${probe.primaryAudio?.codecName || 'none'}`);
    } catch (err: any) {
      console.error(`  Probe error: ${err.message}`);
    }
  }
}

main().catch(console.error);
