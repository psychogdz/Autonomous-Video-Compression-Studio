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
      ? 'Pass 1 of 2: Analyzing Motion & Complexity'
      : progress.stage === 'pass_2'
      ? 'Pass 2 of 2: Precision Bitrate Encoding'
      : 'Encoding Video Stream';

  return (
    <div className="w-full glass-panel-elevated rounded-2xl p-6 border border-brand-blue/40 shadow-glow-blue relative overflow-hidden space-y-6">
      {/* Background glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue via-brand-indigo to-brand-cyan" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-blue animate-spin">
            <Loader2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-sans flex items-center space-x-2">
              <span>Compressing Video</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-brand-blue/20 text-brand-blue border border-brand-blue/40 font-semibold">
                {progress.percent}%
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{stageLabel}</p>
          </div>
        </div>

        <button
          onClick={onCancel}
          disabled={isCancelling}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>{isCancelling ? 'Cancelling...' : 'Abort Job'}</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="w-full bg-obsidian-900 rounded-full h-3.5 overflow-hidden p-0.5 border border-obsidian-700/80">
          <div
            className="h-full bg-gradient-to-r from-brand-blue via-brand-indigo to-brand-cyan rounded-full transition-all duration-300 relative shadow-glow-blue"
            style={{ width: `${Math.max(2, Math.min(100, progress.percent))}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </div>
        </div>
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mt-2">
          <span>Frame: {progress.frame} / {progress.totalEstimatedFrames || '—'}</span>
          <span>{progress.currentTimeSeconds}s / {progress.totalDurationSeconds}s</span>
        </div>
      </div>

      {/* Live Telemetry Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Speed Multiplier */}
        <div className="bg-obsidian-900/80 rounded-xl p-3 border border-obsidian-700/50">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Gauge className="w-3.5 h-3.5 text-brand-blue" />
            <span>Speed Multiplier</span>
          </span>
          <p className="text-base font-bold text-white font-mono mt-1">
            {progress.speed || '1.0x'}
          </p>
        </div>

        {/* Encoding FPS */}
        <div className="bg-obsidian-900/80 rounded-xl p-3 border border-obsidian-700/50">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Processing FPS</span>
          </span>
          <p className="text-base font-bold text-emerald-400 font-mono mt-1">
            {progress.fps} fps
          </p>
        </div>

        {/* Time Remaining (ETA) */}
        <div className="bg-obsidian-900/80 rounded-xl p-3 border border-obsidian-700/50">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Est. Remaining (ETA)</span>
          </span>
          <p className="text-base font-bold text-cyan-300 font-mono mt-1">
            {formatTime(progress.etaSeconds)}
          </p>
        </div>

        {/* Current Size */}
        <div className="bg-obsidian-900/80 rounded-xl p-3 border border-obsidian-700/50">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <HardDrive className="w-3.5 h-3.5 text-brand-violet" />
            <span>Current Size</span>
          </span>
          <p className="text-base font-bold text-white font-mono mt-1">
            {progress.currentSizeFormatted || 'Calculating...'}
          </p>
        </div>
      </div>
    </div>
  );
};
