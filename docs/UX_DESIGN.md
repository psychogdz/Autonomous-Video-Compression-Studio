# UX & VISUAL DESIGN SYSTEM — LuminaPress Video Studio
## Identity, Aesthetics, and Interaction Specifications

---

### 1. Brand Personality & Identity
- **Name:** LuminaPress Video Studio
- **Essence:** Professional, Precise, Modern, Reassuring.
- **Aesthetic Direction:** Obsidian Dark Studio. Inspired by modern creative suites (DaVinci Resolve, Figma, Linear) without unnecessary clutter or fake complexity.
- **Tone:** Technical clarity without overwhelming jargon. Every parameter includes contextual tooltips and plain-language impact indicators.

---

### 2. Design Tokens & Color Palette

```
Surface & Backgrounds:
  - Canvas Deep:       #0B0F19 (Ultra-deep slate obsidian)
  - Card Surface:      #111827 (Dark neutral surface)
  - Card Raised:       #1F2937 (Border & elevated containers)
  - Card Hover:        #374151 (Interactive hover state)

Brand & Accent:
  - Sapphire Primary:  #3B82F6 (Action buttons, active tabs, progress fill)
  - Indigo Glow:       #6366F1 (Gradients, highlight banners)
  - Violet Tint:       #8B5CF6 (Advanced features, AI/Decision engine)

Semantic Signals:
  - Emerald Success:   #10B981 (Savings badge, completed jobs, verified codecs)
  - Amber Warning:     #F59E0B (Low bitrate warnings, incompatible configs)
  - Rose Danger/Abort: #EF4444 (Errors, cancel button, disk space limits)
  - Cyan Telemetry:    #06B6D4 (Encoding FPS, speed multiplier, elapsed time)

Typography:
  - UI Sans:           'Inter', system-ui, -apple-system, sans-serif
  - Monospace Data:    'Fira Code', 'JetBrains Mono', Consolas, monospace
```

---

### 3. Layout Grid & Information Hierarchy

The studio is organized into a dual-column ergonomic workflow:

```
+-----------------------------------------------------------------------------------+
|  [Logo & LuminaPress Title]        [Hardware: NVIDIA RTX 4070 / CPU]  [Queue: 3]  |
+-------------------------------------------------+---------------------------------+
|  LEFT COLUMN (60%): Configuration & Source      |  RIGHT COLUMN (40%): Telemetry  |
|                                                 |                                 |
|  [ 1. SOURCE VIDEO DROPZONE & INSPECTOR ]       |  [ 4. REAL-TIME PROGRESS ]      |
|  File: sample_4k.mp4 (450 MB, 1080p, 60fps)    |  Encoding: 47% [============> ] |
|  Video: H.264 High | Audio: AAC 192k Stereo     |  Speed: 2.45x | FPS: 147        |
|                                                 |  ETA: 00:23   | Elapsed: 00:21  |
|  [ 2. INTERACTION MODE TABS ]                   |  [ Cancel Job ]                 |
|  [ Simple ]  [ Target Size ]  [ Advanced ]      |                                 |
|                                                 |  [ 5. RESULT & COMPARISON ]     |
|  [ 3. MODE CONFIGURATION PANEL ]                |  Original:   450.0 MB           |
|  - Simple: [Max Compression] [Balanced] [High]  |  Compressed: 112.5 MB           |
|  - Target: [ Slider: 25 MB ] [2-Pass: ON]       |  Saved:      337.5 MB (-75.0%)  |
|  - Advanced: [Codec] [CRF] [Preset] [Audio]     |                                 |
|                                                 |  [ Open Folder ] [ Play ]       |
|  [ START COMPRESSION (Ctrl+Enter) ]             |  [ Split Comparison Slider ]    |
+-------------------------------------------------+---------------------------------+
```

---

### 4. Interactive States

1. **Idle State:** Clean dropzone with prompt "Drag & drop video here, or click to browse". Supported formats listed clearly.
2. **Analyzing State:** Subtle pulsing radar animation while `ffprobe` analyzes streams. Displays detected codec, duration, audio streams within ~150ms.
3. **Configured State:** Decision engine displays instant estimate:
   - "Estimated Output Size: ~110–130 MB (-72%)"
   - "Estimated Time: ~20 seconds"
4. **Encoding State:** The "Start Compression" button transforms into an active cancellation control. The right telemetry pane activates with a live SVG progress ring / bar, FPS readout, and speed multiplier.
5. **Success State:** Celebration badge with exact space saved (e.g. `Saved 337.5 MB (-75.0%)`). Interactive video player loads the compressed file, with one-click folder reveal.
6. **Error / Abort State:** Clear diagnostic message with recovery suggestions. Unfinished output files are immediately cleaned up.

---

### 5. Interactive Before/After Video Comparison Modal
- Synchronized dual HTML5 video players connected to a draggable split-view divider.
- Left half shows original video frame; right half shows compressed video frame.
- Allows user to zoom in and scrub frames side-by-side to verify visual sharpness, color accuracy, and artifact suppression before saving or sharing.
