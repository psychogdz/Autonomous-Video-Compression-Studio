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

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const streamUrl = `/api/stream?path=${encodeURIComponent(result.outputFilePath)}`;

  return (
    <div className="w-full glass-panel-elevated rounded-2xl p-6 border border-emerald-500/40 shadow-glow-emerald space-y-6">
      {/* Top Banner: Space Saved */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-obsidian-700/60">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white font-sans">
                Compression Completed!
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                -{result.savedPercent}% Smaller
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Successfully saved <span className="font-bold text-emerald-400 font-mono">{formatBytes(result.savedBytes)}</span> of disk space.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleDownloadReport}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-600/70 text-xs font-semibold text-slate-200 transition-colors"
            title="Download compression audit report"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Audit Report</span>
          </button>
          <button
            onClick={() => onRevealFolder(result.outputFilePath)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-600/70 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Folder className="w-4 h-4 text-brand-blue" />
            <span>Open Folder</span>
          </button>
          <button
            onClick={onCompare}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-indigo hover:opacity-95 text-xs font-semibold text-white shadow-glow-blue transition-all"
          >
            <SplitSquareVertical className="w-4 h-4" />
            <span>Compare Video</span>
          </button>
        </div>
      </div>

      {/* Before vs After Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-obsidian-900/80 rounded-xl p-3.5 border border-obsidian-700/50">
          <span className="text-[11px] text-slate-400 block">Original Size</span>
          <p className="text-base font-bold text-slate-300 font-mono mt-1 line-through decoration-rose-500/70">
            {formatBytes(result.originalSizeBytes)}
          </p>
        </div>

        <div className="bg-obsidian-900/80 rounded-xl p-3.5 border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[11px] text-emerald-400 block font-semibold">New Size</span>
          <p className="text-base font-bold text-emerald-400 font-mono mt-1">
            {formatBytes(result.compressedSizeBytes)}
          </p>
        </div>

        <div className="bg-obsidian-900/80 rounded-xl p-3.5 border border-obsidian-700/50">
          <span className="text-[11px] text-slate-400 block">Processing Time</span>
          <p className="text-base font-bold text-white font-mono mt-1">
            {result.processingTimeSeconds}s
          </p>
        </div>

        <div className="bg-obsidian-900/80 rounded-xl p-3.5 border border-obsidian-700/50">
          <span className="text-[11px] text-slate-400 block">Output Codec</span>
          <p className="text-base font-bold text-brand-blue font-mono mt-1 uppercase">
            {result.actualVideoCodec}
          </p>
        </div>
      </div>

      {/* Embedded Video or GIF Preview */}
      <div className="rounded-xl overflow-hidden bg-obsidian-950 border border-obsidian-700/70 relative group">
        {result.outputFilePath.toLowerCase().endsWith('.gif') ? (
          <div className="flex justify-center p-3 bg-black">
            <img
              src={streamUrl}
              alt="Compressed Animated GIF"
              className="max-h-72 object-contain rounded"
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
        <div className="p-3 bg-obsidian-900/90 border-t border-obsidian-700/60 flex items-center justify-between text-xs text-slate-300">
          <span className="font-mono truncate max-w-xs sm:max-w-md">
            {result.outputFilePath.split(/[/\\]/).pop()}
          </span>
          <button
            onClick={onReset}
            className="flex items-center space-x-1 text-slate-400 hover:text-brand-blue transition-colors text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Compress Another File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
