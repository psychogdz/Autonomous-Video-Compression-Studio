# ARCHITECTURE SPECIFICATION — LuminaPress Video Studio
## Modular Architecture & Communication Design

---

### 1. System Topology & Layering

LuminaPress Video Studio adopts a decoupled, event-driven client-server architecture designed for local desktop and workstation environments:

```
+-------------------------------------------------------------------------+
|                         PRESENTATION TIER (UI)                          |
|  Vite + React 18/19 + TypeScript + Tailwind CSS + Lucide Icons          |
|                                                                         |
|  [Header & GPU Status]  [DropZone / FilePicker]  [MediaInspector]       |
|  [ModeSelector (Simple | Target Size | Advanced)]                       |
|  [Live Progress Monitor (FPS, Speed, ETA)]  [Result & Compare Modal]    |
|  [Batch Queue Manager]                                                  |
+------------------------------------+------------------------------------+
                                     |
               HTTP REST & SSE       | (Port 3001)
               Bidirectional Events  |
                                     v
+-------------------------------------------------------------------------+
|                         BACKEND SERVICE (API)                           |
|  Node.js + Express + TypeScript Router & Stream Manager                  |
|                                                                         |
|  - POST /api/probe          -> probeService.ts                          |
|  - POST /api/decision       -> decisionEngine.ts                        |
|  - GET  /api/hardware       -> hardwareAccel.ts                         |
|  - POST /api/compress       -> encoderService.ts (spawns job)           |
|  - GET  /api/compress/:id   -> Server-Sent Events (live stdout stream)  |
|  - POST /api/cancel/:id     -> Graceful SIGKILL & orphan cleanup        |
|  - POST /api/quality        -> qualityMetrics.ts (SSIM/PSNR calculator) |
|  - CRUD /api/queue          -> queueManager.ts (Batch processing)       |
+------------------------------------+------------------------------------+
                                     |
                Direct Child Process | Standard I/O Pipes
                Async Execution      |
                                     v
+-------------------------------------------------------------------------+
|                         EXECUTION ENGINE (FFMPEG)                       |
|  Native Standalone Binaries: ffmpeg.exe & ffprobe.exe (v9.0.2 Full)     |
|  Codecs: libx264, libx265, libsvtav1, NVENC, QSV, AMF, Opus, AAC       |
+-------------------------------------------------------------------------+
```

---

### 2. Backend Modules & Responsibilities

1. **`binaryLocator.ts`**:
   - Searches candidate locations: local `./bin/`, WinGet packages, system `PATH`, and custom settings.
   - Verifies binary execution and validates version output.

2. **`probeService.ts`**:
   - Spawns `ffprobe -v quiet -print_format json -show_format -show_streams <path>`.
   - Parses stream arrays and calculates bitrates, frame rates (evaluating fractional strings like `30000/1001`), aspect ratios, and total duration.
   - Detects corrupted or unreadable video headers.

3. **`hardwareAccel.ts`**:
   - Executes `ffmpeg -encoders` and probes for:
     - NVIDIA: `h264_nvenc`, `hevc_nvenc`, `av1_nvenc`
     - Intel: `h264_qsv`, `hevc_qsv`, `av1_qsv`
     - AMD: `h264_amf`, `hevc_amf`, `av1_amf`
     - Microsoft Windows: `h264_mf`, `hevc_mf`
   - Exposes hardware capabilities to the frontend with fallback recommendations.

4. **`decisionEngine.ts`**:
   - Converts user goals into mathematically sound FFmpeg parameters.
   - **Target Size Calculator:** Computes exact video bitrate budget from user-specified target Megabytes and stream duration. Recommends 2-pass mode for high precision.
   - **Simple Mode Resolver:** Translates presets (Max Compression, Balanced, Archive, Discord, WhatsApp) into optimal CRF, codec, and scale factors.
   - **Sanity & Boundary Checker:** Flags warnings if user attempts downscaling a low-res video, setting target bitrate higher than source, or selecting incompatible codec combinations.

5. **`encoderService.ts`**:
   - Spawns `ffmpeg` processes with `-progress pipe:1` or regex parsing on stderr (`frame=`, `fps=`, `q=`, `size=`, `time=`, `bitrate=`, `speed=`).
   - Converts timestamps (`HH:MM:SS.ms`) into seconds and calculates completion percentage based on total video duration.
   - Dispatches real-time SSE events to connected web clients.
   - Implements atomic cancellation: stops the process, cleans up temp 2-pass log files (`ffmpeg2pass-0.log`), and deletes partial target files to prevent drive clutter.

6. **`qualityMetrics.ts`**:
   - Uses FFmpeg's `libvmaf`, `ssim`, or `psnr` filter graphs:
     `-lavfi "[0:v][1:v]ssim[s];[0:v][1:v]psnr[p]"` to compare original vs compressed video objectively.

7. **`queueManager.ts`**:
   - Maintains an in-memory queue of video compression jobs.
   - Manages state transitions: `queued -> probing -> encoding -> completed / failed / cancelled`.
   - Regulates concurrency to avoid CPU starvation.

---

### 3. Frontend Component Architecture

```
App.tsx
├── Header (App title, hardware acceleration pill, theme toggle)
├── Main Workspace
│   ├── Left Column: Source & Configuration
│   │   ├── DropZone (Drag & drop or file browse)
│   │   ├── MediaInspector (Source video technical breakdown card)
│   │   ├── ModeSelector (Pill tabs: Simple | Target Size | Advanced)
│   │   ├── Configuration Panel (Dynamic per active mode)
│   │   │   ├── SimpleMode (Preset cards & description)
│   │   │   ├── TargetSizeMode (MB input, slider, 2-pass toggle)
│   │   │   └── AdvancedMode (Codec, CRF, preset, scale, audio)
│   │   └── Action Bar (Estimated size badge, "Start Compression" button)
│   │
│   └── Right Column: Live Telemetry & Results
│       ├── Active Progress Monitor (when encoding)
│       │   ├── Smooth progress percentage bar
│       │   ├── Real-time FPS, speed multiplier (e.g. 2.1x), ETA
│       │   └── Abort / Cancel button
│       │
│       ├── Result Card (when completed)
│       │   ├── Size delta (-XX%), bytes saved badge
│       │   ├── Video playback preview
│       │   ├── "Compare Original vs Compressed" button
│       │   └── "Open in Explorer" / "Save As" actions
│       │
│       └── Batch Queue Drawer / Tab
│           ├── List of queued items with status indicators
│           └── Batch pause, resume, and clear controls
```

---

### 4. Communication & Real-Time Telemetry via SSE

Instead of wasteful client-side polling, LuminaPress uses standard Server-Sent Events (SSE):

```
Client                              Server
  |                                   |
  |--- POST /api/compress ----------->| Spawns FFmpeg worker
  |<-- { jobId: "job_123" } ----------|
  |                                   |
  |--- GET /api/compress/job_123/sse->| Establishes persistent EventSource
  |<-- event: progress { 5% } --------| Streams real-time stdout/stderr
  |<-- event: progress { 12% } -------|
  | ...                               |
  |<-- event: complete { stats } -----| Closes stream & reports final metrics
```
