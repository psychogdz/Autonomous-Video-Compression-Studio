import React from 'react';
import { Film, Volume2, Clock, HardDrive, Maximize, RefreshCw, Layers } from 'lucide-react';
import { MediaProbeResult } from '../../shared/types';

interface MediaInspectorProps {
  metadata: MediaProbeResult;
  onClear: () => void;
}

export const MediaInspector: React.FC<MediaInspectorProps> = ({ metadata, onClear }) => {
  const video = metadata.primaryVideo;
  const audio = metadata.primaryAudio;

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };

  const formatDuration = (seconds: number): string => {
    const s = Math.round(seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getResolutionTag = (height: number): string => {
    if (height >= 2160) return '4K UHD';
    if (height >= 1440) return '1440p QHD';
    if (height >= 1080) return '1080p FHD';
    if (height >= 720) return '720p HD';
    return `${height}p SD`;
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 border border-obsidian-700/80 shadow-lg relative overflow-hidden">
      {/* Header bar */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-obsidian-700/60">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center text-brand-blue shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate max-w-sm sm:max-w-md font-sans">
              {metadata.fileName}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
              {metadata.filePath}
            </p>
          </div>
        </div>

        <button
          onClick={onClear}
          className="shrink-0 flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-600/60 text-xs text-slate-300 hover:text-white transition-colors"
          title="Change source file"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Change File</span>
        </button>
      </div>

      {/* Grid of technical metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        {/* File Size */}
        <div className="bg-obsidian-850/80 rounded-xl p-3 border border-obsidian-700/50">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-brand-blue" />
            <span>Original Size</span>
          </div>
          <p className="text-base font-bold text-white font-mono mt-1">
            {formatBytes(metadata.fileSizeBytes)}
          </p>
        </div>

        {/* Duration */}
        <div className="bg-obsidian-850/80 rounded-xl p-3 border border-obsidian-700/50">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-brand-indigo" />
            <span>Duration</span>
          </div>
          <p className="text-base font-bold text-white font-mono mt-1">
            {formatDuration(metadata.durationSeconds)}
          </p>
        </div>

        {/* Resolution & FPS */}
        <div className="bg-obsidian-850/80 rounded-xl p-3 border border-obsidian-700/50">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Maximize className="w-3.5 h-3.5 text-brand-violet" />
            <span>Resolution</span>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <p className="text-base font-bold text-white font-mono">
              {video ? `${video.width}x${video.height}` : 'N/A'}
            </p>
            {video && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-brand-violet/20 text-brand-violet border border-brand-violet/30">
                {getResolutionTag(video.height)}
              </span>
            )}
          </div>
        </div>

        {/* Video Codec */}
        <div className="bg-obsidian-850/80 rounded-xl p-3 border border-obsidian-700/50">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Codec & FPS</span>
          </div>
          <p className="text-base font-bold text-white font-mono mt-1 uppercase">
            {video ? `${video.codecName} @ ${video.fps}fps` : 'Unknown'}
          </p>
        </div>
      </div>

      {/* Audio strip */}
      {audio && (
        <div className="mt-3 bg-obsidian-850/50 rounded-xl px-3.5 py-2 border border-obsidian-700/30 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Audio Stream:</span>
            <span className="text-slate-200 font-mono font-medium uppercase">
              {audio.codecName} ({audio.channelLayout || `${audio.channels} ch`})
            </span>
          </div>
          <span className="font-mono text-slate-400">{audio.sampleRate} Hz</span>
        </div>
      )}
    </div>
  );
};
