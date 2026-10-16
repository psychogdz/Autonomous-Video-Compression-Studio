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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-obsidian-900 border border-obsidian-700/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-obsidian-700/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-base font-bold text-white font-sans">
              Interactive Before / After Visual Comparison
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-brand-blue/15 text-brand-blue border border-brand-blue/30 font-semibold">
              Split Slider
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quality Score Trigger */}
            {!qualityScore ? (
              <button
                onClick={handleCalculateQuality}
                disabled={isCalculatingQuality}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-600/70 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
              >
                {isCalculatingQuality ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" />
                    <span>Measuring SSIM...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Measure SSIM / PSNR</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center space-x-2 text-xs font-mono">
                {qualityScore.ssim && (
                  <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    SSIM: {qualityScore.ssim}
                  </span>
                )}
                {qualityScore.psnr && (
                  <span className="px-2 py-1 rounded bg-brand-blue/15 text-brand-blue border border-brand-blue/30">
                    PSNR: {qualityScore.psnr} dB
                  </span>
                )}
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-400 hover:text-white transition-colors"
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
          {/* Compressed Video (Full Canvas Background) */}
          <video
            ref={compressedVideoRef}
            src={compressedUrl}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            muted
            playsInline
          />

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
            <div className="w-7 h-7 rounded-full bg-brand-blue border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
              ⬌
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-white">
            ORIGINAL (SOURCE)
          </div>
          <div className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded bg-brand-blue/80 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-white">
            COMPRESSED
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="p-4 bg-obsidian-950 border-t border-obsidian-700/70 flex items-center space-x-4">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-brand-blue hover:bg-blue-600 flex items-center justify-center text-white shrink-0 transition-colors shadow-glow-blue"
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
              className="w-full h-2 rounded-lg cursor-pointer accent-brand-blue"
            />
            <span className="text-xs font-mono text-slate-300 shrink-0">
              {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
