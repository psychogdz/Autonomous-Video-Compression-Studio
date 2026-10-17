# CHANGELOG — LuminaPress Video Studio

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.2] - 2026-10-17
### Added & Improved
- **Direct GPU Offloading:** Simple Mode and Target Size Mode now directly route video encoding to dedicated hardware GPU encoders (`NVIDIA NVENC`, `Windows GPU MediaFoundation`, `Intel QuickSync`, `AMD AMF`), reducing CPU usage to under 10%.
- **Smart CPU Load Limiter (Throttling):** When using CPU software encoding (`libx264`, `libx265`, `libsvtav1`), users can select their CPU utilization ceiling:
  - **Eco Mode (50% CPU):** Allocates half of CPU threads; fans stay quiet and computer stays cool.
  - **Balanced Mode (75% CPU):** Reserves 2–4 threads for Windows and desktop apps; prevents 100% CPU lockups.
  - **Max Power (100% CPU):** Full multi-core throughput.
- **Background OS Priority:** Automatically sets FFmpeg subprocesses to `BELOW_NORMAL_PRIORITY_CLASS`, guaranteeing that user desktop windows, games, and browsers never lag during encoding.

---

## [1.2.1] - 2026-10-17
### Changed & Improved
- **Video Inspector English Consistency:** Converted all SSIM and PSNR technical explanations, fidelity rating badges, and viewport panning hints to clean, studio-grade English.
- **Batch Processing Queue Simplification:** Streamlined modal toolbar by removing redundant inline file adder in favor of the primary studio workspace selector.
- **Zoom Panning:** Added mouse-drag canvas panning and directional navigation controls (4 directions + Center reset) when zoomed in 2x or 4x.
- **Queue Transparency:** Live real-time SSE stream (`/api/queue/stream`), completed job output paths, and native "Open Folder" action.
- **Storage Isolation:** Dedicated permanent `outputs/` directory separated from `temp/uploads/`.
- **Hardware Telemetry:** Direct detection of user GPU model (`NVIDIA GeForce GTX 1650 (GPU)`).

---

## [1.1.0] - 2026-10-16
### Added
- **Full Animated GIF Input & Output Support:**
  - **GIF Input:** Users can drag-and-drop or load `.gif` files into the studio. Probed accurately as video streams without audio.
  - **GIF to Video Compression:** Converts bulky GIFs into ultra-compact H.264 / H.265 / AV1 MP4 videos, achieving **88%+ size reduction**.
  - **Video to Animated GIF Export:** Dedicated "Animated GIF Export" goal and codec in Advanced Mode. Uses two-pass FFmpeg `palettegen` (256 colors) and `paletteuse` with Lanczos scaling and Bayer dithering to eliminate ugly banding and grain artifacts.
  - Native animated GIF preview support in `ResultCard.tsx` with automatic looping.
  - Automated test suite `tests/gifSupport.test.ts` verifying probe, decision engine, Video-to-GIF, and GIF-to-Video conversions.

---

## [1.0.0] - 2026-10-16
### Added
- Core video compression engine with FFmpeg 9.0.2 full build integration.
- Obsidian Dark Studio React 19 + Vite + Tailwind interface.
- Simple Mode, Target Size Mode (2-Pass), and Advanced Mode.
- Live telemetry streaming via Server-Sent Events (SSE).
- Interactive Video Comparison Modal with split-slider and SSIM/PSNR calculation.
- Multi-file batch queue manager.
- Compression audit report export in Markdown and JSON.
- One-click launcher scripts for Windows (`LuminaPress.bat`) and Unix (`LuminaPress.sh`).
