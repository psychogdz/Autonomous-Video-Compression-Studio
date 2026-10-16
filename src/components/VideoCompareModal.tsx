import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Move,
  RotateCcw,
  Info,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { QualityScore, CompressionOutcome, MediaProbeResult } from '../../shared/types';

interface VideoCompareModalProps {
  originalPath: string;
  compressedPath: string;
  result?: CompressionOutcome;
  metadata?: MediaProbeResult;
  onClose: () => void;
}

export const VideoCompareModal: React.FC<VideoCompareModalProps> = ({
  originalPath,
  compressedPath,
  result,
  metadata,
  onClose,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 4>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Quality metrics state
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [isCalculatingQuality, setIsCalculatingQuality] = useState(false);
  const [showQualityDetails, setShowQualityDetails] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const compressedVideoRef = useRef<HTMLVideoElement>(null);

  // Dragging state refs
  const isDraggingSeamRef = useRef(false);
  const isPanningRef = useRef(false);
  const startMouseRef = useRef({ x: 0, y: 0 });
  const startPanRef = useRef({ x: 0, y: 0 });

  const originalUrl = `/api/stream?path=${encodeURIComponent(originalPath)}`;
  const compressedUrl = `/api/stream?path=${encodeURIComponent(compressedPath)}`;
  const isGifOutput = compressedPath.toLowerCase().endsWith('.gif');

  const formatBytes = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };

  // Reset pan when zoom changes to 1x
  const handleZoomChange = (newZoom: 1 | 2 | 4) => {
    setZoomLevel(newZoom);
    if (newZoom === 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleResetPan = () => {
    setPanOffset({ x: 0, y: 0 });
  };

  const handleStepPan = (dx: number, dy: number) => {
    setPanOffset((prev) => {
      const maxX = 180 * (zoomLevel - 1);
      const maxY = 120 * (zoomLevel - 1);
      return {
        x: Math.max(-maxX, Math.min(maxX, prev.x + dx)),
        y: Math.max(-maxY, Math.min(maxY, prev.y + dy)),
      };
    });
  };

  // Synchronize playback between original and compressed videos
  const togglePlay = () => {
    if (!originalVideoRef.current || !compressedVideoRef.current) return;

    if (isPlaying) {
      originalVideoRef.current.pause();
      compressedVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      compressedVideoRef.current.currentTime = originalVideoRef.current.currentTime;
      originalVideoRef.current.play();
      compressedVideoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (originalVideoRef.current) originalVideoRef.current.currentTime = time;
    if (compressedVideoRef.current) compressedVideoRef.current.currentTime = time;
  };

  const handleStepFrame = (frames: number) => {
    if (!originalVideoRef.current || !compressedVideoRef.current) return;
    if (isPlaying) {
      originalVideoRef.current.pause();
      compressedVideoRef.current.pause();
      setIsPlaying(false);
    }
    const frameDuration = 1 / 30;
    const target = Math.max(0, Math.min(duration || 100, originalVideoRef.current.currentTime + frames * frameDuration));
    originalVideoRef.current.currentTime = target;
    compressedVideoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleTimeUpdate = () => {
    if (originalVideoRef.current) {
      const cur = originalVideoRef.current.currentTime;
      setCurrentTime(cur);

      if (compressedVideoRef.current && Math.abs(compressedVideoRef.current.currentTime - cur) > 0.08) {
        compressedVideoRef.current.currentTime = cur;
      }

      if (!duration && originalVideoRef.current.duration) {
        setDuration(originalVideoRef.current.duration);
      }
    }
  };

  // Seam coordinate calculation locked directly to video zoom space
  const updateSliderFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const W = rect.width;
    const rawOffsetFromCenter = (clientX - rect.left) - (W / 2);
    // Counter-adjust for zoom and panOffset so seam tracks under mouse
    const unscaledOffset = (rawOffsetFromCenter / zoomLevel) - panOffset.x;
    const percent = 50 + (unscaledOffset / W) * 100;
    setSliderPosition(Math.max(2, Math.min(98, percent)));
  }, [zoomLevel, panOffset.x]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isSeam = target.closest('.seam-handle') || target.classList.contains('seam-handle');

    if (isSeam) {
      // Dragging the comparison divider
      isDraggingSeamRef.current = true;
      updateSliderFromClientX(e.clientX);
    } else if (zoomLevel > 1) {
      // Panning the zoomed canvas
      isPanningRef.current = true;
      startMouseRef.current = { x: e.clientX, y: e.clientY };
      startPanRef.current = { ...panOffset };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingSeamRef.current) {
      updateSliderFromClientX(e.clientX);
    } else if (isPanningRef.current && zoomLevel > 1) {
      const dx = (e.clientX - startMouseRef.current.x) / zoomLevel;
      const dy = (e.clientY - startMouseRef.current.y) / zoomLevel;
      const maxX = 180 * (zoomLevel - 1);
      const maxY = 120 * (zoomLevel - 1);
      setPanOffset({
        x: Math.max(-maxX, Math.min(maxX, startPanRef.current.x + dx)),
        y: Math.max(-maxY, Math.min(maxY, startPanRef.current.y + dy)),
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingSeamRef.current = false;
    isPanningRef.current = false;
  };

  // Compute SSIM and PSNR via FFmpeg
  const handleCalculateQuality = async () => {
    setIsCalculatingQuality(true);
    try {
      const res = await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalPath, compressedPath }),
      });
      const data = await res.json();
      setQualityScore(data);
      setShowQualityDetails(true);
    } catch {
      // Ignore
    } finally {
      setIsCalculatingQuality(false);
    }
  };

  useEffect(() => {
    const onUp = () => {
      isDraggingSeamRef.current = false;
      isPanningRef.current = false;
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const getQualityVerdict = (ssim?: number, psnr?: number) => {
    if (!ssim) return 'High Fidelity';
    if (ssim >= 0.985 && (psnr || 0) >= 42) {
      return 'Studio Master (Visually Indistinguishable from Source)';
    }
    if (ssim >= 0.96) {
      return 'Broadcast Fidelity (Studio Broadcast Standard)';
    }
    if (ssim >= 0.92) {
      return 'High Efficiency (Good Visual Quality, High Compression)';
    }
    return 'Noticeable Compression (Minor Visual Tradeoffs)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-void-950/90 backdrop-blur-2xl animate-fade-in">
      <div className="w-full max-w-6xl bg-void-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* 1. Modal Top Control Bar */}
        <div className="p-3.5 sm:p-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-void-950/80">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Synchronized Video Inspector</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-prism-cyan/15 text-prism-cyan border border-prism-cyan/30 font-semibold">
                Dual Stream
              </span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 p-0.5 rounded-xl bg-void-900 border border-white/10 text-xs font-mono">
              <span className="text-[10px] text-slate-400 pl-2 pr-1 font-sans">Zoom:</span>
              {([1, 2, 4] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => handleZoomChange(z)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    zoomLevel === z
                      ? 'bg-prism-cyan text-void-950 shadow-[0_0_8px_#00D2FF]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`${z}x Zoom Level`}
                >
                  {z}x
                </button>
              ))}
            </div>

            {/* Pan Controls (When Zoom > 1) */}
            {zoomLevel > 1 && (
              <div className="flex items-center space-x-1 p-0.5 rounded-xl bg-void-900 border border-white/10 text-xs">
                <span className="text-[10px] text-slate-400 pl-2 pr-1">Pan:</span>
                <button
                  onClick={() => handleStepPan(30, 0)}
                  className="p-1 rounded hover:bg-void-800 text-slate-300 hover:text-white"
                  title="Pan Left"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleStepPan(-30, 0)}
                  className="p-1 rounded hover:bg-void-800 text-slate-300 hover:text-white"
                  title="Pan Right"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleStepPan(0, 30)}
                  className="p-1 rounded hover:bg-void-800 text-slate-300 hover:text-white"
                  title="Pan Up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleStepPan(0, -30)}
                  className="p-1 rounded hover:bg-void-800 text-slate-300 hover:text-white"
                  title="Pan Down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  onClick={handleResetPan}
                  className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/[0.06] hover:bg-white/15 text-slate-200"
                  title="Reset to center"
                >
                  Center
                </button>
              </div>
            )}

            {/* Quality Score Trigger / Badge */}
            {!qualityScore && !isGifOutput ? (
              <button
                onClick={handleCalculateQuality}
                disabled={isCalculatingQuality}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
              >
                {isCalculatingQuality ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-prism-cyan" />
                    <span>Analyzing SSIM/PSNR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-prism-amber" />
                    <span>Measure Quality (SSIM)</span>
                  </>
                )}
              </button>
            ) : qualityScore ? (
              <button
                onClick={() => setShowQualityDetails(!showQualityDetails)}
                className="flex items-center space-x-2 text-xs font-mono px-3 py-1 rounded-xl bg-prism-mint/15 hover:bg-prism-mint/25 border border-prism-mint/30 transition-colors"
                title="Click to toggle detailed metric explanations"
              >
                <span className="font-bold text-prism-mint">
                  SSIM: {qualityScore.ssim}
                </span>
                <span className="text-slate-400">|</span>
                <span className="font-bold text-prism-cyan">
                  {qualityScore.psnr} dB
                </span>
                <Info className="w-3.5 h-3.5 text-prism-mint ml-0.5" />
              </button>
            ) : null}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-void-900 hover:bg-void-850 text-slate-400 hover:text-white transition-colors border border-white/10"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Educational SSIM & PSNR Quality Analysis Panel */}
        {qualityScore && showQualityDetails && (
          <div className="p-4 bg-void-950/95 border-b border-white/[0.08] space-y-3 animate-fade-in shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-prism-mint shrink-0" />
                <span className="text-xs font-bold text-white tracking-wide">
                  Scientific Visual Quality Analysis
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-prism-mint/20 text-prism-mint border border-prism-mint/40">
                Grade: {getQualityVerdict(qualityScore.ssim, qualityScore.psnr)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* SSIM explanation card */}
              <div className="p-3 rounded-xl bg-void-900/90 border border-prism-mint/30 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-prism-mint font-mono">
                    SSIM = {qualityScore.ssim} / 1.000
                  </span>
                  <span className="text-[10px] font-mono text-slate-300 px-1.5 py-0.2 rounded bg-prism-mint/10">
                    Structural Similarity
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
                  SSIM measures luminance, contrast, and structure preservation modeled on the human visual system. A score of <strong className="text-white font-mono">{qualityScore.ssim}</strong> confirms that over <strong className="text-prism-mint font-mono">{((qualityScore.ssim || 0) * 100).toFixed(1)}%</strong> of perceived details are structurally identical to the uncompressed source (broadcast standard: ≥ 0.95).
                </p>
              </div>

              {/* PSNR explanation card */}
              <div className="p-3 rounded-xl bg-void-900/90 border border-prism-cyan/30 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-prism-cyan font-mono">
                    PSNR = {qualityScore.psnr} dB
                  </span>
                  <span className="text-[10px] font-mono text-slate-300 px-1.5 py-0.2 rounded bg-prism-cyan/10">
                    Signal-to-Noise Ratio
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
                  PSNR quantifies mathematical reconstruction fidelity in decibels (dB). Broadcast industry benchmark is 35–40 dB; a value of <strong className="text-white font-mono">{qualityScore.psnr} dB</strong> certifies studio master grade with virtually zero perceptible compression noise.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Precision Dual-Stream Viewport Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`relative flex-1 min-h-[380px] sm:min-h-[480px] bg-black select-none overflow-hidden ${
            zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-ew-resize'
          }`}
        >
          {/* Zoom & Pan Wrapper - Transforms both video streams and the divider together */}
          <div
            className="absolute inset-0 origin-center pointer-events-none transition-transform duration-100 ease-out"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            }}
          >
            {/* Stream 1: Compressed Video (Underneath Layer) */}
            {isGifOutput ? (
              <img
                src={compressedUrl}
                alt="Compressed"
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <video
                ref={compressedVideoRef}
                src={compressedUrl}
                className="absolute inset-0 w-full h-full object-contain"
                muted
                playsInline
              />
            )}

            {/* Stream 2: Original Video (Clipped to left side of slider) */}
            <video
              ref={originalVideoRef}
              src={originalUrl}
              onTimeUpdate={handleTimeUpdate}
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
              }}
              muted
              playsInline
            />

            {/* Divider Seam Line - INSIDE Zoom Wrapper so it ALWAYS sits directly on the video's cut line */}
            <div
              className="seam-handle absolute top-0 bottom-0 z-30 flex items-center justify-center -ml-[1px] pointer-events-auto cursor-ew-resize"
              style={{ left: `${sliderPosition}%`, width: `${Math.max(2, 4 / zoomLevel)}px` }}
            >
              {/* Vertical line matching zoom resolution */}
              <div className="w-[2px] h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.95)]" />

              {/* Seam Handle Icon - Counter-scaled so it stays crisp at all zoom levels */}
              <div
                className="seam-handle absolute w-8 h-8 rounded-full bg-void-950 border-2 border-white shadow-[0_0_16px_#00D2FF] flex items-center justify-center text-prism-cyan text-xs font-bold cursor-ew-resize"
                style={{ transform: `scale(${1 / zoomLevel})` }}
              >
                ⬌
              </div>
            </div>
          </div>

          {/* Left Stream Badge (Always Original Source) */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div className="px-3.5 py-1.5 rounded-xl bg-void-950/85 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-white shadow-xl space-y-0.5">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>ORIGINAL SOURCE</span>
              </div>
              <p className="text-[10px] text-slate-300 font-normal">
                {result ? formatBytes(result.originalSizeBytes) : formatBytes(metadata?.fileSizeBytes)} • {metadata?.primaryVideo?.codecName?.toUpperCase() || 'SOURCE'} {metadata?.primaryVideo ? `(${metadata.primaryVideo.width}x${metadata.primaryVideo.height})` : ''}
              </p>
            </div>
          </div>

          {/* Right Stream Badge (Compressed Output) */}
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <div className="px-3.5 py-1.5 rounded-xl bg-void-950/85 backdrop-blur-md border border-prism-cyan/50 text-xs font-mono font-bold text-prism-cyan shadow-xl space-y-0.5 text-right">
              <div className="flex items-center justify-end space-x-1.5">
                <span>COMPRESSED OUTPUT</span>
                <span className="w-2 h-2 rounded-full bg-prism-cyan shadow-[0_0_8px_#00D2FF]" />
              </div>
              <p className="text-[10px] text-slate-300 font-normal">
                {result ? `${formatBytes(result.compressedSizeBytes)} (-${result.savedPercent}%)` : 'COMPRESSED'} • {result?.actualVideoCodec?.toUpperCase() || 'OPTIMIZED'}
              </p>
            </div>
          </div>

          {/* Interactive Zoom Panning Hint Badge */}
          {zoomLevel > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="px-3.5 py-1 rounded-full bg-void-950/90 backdrop-blur-md border border-prism-cyan/40 text-[11px] font-sans text-slate-300 shadow-xl flex items-center space-x-2">
                <Move className="w-3.5 h-3.5 text-prism-cyan animate-pulse" />
                <span>Click & drag canvas to pan viewport • Zoom: {zoomLevel}x</span>
              </div>
            </div>
          )}
        </div>

        {/* 4. Player Controls Bar */}
        <div className="p-4 bg-void-950 border-t border-white/[0.08] flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-prism-cyan to-prism-electric hover:opacity-95 flex items-center justify-center text-void-950 shrink-0 transition-all shadow-glow-cyan font-bold"
            title={isPlaying ? 'Pause' : 'Play synchronized'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Frame Step Controls */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => handleStepFrame(-1)}
              className="p-2 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title="Step backward 1 frame"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleStepFrame(1)}
              className="p-2 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title="Step forward 1 frame"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Timeline Scrub Slider */}
          <div className="flex-1 min-w-[200px] flex items-center space-x-3">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.033"
              value={currentTime}
              onChange={handleSeek}
              className="w-full"
            />
            <span className="text-xs font-mono text-slate-300 shrink-0 font-medium">
              {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
