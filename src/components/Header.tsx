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
    : 'Multi-Core CPU';

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-void-950/80 backdrop-blur-xl">
      {/* Top subtle anamorphic glow beam */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-prism-cyan/50 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3.5">
          <div className="relative group flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-prism-cyan/20 via-prism-electric/30 to-prism-violet/30 border border-prism-cyan/40 shadow-glow-cyan">
            <Video className="w-5 h-5 text-prism-cyan transition-transform group-hover:scale-110" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-prism-mint rounded-full border-2 border-void-950 shadow-[0_0_8px_#00F5A0]" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white font-sans">
                Lumina<span className="bg-gradient-to-r from-prism-cyan to-prism-electric bg-clip-text text-transparent">Press</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 rounded font-mono font-semibold bg-white/[0.06] text-slate-300 border border-white/10">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Intelligent Autonomous Video Compression Engine
            </p>
          </div>
        </div>

        {/* Console Controls & Indicators */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Hardware acceleration indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-void-900/90 border border-white/[0.08] text-xs shadow-glass-rim-subtle">
            {hasGpu ? (
              <>
                <Zap className="w-3.5 h-3.5 text-prism-amber animate-pulse" />
                <span className="text-slate-400 hidden md:inline">Hardware:</span>
                <span className="text-prism-mint font-mono font-semibold text-[11px]">{gpuName}</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-prism-cyan" />
                <span className="text-slate-400 hidden md:inline">Hardware:</span>
                <span className="text-slate-200 font-mono text-[11px]">CPU Engine</span>
              </>
            )}
          </div>

          {/* Version pill */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-void-900/50 border border-white/[0.05] text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-prism-cyan" />
            <span>FFmpeg:</span>
            <span className="font-mono text-slate-300">{ffmpegVersion ? `v${ffmpegVersion}` : '9.0.2'}</span>
          </div>

          {/* Batch Queue Drawer Trigger */}
          <button
            onClick={onOpenQueue}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-void-900 hover:bg-void-800 border border-white/10 hover:border-prism-cyan/40 text-xs font-semibold text-slate-200 transition-all shadow-glass-rim"
          >
            <Layers className="w-3.5 h-3.5 text-prism-cyan" />
            <span className="hidden sm:inline">Batch Queue</span>
            {queueCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-prism-cyan text-void-950 shadow-[0_0_10px_#00D2FF]">
                {queueCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
};
