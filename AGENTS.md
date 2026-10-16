# AGENTS.md — Multi-Agent Collaboration & Continuity Protocol
## LuminaPress Video Studio

Welcome, AI Engineer / Collaborator! This document defines the engineering standards, architecture invariants, and working protocols for LuminaPress Video Studio. Any agent or developer joining this repository must read and follow this guide strictly.

---

### 1. Project Mission & Identity
- **Product Name:** LuminaPress Video Studio
- **Domain:** Autonomous, professional desktop & local video compression studio.
- **Core Principle:** "A defined task, multiple intelligent methods, proportional user control, and measurable verified results."
- **Language Stack:** TypeScript, React (Vite), Tailwind CSS, Node.js (Express), FFmpeg 9.0+ / FFprobe.

---

### 2. Golden Invariants (Non-Negotiable Rules)
1. **Never Overwrite Source Files:** The original file must never be overwritten, modified in-place, or deleted unless explicitly given permission via a unique destructive confirmation flow. Default output must be suffixed (e.g. `_luminapress.mp4` or placed in an output folder).
2. **Local & Privacy First:** All compression, probing, quality measurement, and metadata analysis runs 100% locally on the host machine. Never send user video data, metadata, or telemetry to external servers.
3. **No Fake / Mock UI Buttons:** Every button, slider, and selector in the interface must be backed by real functionality or clearly marked with roadmap status. No placebo controls.
4. **Resilient FFmpeg Discovery:** The system must locate FFmpeg from:
   - Project bundled `./bin/ffmpeg.exe` and `./bin/ffprobe.exe`
   - User system `PATH`
   - WinGet package directory (`%LOCALAPPDATA%\Microsoft\WinGet\Packages\...`)
   - Custom executable path configured in user settings.
5. **Non-Blocking Architecture:** Video encoding must always run asynchronously in background processes. The UI and API server must never freeze during heavy encoding tasks. Real-time metrics (progress %, FPS, speed, ETA) are streamed via Server-Sent Events (SSE).
6. **Robust Cancellation & Temp Cleanup:** Aborting a job must immediately terminate child processes and remove any orphaned temporary pass files (`*.log`, `*.mbtree`, partial output chunks).

---

### 3. Architecture Overview
```
Autonomous Video Compression Studio/
├── bin/                          # Local standalone FFmpeg & FFprobe binaries
├── docs/                         # Formal design, specs, and status docs
│   ├── ARCHITECTURE.md           # System design & module boundaries
│   ├── BUILD_AND_RELEASE.md      # Build, packaging, and distribution
│   ├── PRODUCT_SPEC.md           # User personas, requirements, acceptance criteria
│   ├── PROJECT_STATUS.md         # Real-time state of the repository
│   ├── ROADMAP.md                # Planned phases and milestones
│   ├── TECH_DECISIONS.md         # Technical justifications & alternatives
│   ├── TESTING.md                # Test execution instructions and records
│   └── UX_DESIGN.md              # Visual language, color palette, design system
├── server/                       # Node.js + Express backend service
│   ├── src/
│   │   ├── engine/               # Video compression & encoding pipeline
│   │   │   ├── binaryLocator.ts  # Multi-strategy FFmpeg/FFprobe locator
│   │   │   ├── probeService.ts   # Media stream and container analysis
│   │   │   ├── decisionEngine.ts # Smart bitrate, CRF, scale calculators
│   │   │   ├── hardwareAccel.ts  # NVENC, QSV, AMF, VULKAN probe
│   │   │   ├── encoderService.ts # Child process manager with progress parsing
│   │   │   ├── qualityMetrics.ts # SSIM and PSNR visual quality calculators
│   │   │   └── queueManager.ts   # Multi-file batch queue controller
│   │   ├── routes/               # API endpoints (probe, compress, cancel, queue, stats)
│   │   └── index.ts              # Server bootstrap and SSE streamer
│   └── package.json
├── src/                          # Vite + React + TypeScript frontend
│   ├── components/               # Modular studio components
│   │   ├── Header.tsx            # App branding, hardware status indicator
│   │   ├── DropZone.tsx          # Drag & drop video file loader
│   │   ├── MediaInspector.tsx    # Technical stream viewer (resolution, codecs, bitrate)
│   │   ├── ModeSelector.tsx      # Simple vs Target Size vs Advanced switch
│   │   ├── SimpleMode.tsx        # Goal-based presets (Max Compression, Balanced, Archive)
│   │   ├── TargetSizeMode.tsx    # Target size calculator with 2-pass budget
│   │   ├── AdvancedMode.tsx      # Granular codec, CRF, audio, scaling controls
│   │   ├── EncodingProgress.tsx  # Live progress bar with FPS, speed, remaining time
│   │   ├── ResultCard.tsx        # Before/after metrics, savings %, folder opener
│   │   ├── VideoCompareModal.tsx # Side-by-side / split slider video comparison
│   │   └── BatchQueueView.tsx    # Multi-file batch management tab
│   ├── hooks/                    # Custom React hooks (useEncoderSSE, useTheme)
│   ├── types/                    # Shared TypeScript interfaces
│   ├── App.tsx                   # Main Studio layout
│   └── index.css                 # Obsidian dark studio design system
├── package.json                  # Root workspace package orchestrator
├── README.md                     # Product introduction & quick start guide
├── CHANGELOG.md                  # Detailed version changelog
└── MASTER_PROMPT.md              # Original master requirements prompt
```

---

### 4. Working Rules for Subsequent Agents
1. **Always Read `docs/PROJECT_STATUS.md` First:** Before making any code changes, verify what is already implemented, which tests pass, and what the designated next step is.
2. **Never Break Existing Passing Tests:** Always run the test suite (`npm test`) before and after your edits.
3. **Keep Docs Synchronized:** When you implement a feature or change an architectural decision, update `docs/PROJECT_STATUS.md` and `CHANGELOG.md` in the same turn.
4. **Handoff Note Format:** At the end of every work session or major phase, append a clear handoff report in `docs/PROJECT_STATUS.md` covering:
   - Accomplished in this turn
   - Files created or modified
   - Test results with real terminal logs
   - Known limitations or open issues
   - Exact next action for the incoming agent.
