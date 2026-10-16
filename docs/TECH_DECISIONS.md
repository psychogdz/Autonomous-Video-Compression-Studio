# TECHNICAL DECISIONS — LuminaPress Video Studio
## Architecture & Technology Trade-off Analysis

---

### Decision 1: Architecture — Native Node.js/Express + Vite/React vs Pure Desktop vs WebAssembly

- **Options Considered:**
  1. *Pure Client-Side WebAssembly (ffmpeg.wasm)*
  2. *Native Node.js Server + Vite/React Desktop/Browser UI (Selected)*
  3. *C++/Qt Native Desktop Application*
  4. *Python/PyQt Desktop Application*

- **Evaluation & Rationale:**
  - *ffmpeg.wasm:* Limited to single-thread or basic multi-threading, 2GB memory heap limit in browsers, no hardware acceleration (NVENC/QSV/AMF), extremely slow on 4K/1080p video (up to 15x slower than native). Rejected.
  - *C++/Qt:* High compile overhead, platform-specific build toolchains, slow UI iteration.
  - *Python/PyQt:* Packaging Python with FFmpeg and distributing across Windows environments often encounters DLL hell and runtime incompatibilities.
  - *Node.js + Express + Vite/React:* Direct native process spawning via `child_process.spawn` yields 100% native CPU and GPU performance. Express handles non-blocking SSE streaming with microsecond latency. React 19 + Tailwind enables high-fidelity studio UX. Can run both locally in browser and be packaged into Electron or a lightweight desktop webview without changing backend code.
- **Verdict:** Selected Option 2 (Node.js + Vite/React).

---

### Decision 2: FFmpeg Strategy — Bundled Static Binaries vs System Requirement

- **Options Considered:**
  1. *Require user to manually install FFmpeg and set PATH*
  2. *Dynamic Multi-Tier Discovery with Bundled Static Binaries (Selected)*
  3. *Download on first run only*

- **Evaluation & Rationale:**
  - Requiring manual installation creates high friction and user abandonment.
  - Downloading on first run fails when the user is offline.
  - Multi-Tier Discovery checks:
    1. Local `./bin/ffmpeg.exe` and `./bin/ffprobe.exe`
    2. WinGet package directory
    3. System PATH
    4. User override path in settings
  - This guarantees zero-configuration out-of-the-box operation while allowing power users to point to custom FFmpeg builds.
- **Verdict:** Selected Option 2 (Multi-Tier Discovery).

---

### Decision 3: Rate Control — CRF (Constant Rate Factor) vs 2-Pass ABR

- **Analysis:**
  - **CRF (Constant Rate Factor):** The industry standard for quality-focused encoding (`-crf 23` for x264, `-crf 28` for x265, `-crf 32` for SVT-AV1). Constant visual quality throughout high-motion and low-motion scenes. However, resulting file size cannot be predicted with 100% precision.
  - **2-Pass Average Bitrate (ABR):** Essential for Target Size Mode (e.g. "make this file exactly 24.5 MB for Discord"). Pass 1 analyzes complexity and generates a log file; Pass 2 allocates bitrate proportionally to complexity while strictly obeying the total bitrate budget.
- **Implementation:**
  - *Simple Mode & Advanced Quality Mode:* Default to CRF.
  - *Target Size Mode:* Default to 2-Pass ABR, with optional fast 1-Pass fallback when user prioritizes speed.

---

### Decision 4: Hardware Acceleration Strategy (NVENC, QSV, AMF)

- **Analysis:**
  - GPU encoders (NVIDIA NVENC, Intel QSV, AMD AMF) are 3x–10x faster than CPU encoding, but produce slightly larger files at the same visual quality compared to `libx264`/`libx265` with slow presets.
  - Therefore, hardware acceleration must not be blindly forced.
  - The decision engine exposes hardware acceleration as an explicit option (or automatic recommendation when "Fast Processing" is chosen), while defaulting to software encoding when "Maximum Compression" or "Archival Quality" is selected.

---

### Decision 5: Real-Time Telemetry via Server-Sent Events (SSE)

- **Analysis:**
  - Long-polling requires frequent HTTP requests that burden the Node event loop and introduce polling jitter.
  - WebSockets require protocol upgrade handshakes and stateful connection management.
  - Server-Sent Events (SSE) provide lightweight, unidirectional HTTP streaming natively supported by browser `EventSource`. Ideal for live encoding progress (frames, fps, percentage, ETA).
