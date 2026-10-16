import React, { useState } from 'react';
import { CheckCircle2, Folder, SplitSquareVertical, RefreshCw, HardDrive, Zap, Play, Pause, FileText, ArrowDownRight } from 'lucide-react';
import { CompressionOutcome } from '../../shared/types';

interface ResultCardProps {
  result: CompressionOutcome;
  onCompare: () => void;
  onReset: () => void;
  onRevealFolder: (path: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onCompare,
  onReset,
  onRevealFolder,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleDownloadReport = async () => {
    try {
      const res = await fetch('/api/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: result, format: 'markdown' }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compression_report_${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Ignore download error
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };

  const streamUrl = `/api/stream?path=${encodeURIComponent(result.outputFilePath)}`;
  const isGif = result.outputFilePath.toLowerCase().endsWith('.gif');

  return (
    <div className="w-full studio-card-elevated rounded-2xl p-5 sm:p-6 border border-prism-mint/40 shadow-glow-mint space-y-5 relative overflow-hidden">
      {/* Top emerald ambient beam */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-prism-mint via-prism-cyan to-prism-electric pointer-events-none" />

      {/* 1. Header Banner */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-prism-mint/15 border border-prism-mint/40 flex items-center justify-center text-prism-mint shrink-0 shadow-glow-mint">
            <CheckCircle2 className="w-6 h-6 text-prism-mint" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Compression Complete
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-prism-mint/20 text-prism-mint border border-prism-mint/40 shadow-[0_0_10px_rgba(0,245,160,0.3)]">
                -{result.savedPercent}%
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 truncate">
              Saved <span className="font-bold text-prism-mint font-mono">{formatBytes(result.savedBytes)}</span> of drive space
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="shrink-0 p-2 rounded-xl bg-void-950 hover:bg-void-900 border border-white/10 text-slate-400 hover:text-white transition-colors"
          title="Compress another file"
        >
          <RefreshCw className="w-4 h-4 text-prism-cyan" />
        </button>
      </div>

      {/* 2. Responsive 2x2 Metric Grid (clean in narrow 5-col sidebar) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Original */}
        <div className="bg-void-950/80 rounded-xl p-3 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 font-medium block">Original Size</span>
          <p className="text-sm sm:text-base font-bold text-slate-400 font-mono mt-0.5 line-through decoration-rose-500/70 truncate">
            {formatBytes(result.originalSizeBytes)}
          </p>
        </div>

        {/* Compressed Size */}
        <div className="bg-void-950/80 rounded-xl p-3 border border-prism-mint/30 bg-prism-mint/[0.03]">
          <span className="text-[11px] text-prism-mint font-semibold flex items-center space-x-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>New Size</span>
          </span>
          <p className="text-sm sm:text-base font-bold text-prism-mint font-mono mt-0.5 truncate">
            {formatBytes(result.compressedSizeBytes)}
          </p>
        </div>

        {/* Time & Speed */}
        <div className="bg-void-950/80 rounded-xl p-3 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 font-medium block">Duration / Speed</span>
          <p className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5 truncate">
            {result.processingTimeSeconds}s ({result.averageSpeed})
          </p>
        </div>

        {/* Codec */}
        <div className="bg-void-950/80 rounded-xl p-3 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 font-medium block">Format / Codec</span>
          <p className="text-xs sm:text-sm font-bold text-prism-cyan font-mono mt-0.5 uppercase truncate">
            {result.actualVideoCodec}
          </p>
        </div>
      </div>

      {/* 3. Action Buttons - Organized & Fully Responsive */}
      <div className="space-y-2">
        <button
          onClick={onCompare}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-prism-cyan to-prism-electric text-void-950 font-bold text-xs shadow-glow-cyan hover:opacity-95 transition-all flex items-center justify-center space-x-2"
        >
          <SplitSquareVertical className="w-4 h-4 text-void-950" />
          <span>Interactive Split Video Comparison</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onRevealFolder(result.outputFilePath)}
            className="w-full py-2.5 px-3 rounded-xl bg-void-950 hover:bg-void-900 border border-white/10 hover:border-prism-cyan/40 text-xs font-semibold text-slate-200 transition-all shadow-glass-rim flex items-center justify-center space-x-1.5"
          >
            <Folder className="w-3.5 h-3.5 text-prism-cyan" />
            <span>Open Folder</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="w-full py-2.5 px-3 rounded-xl bg-void-950 hover:bg-void-900 border border-white/10 hover:border-prism-mint/40 text-xs font-semibold text-slate-200 transition-all shadow-glass-rim flex items-center justify-center space-x-1.5"
            title="Download audit report"
          >
            <FileText className="w-3.5 h-3.5 text-prism-mint" />
            <span>Audit Report</span>
          </button>
        </div>
      </div>

      {/* 4. Embedded Video / Animated GIF Player */}
      <div className="rounded-xl overflow-hidden bg-void-950 border border-white/10 shadow-2xl relative">
        {isGif ? (
          <div className="flex justify-center p-3 bg-void-950">
            <img
              src={streamUrl}
              alt="Compressed Animated GIF"
              className="max-h-60 w-auto object-contain rounded-lg"
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={streamUrl}
            className="w-full max-h-60 object-contain bg-black"
            controls
            playsInline
          />
        )}
        <div className="px-3 py-2 bg-void-900/95 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="truncate max-w-[200px] sm:max-w-[280px]">
            {result.outputFilePath.split(/[/\\]/).pop()}
          </span>
          <span className="text-prism-mint font-semibold shrink-0">
            Ready to Share
          </span>
        </div>
      </div>
    </div>
  );
};
