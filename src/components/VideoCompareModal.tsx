import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Award, Gauge, Sparkles, Loader2 } from 'lucide-react';
import { QualityScore } from '../../shared/types';

interface VideoCompareModalProps {
  originalPath: string;
  compressedPath: string;
  onClose: () => void;
}

export const VideoCompareModal: React.FC<VideoCompareModalProps> = ({
  originalPath,
  compressedPath,
  onClose,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 - 100
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [isCalculatingQuality, setIsCalculatingQuality] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const compressedVideoRef = useRef<HTMLVideoElement>(null);
  const isDraggingRef = useRef(false);

  const originalUrl = `/api/stream?path=${encodeURIComponent(originalPath)}`;
  const compressedUrl = `/api/stream?path=${encodeURIComponent(compressedPath)}`;

  const isGifOutput = compressedPath.toLowerCase().endsWith('.gif');

  // Synchronize playback between original and compressed videos
  const togglePlay = () => {
    if (!originalVideoRef.current || !compressedVideoRef.current) return;

    if (isPlaying) {
      originalVideoRef.current.pause();
      compressedVideoRef.current.pause();
      setIsPlaying(false);
    } else {
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

  const handleTimeUpdate = () => {
    if (originalVideoRef.current) {
      setCurrentTime(originalVideoRef.current.currentTime);
      if (!duration && originalVideoRef.current.duration) {
        setDuration(originalVideoRef.current.duration);
      }
    }
  };

  // Draggable Split Divider
  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  // Compute SSIM and PSNR
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
      // Ignore score error
    } finally {
      setIsCalculatingQuality(false);
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void-950/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-5xl bg-void-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-base font-bold text-white tracking-tight">
              Interactive Before / After Visual Comparison
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded font-mono bg-prism-cyan/15 text-prism-cyan border border-prism-cyan/30 font-semibold">
              Split Slider
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quality Score Trigger */}
            {!qualityScore && !isGifOutput ? (
              <button
                onClick={handleCalculateQuality}
                disabled={isCalculatingQuality}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-void-850 hover:bg-void-800 border border-white/10 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50 shadow-glass-rim-subtle"
              >
                {isCalculatingQuality ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-prism-cyan" />
                    <span>Measuring SSIM...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-prism-amber" />
                    <span>Measure SSIM / PSNR</span>
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

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-void-850 hover:bg-void-800 text-slate-400 hover:text-white transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className="relative flex-1 min-h-[380px] sm:min-h-[460px] bg-black select-none overflow-hidden cursor-ew-resize"
        >
          {/* Compressed Media (Full Canvas Background) */}
          {isGifOutput ? (
            <img
              src={compressedUrl}
              alt="Compressed Preview"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <video
              ref={compressedVideoRef}
              src={compressedUrl}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              muted
              playsInline
            />
          )}

          {/* Original Video (Clipped by Slider Position) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <video
              ref={originalVideoRef}
              src={originalUrl}
              onTimeUpdate={handleTimeUpdate}
              className="absolute inset-0 w-full h-full object-contain"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                maxWidth: 'none',
              }}
              muted
              playsInline
            />
          </div>

          {/* Draggable Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 cursor-ew-resize flex items-center justify-center -ml-0.5"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={handleMouseDown}
          >
            <div className="w-8 h-8 rounded-full bg-prism-cyan border-2 border-white shadow-[0_0_15px_#00D2FF] flex items-center justify-center text-void-950 text-xs font-bold">
              ⬌
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-white shadow-lg">
            ORIGINAL SOURCE
          </div>
          <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-lg bg-prism-cyan/85 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-void-950 shadow-lg">
            COMPRESSED OUTPUT
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="p-4 bg-void-950 border-t border-white/[0.08] flex items-center space-x-4">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-prism-cyan to-prism-electric hover:opacity-95 flex items-center justify-center text-void-950 shrink-0 transition-all shadow-glow-cyan font-bold"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          {/* Scrub Slider */}
          <div className="flex-1 flex items-center space-x-3">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full"
            />
            <span className="text-xs font-mono text-slate-300 shrink-0 font-medium">
              {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
