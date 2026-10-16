# LuminaPress Video Studio
### *Maximum Compression, Uncompromised Clarity.*

> **استودیو تخصصی و خودکار فشرده‌سازی ویدئو با حفظ کیفیت، کنترل هوشمند و نتایج قابل سنجش.**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)](docs/BUILD_AND_RELEASE.md)
[![Engine](https://img.shields.io/badge/FFmpeg-9.0.2%20Full-red.svg)](docs/TECH_DECISIONS.md)

---

## Overview

**LuminaPress Video Studio** is an autonomous, professional desktop and local web application engineered to solve a fundamental problem: **dramatically reducing video file sizes while retaining perceptual visual clarity, with full user control over method, speed, and target size.**

Unlike generic GUI wrappers or opaque cloud services that compromise privacy and re-compress files unpredictably, LuminaPress runs **100% locally**, utilizes high-efficiency native codecs (H.264, H.265/HEVC, AV1), and features an **Intelligent Decision Engine** that calculates mathematically optimal encoding parameters based on file analysis and user intent.

---

## Key Highlights

- **Three Adaptive Interaction Modes:**
  - **Simple Mode:** Goal-based presets (*Maximum Compression*, *Balanced*, *Archival Quality*, *Discord 25MB*, *WhatsApp HD*, *Telegram Fast*).
  - **Target Size Mode:** Exact Megabyte budget calculator. Automatically calculates video and audio bitrate budgets using 2-Pass encoding to hit targets within ±3%.
  - **Advanced Mode:** Complete professional mastery over codecs (x264, x265, SVT-AV1, NVENC, QSV, AMF), CRF values (0–51), CPU/GPU speed presets, resolution downscaling, frame rates, and audio bitrates.
- **Intelligent Decision Engine:** Pre-flight video stream probing, automatic boundary checking, and real-time size & time estimations.
- **Hardware Acceleration:** Auto-probes and harnesses NVIDIA NVENC, Intel QuickSync, and AMD AMF where available.
- **Real-Time Telemetry via SSE:** Live encoding progress bar with frame count, real-time FPS, speed multiplier (e.g. `2.4x`), and remaining time (ETA).
- **Interactive Before/After Video Inspector:** Synchronized split-view player allowing frame-by-frame comparison of the original vs compressed output.
- **Zero Data Loss Guarantee:** Never overwrites the source file. Automatic cleanup of partial files on abort.
- **Multi-File Batch Queue:** Queue multiple clips with unified or per-file presets.

---

## Quick Start

### 1. Prerequisites
- **Node.js** v18+ (Node v20 or v24 recommended)
- **FFmpeg 6.0+** (Automatically detected from `./bin`, WinGet, or system PATH)

### 2. Launching the Studio

```bash
# Clone the repository
git clone <repository-url>
cd "Autonomous Video Compression Studio"

# Install all dependencies
npm install

# Start development studio (UI on port 5173, Engine API on port 3001)
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Documentation Index

- [`AGENTS.md`](AGENTS.md) — Multi-agent engineering guidelines and operational protocol.
- [`MASTER_PROMPT.md`](MASTER_PROMPT.md) — Core project mission, product philosophy, and non-negotiables.
- [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) — User personas, functional criteria, and acceptance benchmarks.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System layering, services, and event-driven data flow.
- [`docs/TECH_DECISIONS.md`](docs/TECH_DECISIONS.md) — Architecture trade-offs and technology justifications.
- [`docs/UX_DESIGN.md`](docs/UX_DESIGN.md) — Obsidian Dark Studio design tokens and layout specifications.
- [`docs/TESTING.md`](docs/TESTING.md) — Test matrix, benchmark procedures, and verification criteria.
- [`docs/BUILD_AND_RELEASE.md`](docs/BUILD_AND_RELEASE.md) — Packaging, offline deployment, and licensing.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — Phased milestones and future developments.
- [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — Real-time state of the repository.
- [`CHANGELOG.md`](CHANGELOG.md) — Version release notes.

---

## License
MIT License. FFmpeg is licensed under GNU GPL/LGPL. LuminaPress invokes FFmpeg as an independent CLI subprocess conforming strictly to GPL/LGPL linking compliance.
