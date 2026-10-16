import React from 'react';
import { Loader2, XCircle, Gauge, Clock, HardDrive, Layers } from 'lucide-react';
import { EncodingProgress as ProgressType } from '../../shared/types';

interface EncodingProgressProps {
  progress: ProgressType;
  onCancel: () => void;
  isCancelling: boolean;
}

export const EncodingProgress: React.FC<EncodingProgressProps> = ({
  progress,
  onCancel,
  isCancelling,
}) => {
  const formatTime = (secs: number): string => {
    const s = Math.round(secs);
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const stageLabel =
    progress.stage === 'pass_1'
      ? 'Pass 1 of 2: Analyzing Frame Complexity'
      : progress.stage === 'pass_2'
      ? 'Pass 2 of 2: Precision Bitrate Distribution'
      : 'Active Stream Compression';

  return (
    <div className="w-full studio-card-elevated rounded-2xl p-6 border border-prism-cyan/40 shadow-glow-cyan relative overflow-hidden space-y-6">
      {/* Top glowing ambient beam */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-prism-cyan via-prism-electric to-prism-violet animate-pulse" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-prism-cyan/15 border border-prism-cyan/40 flex items-center justify-center text-prism-cyan animate-spin shadow-glow-cyan">
            <Loader2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-base font-bold text-white tracking-tight">
                Encoding in Progress
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-prism-cyan/20 text-prism-cyan border border-prism-cyan/40 shadow-[0_0_10px_rgba(0,210,255,0.3)]">
                {progress.percent}%
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{stageLabel}</p>
          </div>
        </div>

        <button
          onClick={onCancel}
          disabled={isCancelling}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-prism-rose/15 hover:bg-prism-rose/25 border border-prism-rose/40 text-xs font-bold text-rose-300 hover:text-white transition-all disabled:opacity-40"
        >
          <XCircle className="w-4 h-4 text-prism-rose" />
          <span>{isCancelling ? 'Halting...' : 'Abort Job'}</span>
        </button>
      </div>

      {/* Progress Track */}
      <div>
        <div className="w-full bg-void-950 rounded-full h-3 p-0.5 border border-white/10 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-prism-cyan via-prism-electric to-prism-mint rounded-full transition-all duration-300 relative shadow-glow-cyan"
            style={{ width: `${Math.max(2, Math.min(100, progress.percent))}%` }}
          >
            <div className="absolute inset-0 bg-white/25 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mt-2">
          <span>Frame: {progress.frame} / {progress.totalEstimatedFrames || '—'}</span>
          <span>{progress.currentTimeSeconds}s / {progress.totalDurationSeconds}s</span>
        </div>
      </div>

      {/* Telemetry Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Speed */}
        <div className="bg-void-950/80 rounded-xl p-3.5 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1.5 font-medium">
            <Gauge className="w-3.5 h-3.5 text-prism-cyan" />
            <span>Speed Multiplier</span>
          </span>
          <p className="text-base font-bold text-white font-mono mt-1">
            {progress.speed || '1.0x'}
          </p>
        </div>

        {/* FPS */}
        <div className="bg-void-950/80 rounded-xl p-3.5 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-prism-mint" />
            <span>Encoding FPS</span>
          </span>
          <p className="text-base font-bold text-prism-mint font-mono mt-1">
            {progress.fps} fps
          </p>
        </div>

        {/* ETA */}
        <div className="bg-void-950/80 rounded-xl p-3.5 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-prism-electric" />
            <span>Time Remaining</span>
          </span>
          <p className="text-base font-bold text-cyan-200 font-mono mt-1">
            {formatTime(progress.etaSeconds)}
          </p>
        </div>

        {/* Size */}
        <div className="bg-void-950/80 rounded-xl p-3.5 border border-white/[0.05]">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1.5 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-prism-violet" />
            <span>Current Size</span>
          </span>
          <p className="text-base font-bold text-white font-mono mt-1">
            {progress.currentSizeFormatted || 'Measuring...'}
          </p>
        </div>
      </div>
    </div>
  );
};
