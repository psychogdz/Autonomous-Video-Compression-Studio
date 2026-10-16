import React, { useState } from 'react';
import { CheckCircle2, Folder, SplitSquareVertical, RefreshCw, HardDrive, Zap, Play, Pause, FileText } from 'lucide-react';
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

  return (
    <div className="w-full studio-card-elevated rounded-2xl p-6 border border-prism-mint/40 shadow-glow-mint space-y-6 relative overflow-hidden">
      {/* Top emerald shimmer */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-prism-mint via-prism-cyan to-transparent pointer-events-none" />

      {/* Top Banner: Space Saved */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-prism-mint/15 border border-prism-mint/40 flex items-center justify-center text-prism-mint shrink-0 shadow-glow-mint">
            <CheckCircle2 className="w-6 h-6 text-prism-mint" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Compression Completed!
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-prism-mint/20 text-prism-mint border border-prism-mint/40 shadow-[0_0_10px_rgba(0,245,160,0.3)]">
                -{result.savedPercent}% Smaller
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Successfully saved <span className="font-bold text-prism-mint font-mono">{formatBytes(result.savedBytes)}</span> of drive space.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadReport}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 hover:border-prism-mint/40 text-xs font-semibold text-slate-200 transition-all shadow-glass-rim-subtle"
            title="Download audit report"
          >
            <FileText className="w-3.5 h-3.5 text-prism-mint" />
            <span>Audit Report</span>
          </button>
          <button
            onClick={() => onRevealFolder(result.outputFilePath)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-void-900 hover:bg-void-850 border border-white/10 hover:border-prism-cyan/40 text-xs font-semibold text-slate-200 transition-all shadow-glass-rim-subtle"
          >
            <Folder className="w-3.5 h-3.5 text-prism-cyan" />
            <span>Open Folder</span>
          </button>
          <button
            onClick={onCompare}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-prism-cyan to-prism-electric text-void-950 font-bold text-xs shadow-glow-cyan hover:opacity-95 transition-all"
          >
            <SplitSquareVertical className="w-4 h-4 text-void-950" />
            <span>Compare Video</span>
          </button>
        </div>
      </div>

      {/* Before vs After Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-void-950/80 rounded-xl p-3.5 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 block font-medium">Original Size</span>
          <p className="text-base font-bold text-slate-400 font-mono mt-1 line-through decoration-rose-500/70">
            {formatBytes(result.originalSizeBytes)}
          </p>
        </div>

        <div className="bg-void-950/80 rounded-xl p-3.5 border border-prism-mint/30 bg-prism-mint/[0.03]">
          <span className="text-[11px] text-prism-mint block font-semibold">New Size</span>
          <p className="text-base font-bold text-prism-mint font-mono mt-1">
            {formatBytes(result.compressedSizeBytes)}
          </p>
        </div>

        <div className="bg-void-950/80 rounded-xl p-3.5 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 block font-medium">Processing Time</span>
          <p className="text-base font-bold text-white font-mono mt-1">
            {result.processingTimeSeconds}s
          </p>
        </div>

        <div className="bg-void-950/80 rounded-xl p-3.5 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 block font-medium">Output Codec</span>
          <p className="text-base font-bold text-prism-cyan font-mono mt-1 uppercase">
            {result.actualVideoCodec}
          </p>
        </div>
      </div>

      {/* Embedded Video or Animated GIF Preview */}
      <div className="rounded-2xl overflow-hidden bg-void-950 border border-white/10 relative group shadow-2xl">
        {result.outputFilePath.toLowerCase().endsWith('.gif') ? (
          <div className="flex justify-center p-3 bg-void-950">
            <img
              src={streamUrl}
              alt="Compressed Animated GIF"
              className="max-h-72 object-contain rounded-xl"
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={streamUrl}
            className="w-full max-h-72 object-contain bg-black"
            onEnded={() => setIsPlaying(false)}
            controls
          />
        )}
        <div className="p-3 bg-void-900/90 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-300">
          <span className="font-mono truncate max-w-xs sm:max-w-md text-slate-400">
            {result.outputFilePath.split(/[/\\]/).pop()}
          </span>
          <button
            onClick={onReset}
            className="flex items-center space-x-1 text-slate-400 hover:text-prism-cyan transition-colors text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 text-prism-cyan" />
            <span>Compress Another File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
