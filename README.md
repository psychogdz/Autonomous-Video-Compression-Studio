# LuminaPress Video Studio
### *Maximum Compression, Uncompromised Clarity.*

> **استودیو تخصصی و خودکار فشرده‌سازی ویدئو با حفظ کیفیت، کنترل هوشمند، شتاب‌دهنده سخت‌افزاری و نتایج قابل سنجش.**

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)](docs/BUILD_AND_RELEASE.md)
[![Engine](https://img.shields.io/badge/FFmpeg-9.0.2%20Full-red.svg)](docs/TECH_DECISIONS.md)
[![Tests](https://img.shields.io/badge/tests-17%2F17%20passing-success.svg)](docs/TESTING.md)
[![Codecs](https://img.shields.io/badge/codecs-H.264%20%7C%20H.265%20%7C%20AV1%20%7C%20GIF-blueviolet.svg)](docs/PRODUCT_SPEC.md)

---

## 📽️ Overview

**LuminaPress Video Studio** is an autonomous, professional desktop and local web studio engineered to solve a fundamental challenge: **dramatically reducing video file sizes while retaining perceptual visual clarity, with full user control over method, speed, target size, and format.**

Unlike generic GUI wrappers or opaque cloud services that compromise privacy and re-compress files unpredictably, LuminaPress runs **100% locally and offline**, utilizes high-efficiency native codecs (H.264, H.265/HEVC, AV1, and animated GIF), and features an **Intelligent Decision Engine** that calculates mathematically optimal encoding parameters based on pre-flight stream analysis and user intent.

---

## ✨ Key Features & Capabilities

### 🎛️ Three Adaptive Interaction Modes
1. **Simple Mode (Goal-Oriented Presets):**
   - **Maximum Compression:** Aggressive 70–80% size reduction with modern H.265/HEVC.
   - **Balanced Quality:** Standard ~50% reduction with visually transparent sharpness.
   - **Archival Quality:** High-fidelity near-lossless compression for master backups.
   - **Discord & Email (25 MB):** Strictly fits within 25 MB limits using 2-pass bitrate allocation.
   - **WhatsApp Mobile HD:** Optimized 720p H.264 profile for instant mobile messaging.
   - **Fast Telegram Share:** Ultra-fast encoding speed for rapid clip dispatching.
   - **Animated GIF Export:** High-fidelity animated GIF export using 256-color `palettegen` & Bayer dithering.
   - **Encoding Priority:** Choose between *Fast* (40–60% speedup), *Balanced* (standard medium preset), or *Best Quality* (slow deep motion search).

2. **Target Size Mode (Exact MB Budget Calculator):**
   - User specifies desired output file size in Megabytes (MB).
   - The decision engine automatically computes video and audio bitrate budgets:
     $$\text{Bitrate}_{\text{video}} = \frac{\text{TargetSize (bytes)} \times 8}{\text{Duration (seconds)}} - \text{Bitrate}_{\text{audio}}$$
   - **2-Pass Strict Bitrate Encoding:** Pass 1 analyzes motion complexity; Pass 2 allocates bitrate proportionally to complexity to hit the exact target size within ±3%.
   - **Smart Resolution Adaptation:** Automatically downscales (e.g. 1080p → 720p) if the bitrate budget is too tight, ensuring crisp details instead of blurry pixelation.

3. **Advanced Mode (Professional Engineering Mastery):**
   - Explicit Video Codec selection: `H.264 (libx264)`, `H.265 / HEVC (libx265)`, `AV1 (libsvtav1)`, `Animated GIF`, and hardware equivalents.
   - Rate Control: CRF (Constant Rate Factor, 0–51) or Target Average Bitrate (ABR kbps).
   - Speed / Efficiency Presets: `ultrafast` through `veryslow`.
   - Resolution Downscaling: Keep Original, 4K, 1440p, 1080p, 720p, 480p.
   - Frame Rate Control: Original, 60fps, 30fps, 24fps.
   - Audio Processing: AAC, Opus, Lossless Copy (Passthrough), or Strip / Mute Audio.

---

### 🖼️ Full Animated GIF Support (Input & Output)
- **GIF Input:** Drag & drop bulky `.gif` animations to probe their framerate and dimensions, then compress them into ultra-compact H.264/H.265 videos (**88%+ size reduction**).
- **GIF Output:** Convert any video into high-fidelity animated GIFs. Uses two-pass FFmpeg `palettegen` with Lanczos scaling and Bayer dithering to eliminate color banding and grain.
- **Embedded Looping Previews:** Native playback of generated animated GIFs in the studio.

---

### 🔍 Interactive Synchronized Video Inspector
- **Dual-Stream Comparison Canvas:** Compares original source video and compressed video with an interactive draggable split divider.
- **Sub-Pixel Clip-Path Alignment:** Uses CSS `clip-path` to guarantee 100% exact alignment between both streams.
- **1x, 2x, and 4x Zoom Magnification:** Inspect compression macroblocks and edge sharpness up close; the divider seam stays locked to the video cut line at all zoom levels.
- **Frame-by-Frame Stepping:** `-1 Frame` and `+1 Frame` controls to analyze high-motion scenes.
- **Scientific SSIM & PSNR Quality Measurement:** Computes objective structural similarity (SSIM) and peak signal-to-noise ratio (PSNR) directly via FFmpeg filtergraphs.

---

### ⚡ Hardware Acceleration & Resilience
- **Active Hardware Micro-Probe:** Tests hardware encoders (`NVENC`, `Intel QuickSync`, `AMD AMF`, `Windows MediaFoundation`) on startup by executing an isolated test frame.
- **Automatic Driver Resilience:** Detects driver API limitations gracefully and falls back to MediaFoundation GPU or multi-threaded CPU encoding without crashes.
- **Multi-Core CPU Threading:** Distributes workload across all CPU cores and threads utilizing AVX2 and FMA3 vectorized instructions.

---

### 📊 Real-Time Telemetry via Server-Sent Events (SSE)
- Live encoding progress bar with percentage.
- Real-time processing FPS and speed multiplier (e.g. `7.8x`).
- Accurate Time Remaining (ETA) and elapsed time counter.
- Dynamic output file size growth indicator.
- Instant atomic cancellation: Cleans up temporary 2-pass log files and partial files immediately upon user abort.

---

### 📑 Batch Processing Queue & Audit Reports
- Multi-file batch queue with individual and global presets.
- Pause, resume, and clear controls.
- One-click export of detailed **Compression Audit Reports** in Markdown and JSON formats.

---

## 📦 Supported Formats Matrix

| Category | Supported Formats |
|:---|:---|
| **Input Containers** | `.mp4`, `.mov`, `.mkv`, `.webm`, `.avi`, `.ts`, `.m2ts`, `.flv`, `.wmv`, `.gif`, `.3gp`, `.ogv` |
| **Input Video Codecs** | H.264/AVC, H.265/HEVC, AV1, VP8, VP9, Apple ProRes, MPEG-4, MPEG-2, Motion JPEG, VC-1 |
| **Input Audio Codecs** | AAC, MP3, Opus, Vorbis, AC3, E-AC3, DTS, FLAC, PCM/WAV, ALAC |
| **Output Containers** | `.mp4` (with `+faststart` streaming optimization), `.gif` (animated) |
| **Output Video Codecs** | `libx264` (H.264), `libx265` (H.265/HEVC), `libsvtav1` (AV1), `h264_mf` (Windows GPU), `gif` |
| **Output Audio Codecs** | AAC (64k–256k), Opus (high efficiency), Stream Copy (lossless), Mute / Strip |

---

## 📈 Real-World Verification Benchmarks

Benchmarks performed on real video captures using LuminaPress Studio:

| Test Input | Mode / Profile | Output Codec | Original Size | Compressed Size | Space Saved | Encoding Speed | Visual SSIM |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **1080p30 MP4 (70.7s)** | Maximum Compression | H.265/HEVC | 114.27 MB | **11.41 MB** | **-90.0%** | 2.28x | 0.9697 |
| **1080p30 MP4 (70.7s)** | Balanced Quality | H.264 | 114.27 MB | **25.91 MB** | **-77.3%** | 5.38x | 0.9816 |
| **1080p30 MP4 (70.7s)** | Target Size 25 MB (2-Pass) | H.264 | 114.27 MB | **24.09 MB** | **-78.9%** | 4.07x | 0.9811 |
| **1080p30 MP4 (70.7s)** | WhatsApp Mobile (720p) | H.264 | 114.27 MB | **10.51 MB** | **-90.8%** | 7.94x | Clean 720p |
| **1080p60 AVI (390.1s)** | Maximum Compression | H.265/HEVC | 109.41 MB | **23.42 MB** | **-78.6%** | 1.81x | 0.9843 |
| **1080p60 AVI (390.1s)** | Target Size 25 MB (2-Pass) | H.264 | 109.41 MB | **19.57 MB** | **-82.1%** | 6.86x | Sub-25MB |
| **Animated GIF (2.0s)** | GIF to Video | H.265 | 71.61 KB | **8.47 KB** | **-88.2%** | 15.0x | Lossless |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18.0.0 or later (v20+ / v24+ recommended)
- **FFmpeg 6.0+:** Bundled in `./bin` or automatically installed via `winget` on first launch.

### 2. One-Click Launchers (Recommended)
- **Windows:** Double-click `LuminaPress.bat`
- **macOS / Linux:** Run `./LuminaPress.sh`

The launcher will verify dependencies, build the studio if needed, and open `http://localhost:3001` in your default browser.

### 3. Developer Mode (Vite Hot-Reload)
```bash
# 1. Clone repository
git clone https://github.com/psychogdz/Autonomous-Video-Compression-Studio.git
cd "Autonomous-Video-Compression-Studio"

# 2. Install dependencies
npm install

# 3. Start development environment (Vite UI on 5173 + Engine API on 3001)
npm run dev
```

### 4. Running Automated Tests
```bash
# Run all 17 automated unit, integration, and E2E encoding tests
npm test
```

---

## 🏛️ System Architecture

```
Autonomous Video Compression Studio/
├── bin/                          # Standalone FFmpeg & FFprobe binaries
├── docs/                         # Architecture, specs & engineering records
│   ├── ARCHITECTURE.md           # System topology & event flow
│   ├── BUILD_AND_RELEASE.md      # Build, packaging & deployment
│   ├── PRODUCT_SPEC.md           # Functional requirements & personas
│   ├── PROJECT_STATUS.md         # Current state of the repository
│   ├── ROADMAP.md                # Milestones & horizons
│   ├── TECH_DECISIONS.md         # Architecture trade-offs
│   ├── TESTING.md                # Test suites & benchmarks
│   └── UX_DESIGN.md              # Prism Darkroom design tokens
├── server/                       # Node.js + Express backend
│   └── src/
│       ├── engine/               # Video compression pipeline
│       │   ├── binaryLocator.ts  # Multi-strategy FFmpeg discovery
│       │   ├── probeService.ts   # Media stream & metadata analyzer
│       │   ├── decisionEngine.ts # Smart bitrate, CRF & downscaling engine
│       │   ├── hardwareAccel.ts  # Active GPU encoder micro-probe
│       │   ├── encoderService.ts # Child process manager with live SSE
│       │   ├── qualityMetrics.ts # SSIM & PSNR calculation
│       │   └── queueManager.ts   # Multi-file batch queue
│       └── index.ts              # Express API & streaming server
├── src/                          # Vite + React 19 + TypeScript frontend
│   ├── components/               # Studio interface components
│   │   ├── Header.tsx            # Masthead & hardware status
│   │   ├── DropZone.tsx          # Illuminated media portal
│   │   ├── MediaInspector.tsx    # Technical metadata card
│   │   ├── ModeSelector.tsx      # Segmented console bar
│   │   ├── SimpleMode.tsx        # Goal cards & priority selector
│   │   ├── TargetSizeMode.tsx    # MB budget slider & 2-pass mode
│   │   ├── AdvancedMode.tsx      # Granular codec & parameter controls
│   │   ├── EncodingProgress.tsx  # Real-time telemetry monitor
│   │   ├── ResultCard.tsx        # Savings summary & audit report
│   │   ├── VideoCompareModal.tsx # Precision split-seam video inspector
│   │   └── BatchQueueView.tsx    # Multi-file batch management
│   ├── App.tsx                   # Main studio orchestrator
│   └── index.css                 # Prism Darkroom design system
├── LuminaPress.bat               # Windows one-click launcher
├── LuminaPress.sh                # Unix/macOS one-click launcher
└── package.json                  # Root workspace config
```

---

## 📄 License
Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

FFmpeg is licensed under GNU GPL/LGPL. LuminaPress invokes FFmpeg strictly as an independent CLI subprocess conforming strictly to GPL/LGPL linking compliance.
