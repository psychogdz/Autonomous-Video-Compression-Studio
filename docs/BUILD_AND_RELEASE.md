# BUILD & RELEASE SPECIFICATION — LuminaPress Video Studio
## Packaging, Distribution, and Production Deployment

---

### 1. Prerequisites
- **Node.js:** v18.0.0 or later (v20+ / v24+ recommended)
- **npm:** v9.0.0 or later
- **FFmpeg & FFprobe:** Included in `./bin` or installed on system PATH
- **Operating Systems:** Windows 10/11 (x64), macOS (Apple Silicon / Intel), Linux (x86_64)

---

### 2. Development Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd "Autonomous Video Compression Studio"

# 2. Install dependencies (root, frontend, and backend)
npm install

# 3. Start development environment (Vite frontend on 5173 + Express backend on 3001)
npm run dev
```

The application automatically opens at `http://localhost:5173`. The backend runs on `http://localhost:3001` with API proxying configured.

---

### 3. Production Build

```bash
# Build frontend and compile backend TypeScript
npm run build

# Start production server (serves static UI + API)
npm start
```

---

### 4. Standalone Desktop Distribution

LuminaPress can be distributed as a self-contained desktop package:
1. **Portable Bundle:** Node.js standalone runtime with bundled `bin/ffmpeg.exe` and pre-built frontend in `dist/`.
2. **One-Click Launchers:**
   - `LuminaPress.bat` (Windows)
   - `LuminaPress.sh` (macOS/Linux)
3. **Electron Wrapper (Optional Enhancement):** Packaged via `electron-builder` producing an `.exe` installer or `.dmg`.

---

### 5. Licensing & Compliance
- **LuminaPress Studio:** MIT License.
- **FFmpeg:** Distributed under GNU GPL v3 / LGPL. LuminaPress invokes FFmpeg strictly as an external child process CLI binary via standard operating system pipes (`child_process.spawn`), maintaining complete compliance with GPL/LGPL linking requirements.
