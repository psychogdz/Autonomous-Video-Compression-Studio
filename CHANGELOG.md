# CHANGELOG — LuminaPress Video Studio

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
