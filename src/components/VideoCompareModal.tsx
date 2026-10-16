import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
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
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100 in video coordinates
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 4>(1);

  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [isCalculatingQuality, setIsCalculatingQuality] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const compressedVideoRef = useRef<HTMLVideoElement>(null);
  const isDraggingRef = useRef(false);

  const originalUrl = `/api/stream?path=${encodeURIComponent(originalPath)}`;
  const compressedUrl = `/api/stream?path=${encodeURIComponent(compressedPath)}`;
  const isGifOutput = compressedPath.toLowerCase().endsWith('.gif');

  const formatBytes = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
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

  // Draggable Split Divider locked directly to zoom coordinate space
  const updateSliderFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const W = rect.width;
    // Calculate raw mouse displacement from center of container
    const rawOffsetFromCenter = (clientX - rect.left) - (W / 2);
    // When zoomed, divide displacement by zoom level so divider handle stays locked 1:1 with mouse cursor
    const unscaledOffset = rawOffsetFromCenter / zoomLevel;
    const percent = 50 + (unscaledOffset / W) * 100;
    setSliderPosition(Math.max(2, Math.min(98, percent)));
  }, [zoomLevel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    updateSliderFromClientX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    updateSliderFromClientX(e.clientX);
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
    } catch {
      // Ignore
    } finally {
      setIsCalculatingQuality(false);
    }
  };

  useEffect(() => {
    const onUp = () => { isDraggingRef.current = false; };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

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
                  onClick={() => setZoomLevel(z)}
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

            {/* Quality Score Trigger / Readout */}
            {!qualityScore && !isGifOutput ? (
              <button
                onClick={handleCalculateQuality}
                disabled={isCalculatingQuality}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
              >
                {isCalculatingQuality ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-prism-cyan" />
                    <span>Measuring SSIM...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-prism-amber" />
                    <span>Measure SSIM</span>
                  </>
                )}
              </button>
            ) : qualityScore ? (
              <div className="flex items-center space-x-2 text-xs font-mono">
                {qualityScore.ssim && (
                  <span className="px-2.5 py-1 rounded-lg bg-prism-mint/15 text-prism-mint border border-prism-mint/30 font-bold">
                    SSIM: {qualityScore.ssim}
                  </span>
                )}
                {qualityScore.psnr && (
                  <span className="px-2.5 py-1 rounded-lg bg-prism-cyan/15 text-prism-cyan border border-prism-cyan/30 font-bold">
                    PSNR: {qualityScore.psnr} dB
                  </span>
                )}
              </div>
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

        {/* 2. Precision Dual-Stream Viewport Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          className="relative flex-1 min-h-[380px] sm:min-h-[480px] bg-black select-none overflow-hidden cursor-ew-resize"
        >
          {/* Zoom Wrapper - Everything inside scales together with origin: center */}
          <div
            className="absolute inset-0 origin-center pointer-events-none transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
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
              className="absolute top-0 bottom-0 z-30 cursor-ew-resize flex items-center justify-center -ml-[1px] pointer-events-auto"
              style={{ left: `${sliderPosition}%`, width: `${2 / zoomLevel}px` }}
            >
              {/* Vertical line matching zoom resolution */}
              <div
                className="w-full h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]"
              />

              {/* Seam Handle Icon - Counter-scaled so it stays crisp at all zoom levels */}
              <div
                className="absolute w-8 h-8 rounded-full bg-void-950 border-2 border-white shadow-[0_0_16px_#00D2FF] flex items-center justify-center text-prism-cyan text-xs font-bold cursor-ew-resize"
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
        </div>

        {/* 3. Player Controls Bar */}
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
