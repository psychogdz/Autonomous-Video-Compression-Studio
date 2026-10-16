import React from 'react';
import { Cpu, Zap, Layers, Video, ShieldCheck } from 'lucide-react';
import { HardwareStatus } from '../../shared/types';

interface HeaderProps {
  hardware: HardwareStatus | null;
  queueCount: number;
  onOpenQueue: () => void;
  ffmpegVersion?: string;
}

export const Header: React.FC<HeaderProps> = ({
  hardware,
  queueCount,
  onOpenQueue,
  ffmpegVersion,
}) => {
  const hasGpu = hardware?.hasNvidia || hardware?.hasIntel || hardware?.hasAmd;
  const gpuName = hardware?.hasNvidia
    ? 'NVIDIA NVENC'
    : hardware?.hasIntel
    ? 'Intel QuickSync'
    : hardware?.hasAmd
    ? 'AMD AMF'
    : 'CPU Software';

  return (
    <header className="border-b border-obsidian-700/60 bg-obsidian-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue via-brand-indigo to-brand-violet shadow-glow-blue">
            <Video className="w-5 h-5 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-obsidian-900" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                Lumina<span className="text-brand-blue">Press</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-brand-blue/15 text-brand-blue border border-brand-blue/30">
                Studio v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal">
              Maximum Compression, Uncompromised Clarity
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center space-x-3">
          {/* Hardware acceleration pill */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-obsidian-800/80 border border-obsidian-700/70 text-xs">
            {hasGpu ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-slate-300 font-medium">GPU Accel:</span>
                <span className="text-emerald-400 font-mono font-semibold">{gpuName}</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 font-medium">Engine:</span>
                <span className="text-slate-200 font-mono">CPU (Multi-thread)</span>
              </>
            )}
          </div>

          {/* Engine version pill */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-obsidian-800/50 border border-obsidian-700/50 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>FFmpeg:</span>
            <span className="font-mono text-slate-300">{ffmpegVersion ? `v${ffmpegVersion}` : '9.0.2 Full'}</span>
          </div>

          {/* Batch Queue Button */}
          <button
            onClick={onOpenQueue}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-600/70 text-xs text-slate-200 transition-colors font-medium relative"
          >
            <Layers className="w-4 h-4 text-brand-blue" />
            <span>Batch Queue</span>
            {queueCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-brand-blue text-white">
                {queueCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
