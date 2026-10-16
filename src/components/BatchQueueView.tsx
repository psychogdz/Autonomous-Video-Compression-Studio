import React from 'react';
import { X, Play, Pause, Trash2, CheckCircle2, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { QueueJob } from '../../shared/types';

interface BatchQueueViewProps {
  queue: QueueJob[];
  isOpen: boolean;
  onClose: () => void;
  onStartQueue: () => void;
  onPauseQueue: () => void;
  onCancelJob: (id: string) => void;
  onRemoveJob: (id: string) => void;
  onClearCompleted: () => void;
}

export const BatchQueueView: React.FC<BatchQueueViewProps> = ({
  queue,
  isOpen,
  onClose,
  onStartQueue,
  onPauseQueue,
  onCancelJob,
  onRemoveJob,
  onClearCompleted,
}) => {
  if (!isOpen) return null;

  const hasRunning = queue.some((j) => j.status === 'encoding');

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void-950/85 backdrop-blur-xl">
      <div className="w-full max-w-3xl bg-void-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Batch Processing Queue
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {queue.length} items registered in queue
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {hasRunning ? (
              <button
                onClick={onPauseQueue}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-prism-amber/15 text-prism-amber border border-prism-amber/30 text-xs font-semibold hover:bg-prism-amber/25 transition-all"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={onStartQueue}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-prism-cyan to-prism-electric text-void-950 text-xs font-bold hover:opacity-95 shadow-glow-cyan transition-all"
              >
                <Play className="w-3.5 h-3.5 ml-0.5" />
                <span>Start Queue</span>
              </button>
            )}

            <button
              onClick={onClearCompleted}
              className="p-2 rounded-xl bg-void-850 hover:bg-void-800 text-slate-400 hover:text-white transition-colors border border-white/10"
              title="Clear finished jobs"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-void-850 hover:bg-void-800 text-slate-400 hover:text-white transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {queue.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              The batch queue is currently empty. Add files from the main studio workspace.
            </div>
          ) : (
            queue.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-xl bg-void-950/80 border border-white/[0.06] flex flex-col space-y-2.5 shadow-glass-rim-subtle"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-3">
                    <p className="text-xs sm:text-sm font-bold text-white truncate font-sans">
                      {job.fileName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {formatBytes(job.fileSizeBytes)} • Mode: {job.config.mode.replace('_', ' ')}
                    </p>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {job.status === 'encoding' && (
                      <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded font-mono font-bold text-[11px] bg-prism-cyan/20 text-prism-cyan border border-prism-cyan/40">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>{job.progress?.percent || 0}%</span>
                      </span>
                    )}
                    {job.status === 'completed' && (
                      <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded font-mono font-bold text-[11px] bg-prism-mint/20 text-prism-mint border border-prism-mint/40">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>-{job.result?.savedPercent}%</span>
                      </span>
                    )}
                    {job.status === 'ready' && (
                      <span className="px-2.5 py-0.5 rounded font-mono font-semibold text-[11px] bg-white/[0.05] text-slate-300 border border-white/10">
                        Ready
                      </span>
                    )}
                    {job.status === 'failed' && (
                      <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded font-mono font-semibold text-[11px] bg-prism-rose/20 text-rose-300 border border-prism-rose/40">
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed</span>
                      </span>
                    )}

                    {job.status === 'encoding' ? (
                      <button
                        onClick={() => onCancelJob(job.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Cancel job"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onRemoveJob(job.id)}
                        className="p-1.5 rounded-lg hover:bg-void-800 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar if encoding */}
                {job.status === 'encoding' && job.progress && (
                  <div className="w-full bg-void-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-prism-cyan to-prism-mint rounded-full transition-all duration-300"
                      style={{ width: `${job.progress.percent}%` }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
