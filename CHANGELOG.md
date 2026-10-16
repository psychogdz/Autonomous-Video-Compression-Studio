# CHANGELOG — LuminaPress Video Studio

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-16
### Added
- **Core Video Compression Engine:**
  - Multi-strategy FFmpeg 9.0.2 & FFprobe binary locator (`./bin`, WinGet, PATH, custom).
  - Media stream inspection and technical metadata extractor (`probeService.ts`).
  - Intelligent Decision Engine translating user goals into optimal mathematical encoding profiles (`decisionEngine.ts`).
  - 2-Pass strict bitrate calculator for Target Size Mode (e.g. Discord 25MB).
  - Child process execution manager with live regex-based stderr and stdout progress parsing (`encoderService.ts`).
  - Hardware acceleration detection for NVIDIA NVENC, Intel QuickSync, and AMD AMF (`hardwareAccel.ts`).
  - Objective visual quality computation using SSIM and PSNR filter graphs (`qualityMetrics.ts`).
  - Multi-file batch queue manager with pause, resume, and concurrency control (`queueManager.ts`).
- **Obsidian Dark Studio Frontend (React 19 + Vite + Tailwind):**
  - Modern Header with real-time GPU/CPU acceleration indicator and batch counter.
  - Video Dropzone supporting drag & drop, file picker, and direct local path entry.
  - Technical Media Inspector card displaying resolution, codecs, aspect ratio, frame rate, and audio streams.
  - Mode Selector with three distinct interaction workflows:
    - **Simple Mode:** Goal cards (Maximum Compression, Balanced, Archival, Discord, WhatsApp, Telegram).
    - **Target Size Mode:** Exact MB budget slider and 2-Pass bitrate calculator.
    - **Advanced Mode:** Granular control over codecs (x264, x265, SVT-AV1, NVENC), CRF slider, speed presets, downscaling, and audio channels.
  - Real-time Encoding Telemetry panel with live progress bar, processing FPS, speed multiplier, and ETA.
  - Interactive Before/After Video Comparison Modal with synchronized dual video scrubbing and draggable split divider.
  - Post-compression Result Card with savings badge (-82.6%), file reveal, and audit report generator.
- **Distribution & Launchers:**
  - `LuminaPress.bat` for one-click launch on Windows.
  - `LuminaPress.sh` for one-click launch on Unix/macOS.
- **Automated Verification:**
  - 13 passing Vitest tests covering probing, decision engine, real E2E compression, cancellation cleanup, HTTP 206 range streaming, and batch queue operations.
