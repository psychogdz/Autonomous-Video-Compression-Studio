# TESTING & QUALITY ASSURANCE SPECIFICATION — LuminaPress Video Studio
## Verification Methodology, Benchmarks & Test Suite

---

### 1. Test Strategy Overview

Quality assurance in LuminaPress Video Studio covers four tiers:
1. **Unit Tests:** Mathematical models (decision engine, bitrate budgets, scale calculations), command builders, and regex progress parsers.
2. **Integration Tests:** `probeService` against real test media, hardware encoder detection, and SSE streaming lifecycle.
3. **End-to-End Encoding Verification:** Real video file compression executing through `ffmpeg.exe` with real file size measurement, playback verification, and cancellation cleanup.
4. **UI Component & Contract Tests:** Form validations, mode switching, estimate updates, and error state transitions.

---

### 2. Test Execution Commands

```bash
# Run complete test suite (unit + integration)
npm test

# Run backend unit tests only
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run end-to-end video compression verification benchmark
npm run test:e2e
```

---

### 3. Test Suites & Coverage Matrix

| Test Suite | File | Focus Areas |
|:---|:---|:---|
| **Binary Locator** | `binaryLocator.test.ts` | Resolves `./bin/`, WinGet, PATH; checks version output |
| **Probe Service** | `probeService.test.ts` | Parses test video streams, formats, audio channels, corrupt handling |
| **Decision Engine** | `decisionEngine.test.ts` | Calculates 2-pass bitrate, CRF mapping, boundary warnings, estimates |
| **Encoder Service** | `encoderService.test.ts` | Builds FFmpeg command args, parses stdout progress, handles abort/cancel |
| **Hardware Detection**| `hardwareAccel.test.ts` | Detects NVENC/QSV/AMF/CPU encoders gracefully |
| **Queue Manager** | `queueManager.test.ts` | Concurrency control, queue reordering, pause/resume/clear |
| **E2E Pipeline** | `e2eCompression.test.ts` | Compresses real synthetic test video; verifies output file & playback |

---

### 4. Synthetic Test Media Generation

To ensure reproducible testing without requiring massive external downloads, the test suite generates standardized test clips using FFmpeg's `testsrc` and `sine` synthetic filters:

```bash
# 5-second 1080p60 test clip with audio
ffmpeg -f lavfi -i testsrc=duration=5:size=1920x1080:rate=60 -f lavfi -i sine=frequency=1000:duration=5 -c:v libx264 -c:a aac test_media_1080p.mp4
```

This guarantees 100% offline, deterministic CI/CD and developer testing.
