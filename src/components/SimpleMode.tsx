import React from 'react';
import { Rocket, Scale, Shield, MessageSquare, Smartphone, Zap, Image as ImageIcon, Check } from 'lucide-react';
import { SimpleGoal, SimpleModeConfig } from '../../shared/types';

interface SimpleModeProps {
  config: SimpleModeConfig;
  onChange: (config: SimpleModeConfig) => void;
  hasGpu: boolean;
}

export const SimpleMode: React.FC<SimpleModeProps> = ({ config, onChange, hasGpu }) => {
  const goals: Array<{
    id: SimpleGoal;
    title: string;
    description: string;
    badge: string;
    icon: React.ReactNode;
    activeBorder: string;
    activeGlow: string;
    accentColor: string;
  }> = [
    {
      id: 'max_compression',
      title: 'Maximum Compression',
      description: 'Aggressive 70–80% size reduction with modern H.265/HEVC.',
      badge: '~75% Smaller',
      icon: <Rocket className="w-4 h-4" />,
      activeBorder: 'border-prism-cyan/70',
      activeGlow: 'shadow-[0_0_25px_-5px_rgba(0,210,255,0.3)]',
      accentColor: 'text-prism-cyan',
    },
    {
      id: 'balanced',
      title: 'Balanced Quality',
      description: 'Standard ~50% reduction with visually transparent sharpness.',
      badge: 'Recommended',
      icon: <Scale className="w-4 h-4" />,
      activeBorder: 'border-prism-mint/70',
      activeGlow: 'shadow-[0_0_25px_-5px_rgba(0,245,160,0.3)]',
      accentColor: 'text-prism-mint',
    },
    {
      id: 'archive',
      title: 'Archival Quality',
      description: 'High-fidelity near-lossless compression for master archives.',
      badge: 'Max Clarity',
      icon: <Shield className="w-4 h-4" />,
      activeBorder: 'border-prism-violet/70',
      activeGlow: 'shadow-[0_0_25px_-5px_rgba(142,68,255,0.3)]',
      accentColor: 'text-prism-violet',
    },
    {
      id: 'discord_25',
      title: 'Discord & Email (25 MB)',
      description: 'Strictly fits within 25 MB limits with 2-pass bitrate allocation.',
      badge: 'Target ≤ 25 MB',
      icon: <MessageSquare className="w-4 h-4" />,
      activeBorder: 'border-prism-electric/70',
      activeGlow: 'shadow-[0_0_25px_-5px_rgba(47,102,255,0.3)]',
      accentColor: 'text-prism-electric',
    },
    {
      id: 'whatsapp_hd',
      title: 'WhatsApp & Mobile HD',
      description: 'Optimized 720p H.264 profile for instant mobile messaging.',
      badge: 'Mobile 720p',
      icon: <Smartphone className="w-4 h-4" />,
      activeBorder: 'border-emerald-400/70',
      activeGlow: 'shadow-[0_0_25px_-5px_rgba(52,211,153,0.3)]',
      accentColor: 'text-emerald-400',
    },
    {
      id: 'telegram_fast',
      title: 'Fast Telegram Share',
      description: 'Ultra-fast encoding speed when you need to send clips quickly.',
      badge: 'High Speed',
      icon: <Zap className="w-4 h-4" />,
      activeBorder: 'border-prism-amber/70',
      activeGlow: 'shadow-[0_0_25px_-5px_rgba(255,184,0,0.3)]',
      accentColor: 'text-prism-amber',
    },
    {
      id: 'gif_export',
      title: 'Animated GIF Export',
      description: 'Exports high-fidelity animated GIF using 256-color palettegen.',
      badge: 'Animated GIF',
      icon: <ImageIcon className="w-4 h-4" />,
      activeBorder: 'border-prism-magenta/70',
      activeGlow: 'shadow-[0_0_25px_-5px_rgba(255,42,133,0.3)]',
      accentColor: 'text-prism-magenta',
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
            Select Compression Goal
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Smart parameters automatically calibrated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map((g) => {
            const isSelected = config.goal === g.id;
            return (
              <div
                key={g.id}
                onClick={() => onChange({ ...config, goal: g.id })}
                className={`relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${g.activeBorder} bg-void-850 ${g.activeGlow} ring-1 ring-white/10 scale-[1.01]`
                    : 'border-white/[0.07] bg-void-900/80 hover:border-white/20 hover:bg-void-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`p-2 rounded-lg bg-void-950 border border-white/10 ${g.accentColor}`}>
                      {g.icon}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-200 border border-white/[0.08]">
                        {g.badge}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-prism-cyan flex items-center justify-center text-void-950 shadow-[0_0_8px_#00D2FF]">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white tracking-tight">{g.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {g.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Speed & Acceleration Bar */}
      <div className="p-4 rounded-xl bg-void-900/90 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4 shadow-glass-rim-subtle">
        <div>
          <span className="block text-xs font-semibold text-slate-300 mb-1.5">
            Encoding Priority
          </span>
          <div className="inline-flex p-1 bg-void-950 rounded-lg border border-white/10 text-xs">
            {(['fast', 'balanced', 'best_quality'] as const).map((priority) => {
              const active = config.speedPriority === priority;
              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => onChange({ ...config, speedPriority: priority })}
                  className={`px-3 py-1 rounded-md capitalize transition-all font-semibold ${
                    active
                      ? 'bg-gradient-to-r from-prism-cyan to-prism-electric text-void-950 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {priority.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {hasGpu && (
          <label className="flex items-center space-x-2.5 text-xs text-slate-200 cursor-pointer group">
            <input
              type="checkbox"
              checked={config.useHardwareAccel ?? true}
              onChange={(e) => onChange({ ...config, useHardwareAccel: e.target.checked })}
              className="rounded bg-void-950 border-white/20 text-prism-cyan focus:ring-prism-cyan w-4 h-4"
            />
            <span className="font-semibold flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-prism-amber" />
              <span>Enable Hardware GPU Acceleration</span>
            </span>
          </label>
        )}
      </div>
    </div>
  );
};
