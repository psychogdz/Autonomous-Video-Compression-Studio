# PRODUCT SPECIFICATION — LuminaPress Video Studio
## Version 1.0.0

---

### 1. Executive Summary & Vision
LuminaPress Video Studio is a high-performance desktop and local web application built for creators, professionals, and everyday users who need to reduce video file sizes dramatically without sacrificing perceptible visual quality. Unlike bare-bones FFmpeg wrappers or bloated commercial software laden with subscriptions, LuminaPress provides an intelligent decision engine that calculates the optimal mathematical compression profile based on input characteristics and user intent.

---

### 2. User Personas & Core Problems

#### Persona A: The Casual Sharer ("Quick & Small")
- **Pain Point:** Has recorded a 180MB screen recording or phone clip and needs to send it over Discord (8MB/25MB/50MB limit) or WhatsApp/Telegram without failing or waiting 10 minutes.
- **Need:** Drag, click "Discord Preset" or enter "25MB", hit Compress, done. No technical jargon required.

#### Persona B: The Content Creator & Remote Worker ("Balanced Quality")
- **Pain Point:** Needs to upload 4K/1080p video drafts to cloud storage or project review platforms. Uploading 2GB raw takes forever and wastes bandwidth.
- **Need:** High perceptual quality (visually indistinguishable from original on standard screens), smooth audio, fast export, and side-by-side visual comparison to guarantee quality prior to delivery.

#### Persona C: The Digital Archivist ("Max Efficiency / Space Saving")
- **Pain Point:** Hard drives are filling up with large legacy H.264 or ProRes camera recordings.
- **Need:** Batch conversion of dozens of files to modern high-efficiency codecs (H.265/HEVC or AV1) with 10-bit color support, preserved audio channels, and verified compression statistics.

#### Persona D: The Video Engineer / Power User ("Granular Control")
- **Pain Point:** Most compression tools hide or lock down CRF, GOP size, encoder presets, audio bitrates, pixel formats, and hardware acceleration options.
- **Need:** Complete transparency over the generated FFmpeg command, custom CRF/CQP sliders, encoder speed presets (ultrafast to veryslow), and explicit encoder choice (CPU libx264/libx265/libsvtav1 vs GPU NVENC/QSV/AMF).

---

### 3. Functional Requirements

#### 3.1 Media Analysis & Probing (`ProbeService`)
- The system must parse video containers (`.mp4`, `.mov`, `.mkv`, `.avi`, `.webm`, `.flv`, `.ts`).
- Extracted technical metadata must include:
  - Container format and total file size (in bytes, KB, MB, GB).
  - Video streams: codec name, profile, width, height, aspect ratio, frame rate (`r_frame_rate`, `avg_frame_rate`), pixel format, duration, and video bitrate.
  - Audio streams: codec name, sample rate, channel count, channel layout, and audio bitrate.
  - Subtitle streams: presence, format, language tags.
- Robust handling of corrupted files, zero-byte files, and invalid paths with user-friendly error banners.

#### 3.2 Interaction Modes
- **Mode 1 — Simple (Goal-Oriented):**
  - **Maximum Compression:** Targets 60–80% size reduction using aggressive CRF, optimized resolution, and efficient audio encoding.
  - **Balanced:** Targets ~50% size reduction maintaining visually indistinguishable quality (CRF 22–24 on H.264 / CRF 26–28 on H.265).
  - **High Quality / Archive:** Targets 20–35% size reduction with near-lossless fidelity (CRF 18–20 on H.264 / CRF 22–24 on H.265).
  - **Social / Messaging Presets:** Discord (25MB target), Telegram (Fast HD), WhatsApp (Optimized 720p), YouTube 1080p Upload.
- **Mode 2 — Target Size (Exact Budget Mode):**
  - User specifies desired output file size in Megabytes (MB).
  - Decision engine automatically calculates available video bitrate budget after deducting audio track overhead:
    $$\text{Bitrate}_{\text{video}} = \frac{\text{TargetSize (bytes)} \times 8}{\text{Duration (seconds)}} - \text{Bitrate}_{\text{audio}}$$
  - Automatic 2-Pass encoding recommendation to hit target size within ±3% accuracy.
  - Safety validation: If target size is mathematically impossible or excessively low for the video resolution/duration, system automatically warns and suggests resolution downscaling (e.g., 1080p → 720p).
- **Mode 3 — Advanced (Professional Mode):**
  - Video Codec selection: `H.264 (libx264)`, `H.265 / HEVC (libx265)`, `AV1 (libsvtav1)`, and hardware equivalents if detected.
  - Rate Control: CRF (Constant Rate Factor) or Target Average Bitrate (ABR).
  - Speed / Efficiency Preset: `ultrafast`, `superfast`, `veryfast`, `faster`, `fast`, `medium`, `slow`, `slower`, `veryslow`.
  - Resolution Scaling: Keep Original, 4K, 1440p, 1080p, 720p, 480p, or Custom Scale with aspect ratio lock.
  - Frame Rate Control: Keep Original, 60fps, 30fps, 24fps.
  - Audio Control: Copy Audio (lossless passthrough), AAC, Opus, MP3; Bitrates: 64k, 96k, 128k, 192k, 256k, 320k; Stereo / Mono / Multi-channel.

#### 3.3 Real-Time Monitoring & Controls
- Real-time progress bar displaying:
  - Percentage completed (0% to 100%).
  - Current processing frame and total estimated frames.
  - Current encoding FPS and speed multiplier (e.g. `1.85x`).
  - Elapsed time and estimated time remaining (ETA).
  - Current output file size growing dynamically.
- Instant Cancellation: User can press "Cancel" at any time. The process terminates cleanly within 500ms and cleans up temporary pass logs and unfinished files.

#### 3.4 Post-Compression Verification & Comparison
- Clear outcome summary:
  - Original size vs Compressed size.
  - Total bytes and megabytes saved.
  - Compression ratio percentage (e.g., `-68.4%`).
  - Processing duration and average encoding speed.
- Interactive Video Comparison:
  - Side-by-side or split-slider visual inspector allowing synchronized frame scrubbing between source and compressed video.
- Actionable next steps:
  - One-click "Open Output Folder" in native file explorer.
  - One-click "Play Compressed Video".
  - One-click "Re-encode with Different Preset".

#### 3.5 Batch Processing Queue
- Add multiple files to a centralized queue.
- Configure presets per item or apply a batch preset to all.
- Control concurrent workers (1–2 parallel processes to prevent CPU/GPU thrashing).
- Pause, Resume, Remove, or Retry failed jobs.

---

### 4. Non-Functional Requirements
- **Performance:** Native binary execution through Node.js `child_process.spawn`. No bloated intermediaries.
- **Offline Reliability:** Zero internet connection required for core operations.
- **Safety & Zero Data Loss:** Under no circumstances will a source file be overwritten without explicit opt-in confirmation. Default destination generates a unique safe filename.
- **Accessibility & Contrast:** High contrast UI following WCAG 2.1 AA standards, supporting keyboard navigation and screen-reader accessible attributes.
