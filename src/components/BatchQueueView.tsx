import React, { useState, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Folder,
  RotateCcw,
  Plus,
  ArrowUp,
  ArrowDown,
  Film,
  FileText,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { QueueJob, SimpleGoal, CompressionJobConfig } from '../../shared/types';

interface BatchQueueViewProps {
  queue: QueueJob[];
  isOpen: boolean;
  onClose: () => void;
  onStartQueue: () => void;
  onPauseQueue: () => void;
  onCancelJob: (id: string) => void;
  onRemoveJob: (id: string) => void;
  onClearCompleted: () => void;
  onRetryJob?: (id: string) => void;
  onMoveJob?: (id: string, direction: 'up' | 'down') => void;
  onUpdateJobConfig?: (id: string, config: CompressionJobConfig) => void;
  onAddFiles?: (filePaths: string[]) => void;
  onRevealFolder: (path: string) => void;
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
  onRetryJob,
  onMoveJob,
  onUpdateJobConfig,
  onAddFiles,
  onRevealFolder,
}) => {
  const [showAddPath, setShowAddPath] = useState(false);
  const [newPathInput, setNewPathInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const hasRunning = queue.some((j) => j.status === 'encoding');
  const completedCount = queue.filter((j) => j.status === 'completed').length;
  const pendingCount = queue.filter((j) => j.status === 'ready' || j.status === 'pending').length;

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };

  const handleAddPathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPathInput.trim() && onAddFiles) {
      onAddFiles([newPathInput.trim()]);
      setNewPathInput('');
      setShowAddPath(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onAddFiles) {
      // In web context, multiple files can be uploaded
      const files = Array.from(e.target.files);
      // For each file, upload via formData
      files.forEach(async (file) => {
        const formData = new FormData();
        formData.append('video', file);
        try {
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.filePath) {
            onAddFiles([data.filePath]);
          }
        } catch {
          // Ignore
        }
      });
    }
  };

  const goalOptions: Array<{ id: SimpleGoal; label: string }> = [
    { id: 'max_compression', label: 'Maximum Compression (~75% smaller)' },
    { id: 'balanced', label: 'Balanced Quality (50% smaller)' },
    { id: 'archive', label: 'Archival Quality (High fidelity)' },
    { id: 'discord_25', label: 'Discord & Email (Target 25 MB)' },
    { id: 'whatsapp_hd', label: 'WhatsApp Mobile HD (720p)' },
    { id: 'telegram_fast', label: 'Fast Telegram (Rapid encode)' },
    { id: 'gif_export', label: 'Animated GIF Export' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-void-950/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-4xl bg-void-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* 1. Header Bar */}
        <div className="p-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-void-950/80">
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-base font-bold text-white tracking-tight">
                Batch Processing Queue
              </h3>
              <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-prism-cyan/15 text-prism-cyan border border-prism-cyan/30">
                <span className="w-1.5 h-1.5 rounded-full bg-prism-cyan animate-pulse" />
                <span>REAL-TIME LIVE STREAM</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {queue.length} total • {pendingCount} queued • {completedCount} completed
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Add File Trigger */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,image/gif,.mp4,.mov,.mkv,.webm,.avi,.flv,.ts,.gif"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <button
              onClick={() => setShowAddPath(!showAddPath)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-void-850 hover:bg-void-800 border border-white/10 text-xs font-semibold text-slate-200 transition-all shadow-glass-rim-subtle"
              title="Add more videos to queue"
            >
              <Plus className="w-3.5 h-3.5 text-prism-cyan" />
              <span>Add Item</span>
            </button>

            {/* Start / Pause Queue */}
            {hasRunning ? (
              <button
                onClick={onPauseQueue}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-prism-amber/15 text-prism-amber border border-prism-amber/30 text-xs font-bold hover:bg-prism-amber/25 transition-all shadow-[0_0_15px_rgba(255,184,0,0.2)]"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Queue</span>
              </button>
            ) : (
              <button
                onClick={onStartQueue}
                disabled={pendingCount === 0}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-prism-cyan to-prism-electric text-void-950 text-xs font-bold hover:opacity-95 shadow-glow-cyan transition-all disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-void-950" />
                <span>Start Batch Processing</span>
              </button>
            )}

            {/* Clear Completed */}
            {completedCount > 0 && (
              <button
                onClick={onClearCompleted}
                className="p-2 rounded-xl bg-void-850 hover:bg-void-800 text-slate-400 hover:text-white transition-colors border border-white/10"
                title="Clear finished jobs from list"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-void-850 hover:bg-void-800 text-slate-400 hover:text-white transition-colors border border-white/10"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Direct Add Path Drawer */}
        {showAddPath && (
          <div className="p-3.5 bg-void-950/90 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <form onSubmit={handleAddPathSubmit} className="flex-1 flex items-center space-x-2 min-w-[280px]">
              <input
                type="text"
                value={newPathInput}
                onChange={(e) => setNewPathInput(e.target.value)}
                placeholder="Enter host video path, e.g. C:\Videos\clip.mp4"
                className="flex-1 bg-void-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-prism-cyan font-mono"
              />
              <button
                type="submit"
                disabled={!newPathInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-prism-cyan text-void-950 text-xs font-bold hover:opacity-95 disabled:opacity-40"
              >
                Add Path
              </button>
            </form>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-void-850 hover:bg-void-800 border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
            >
              Browse Files
            </button>
          </div>
        )}

        {/* 3. Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {queue.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-void-850 border border-white/10 flex items-center justify-center text-slate-400">
                <Film className="w-6 h-6 text-prism-cyan" />
              </div>
              <p className="font-semibold text-white">The batch queue is currently empty.</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Add video files or GIFs to queue up automatic conversions with continuous live progress tracking.
              </p>
            </div>
          ) : (
            queue.map((job, index) => {
              const isEncoding = job.status === 'encoding';
              const isCompleted = job.status === 'completed';
              const isFailed = job.status === 'failed';
              const isCancelled = job.status === 'cancelled';
              const isReady = job.status === 'ready' || job.status === 'pending';

              return (
                <div
                  key={job.id}
                  className={`p-4 rounded-xl border transition-all duration-200 flex flex-col space-y-3 shadow-glass-rim-subtle ${
                    isEncoding
                      ? 'bg-void-950 border-prism-cyan/50 shadow-glow-cyan'
                      : isCompleted
                      ? 'bg-void-950/80 border-prism-mint/30'
                      : isFailed
                      ? 'bg-void-950/80 border-prism-rose/40'
                      : 'bg-void-950/70 border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  {/* Top Item Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">#{index + 1}</span>
                        <p className="text-xs sm:text-sm font-bold text-white truncate font-sans">
                          {job.fileName}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-mono mt-1">
                        <span>Original: {formatBytes(job.fileSizeBytes)}</span>
                        {job.probeData && (
                          <span>
                            • {job.probeData.primaryVideo?.width}x{job.probeData.primaryVideo?.height} @ {job.probeData.primaryVideo?.fps}fps
                          </span>
                        )}
                        <span>• Mode: {job.config.mode.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {/* Status & Quick Action Badges */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Priority Move Up/Down (only when ready/pending) */}
                      {isReady && onMoveJob && (
                        <div className="flex items-center space-x-1 mr-1">
                          <button
                            onClick={() => onMoveJob(job.id, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-void-800 text-slate-400 hover:text-white disabled:opacity-20"
                            title="Move up in queue"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onMoveJob(job.id, 'down')}
                            disabled={index === queue.length - 1}
                            className="p-1 rounded hover:bg-void-800 text-slate-400 hover:text-white disabled:opacity-20"
                            title="Move down in queue"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Encoding Status */}
                      {isEncoding && (
                        <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] bg-prism-cyan/20 text-prism-cyan border border-prism-cyan/40">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{job.progress?.percent || 0}%</span>
                          {job.progress?.speed && (
                            <span className="text-slate-300 font-normal">({job.progress.speed})</span>
                          )}
                        </span>
                      )}

                      {/* Completed Badge */}
                      {isCompleted && (
                        <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] bg-prism-mint/20 text-prism-mint border border-prism-mint/40 shadow-[0_0_10px_rgba(0,245,160,0.2)]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>-{job.result?.savedPercent}% Smaller</span>
                        </span>
                      )}

                      {/* Ready Badge */}
                      {isReady && (
                        <span className="px-2.5 py-1 rounded-lg font-mono font-semibold text-[11px] bg-white/[0.05] text-slate-300 border border-white/10">
                          Ready
                        </span>
                      )}

                      {/* Failed Badge */}
                      {isFailed && (
                        <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg font-mono font-semibold text-[11px] bg-prism-rose/20 text-rose-300 border border-prism-rose/40">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Failed</span>
                        </span>
                      )}

                      {/* Retry Button */}
                      {(isFailed || isCancelled) && onRetryJob && (
                        <button
                          onClick={() => onRetryJob(job.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-void-850 hover:bg-void-800 border border-white/10 text-[11px] font-semibold text-slate-200 transition-colors"
                          title="Retry failed compression"
                        >
                          <RotateCcw className="w-3 h-3 text-prism-cyan" />
                          <span>Retry</span>
                        </button>
                      )}

                      {/* Cancel or Remove */}
                      {isEncoding ? (
                        <button
                          onClick={() => onCancelJob(job.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Cancel encoding"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onRemoveJob(job.id)}
                          className="p-1.5 rounded-lg hover:bg-void-800 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Remove item from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mode & Preset Selector for Queued Items */}
                  {isReady && onUpdateJobConfig && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.04]">
                      <span className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                        <SlidersHorizontal className="w-3 h-3 text-prism-cyan" />
                        <span>Profile:</span>
                      </span>
                      <select
                        value={job.config.simpleConfig?.goal || 'balanced'}
                        onChange={(e) => {
                          onUpdateJobConfig(job.id, {
                            ...job.config,
                            mode: 'simple',
                            simpleConfig: {
                              goal: e.target.value as SimpleGoal,
                              speedPriority: 'fast',
                            },
                          });
                        }}
                        className="bg-void-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-prism-cyan"
                      >
                        {goalOptions.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Active Live Progress Bar */}
                  {isEncoding && job.progress && (
                    <div className="space-y-1.5 pt-1">
                      <div className="w-full bg-void-900 rounded-full h-2 p-0.5 border border-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-prism-cyan to-prism-mint rounded-full transition-all duration-300"
                          style={{ width: `${job.progress.percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>Frame {job.progress.frame} • {job.progress.fps} FPS</span>
                        <span>ETA: {job.progress.etaSeconds}s</span>
                      </div>
                    </div>
                  )}

                  {/* Completed Output Path & Reveal Actions */}
                  {isCompleted && job.result && (
                    <div className="p-3 rounded-xl bg-void-900/90 border border-prism-mint/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 text-prism-mint font-semibold text-[11px]">
                          <Folder className="w-3.5 h-3.5 text-prism-mint" />
                          <span>Compressed Output Ready:</span>
                        </div>
                        <p className="text-[11px] text-white font-mono mt-0.5 truncate select-all">
                          {job.result.outputFilePath}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {formatBytes(job.result.originalSizeBytes)} ➔ <span className="text-prism-mint font-bold">{formatBytes(job.result.compressedSizeBytes)}</span> ({job.result.processingTimeSeconds}s @ {job.result.averageSpeed})
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => onRevealFolder(job.result!.outputFilePath)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-void-850 hover:bg-void-800 border border-white/10 hover:border-prism-mint/50 text-xs font-semibold text-slate-200 transition-all shadow-glass-rim-subtle"
                        >
                          <Folder className="w-3.5 h-3.5 text-prism-mint" />
                          <span>Open Folder</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Failed Notice */}
                  {isFailed && job.error && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-mono">
                      Error: {job.error}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
