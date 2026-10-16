# PRODUCT ROADMAP — LuminaPress Video Studio
## Phased Implementation Plan & Milestones

---

### Phase 0 — Discovery & Planning [COMPLETED]
- [x] Analyze requirements, user personas, and technical constraints.
- [x] Establish product identity: **LuminaPress Video Studio**.
- [x] Select architectural stack: Native Node.js/Express + Vite/React + FFmpeg 9.0.2.
- [x] Procure and verify standalone `ffmpeg.exe` and `ffprobe.exe` binaries in `./bin`.
- [x] Initialize Git repository with proper `.gitignore`.
- [x] Author comprehensive multi-agent documentation suite (`AGENTS.md`, `MASTER_PROMPT.md`, `docs/*`).

---

### Phase 1 — Functional Prototype & Core Engine [IN PROGRESS]
- [ ] Implement `binaryLocator.ts` with multi-tier discovery.
- [ ] Implement `probeService.ts` for deep media stream parsing.
- [ ] Implement `decisionEngine.ts` for deterministic CRF and 2-Pass bitrate budgeting.
- [ ] Implement `hardwareAccel.ts` for GPU encoder probing (NVENC, QSV, AMF).
- [ ] Implement `encoderService.ts` with real-time stderr progress parsing and clean cancellation.
- [ ] Create synthetic test media generator.
- [ ] Execute end-to-end compression test with real input video and verify output playability and size reduction.

---

### Phase 2 — Studio UI & Multi-Mode Interaction Experience
- [ ] Build responsive Obsidian Dark studio interface (Vite + React + Tailwind + Lucide).
- [ ] Implement File Dropzone with instant technical metadata display (`MediaInspector`).
- [ ] Implement Three Interaction Modes:
  - **Simple Mode:** Preset cards (Max Compression, Balanced, Archive, Discord, WhatsApp).
  - **Target Size Mode:** Exact MB slider and input with automatic 2-pass bitrate budget.
  - **Advanced Mode:** Codec selector (H.264, H.265, AV1), CRF slider, speed preset, resolution downscaling, audio options.
- [ ] Real-time encoding telemetry panel (animated progress bar, current FPS, speed multiplier, ETA).
- [ ] Post-compression Result Card with size delta, savings percentage, and native folder opener.
- [ ] Interactive Before/After Video Comparison Player with synchronized split slider.

---

### Phase 3 — Advanced Capabilities & Batch Queue
- [ ] Multi-file Batch Queue with pause, resume, and individual file cancel.
- [ ] Concurrency regulator (prevents CPU exhaustion on high-core systems).
- [ ] SSIM / PSNR objective visual quality score calculation.
- [ ] Custom preset profiles export/import (JSON).

---

### Phase 4 — Hardening, Automated Testing & Packaging
- [ ] Comprehensive unit test suite (Jest/Vitest).
- [ ] Integration and end-to-end encoding tests.
- [ ] Boundary condition tests (corrupt files, non-video files, 0-byte files, disk full simulation).
- [ ] Production build and packaging verification.
- [ ] Final release verification report.
