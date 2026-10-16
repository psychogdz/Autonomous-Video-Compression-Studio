import React from 'react';
import { Rocket, Scale, Shield, MessageSquare, Smartphone, Zap } from 'lucide-react';
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
    tag: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: 'max_compression',
      title: 'Maximum Compression',
      description: 'Aggressive 70–80% size reduction using efficient H.265/HEVC.',
      tag: '~75% Smaller',
      icon: <Rocket className="w-5 h-5 text-brand-blue" />,
      color: 'border-brand-blue/40 bg-brand-blue/5',
    },
    {
      id: 'balanced',
      title: 'Balanced Quality',
      description: 'Standard ~50% reduction with visually transparent quality.',
      tag: 'Recommended',
      icon: <Scale className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/40 bg-emerald-500/5',
    },
    {
      id: 'archive',
      title: 'Archival Preservation',
      description: 'High-fidelity near-lossless compression for personal backups.',
      tag: 'Highest Clarity',
      icon: <Shield className="w-5 h-5 text-brand-violet" />,
      color: 'border-brand-violet/40 bg-brand-violet/5',
    },
    {
      id: 'discord_25',
      title: 'Discord & Email (25 MB)',
      description: 'Guarantees the output strictly fits inside the 25 MB limit.',
      tag: 'Target ≤ 25 MB',
      icon: <MessageSquare className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-500/40 bg-indigo-500/5',
    },
    {
      id: 'whatsapp_hd',
      title: 'WhatsApp & Mobile HD',
      description: 'Optimized 720p H.264 profile for instant mobile messaging.',
      tag: 'Mobile HD',
      icon: <Smartphone className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/40 bg-cyan-500/5',
    },
    {
      id: 'telegram_fast',
      title: 'Fast Telegram Share',
      description: 'Ultra-fast encoding speed when you need to send clips immediately.',
      tag: 'High Speed',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-500/5',
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
          Select Your Compression Goal
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map((g) => {
            const isSelected = config.goal === g.id;
            return (
              <div
                key={g.id}
                onClick={() => onChange({ ...config, goal: g.id })}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${g.color} ring-2 ring-brand-blue shadow-glow-blue scale-[1.01]`
                    : 'border-obsidian-700/60 bg-obsidian-900/60 hover:border-obsidian-600 hover:bg-obsidian-900/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-obsidian-800 border border-obsidian-700/60">
                      {g.icon}
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold bg-obsidian-800 text-slate-300 border border-obsidian-700/70">
                      {g.tag}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{g.title}</h4>
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
      <div className="p-4 rounded-xl bg-obsidian-900/70 border border-obsidian-700/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Encoding Priority
          </label>
          <div className="inline-flex p-1 bg-obsidian-800 rounded-lg border border-obsidian-700 text-xs">
            {(['fast', 'balanced', 'best_quality'] as const).map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => onChange({ ...config, speedPriority: priority })}
                className={`px-3 py-1 rounded-md capitalize transition-colors font-medium ${
                  config.speedPriority === priority
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {priority.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {hasGpu && (
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.useHardwareAccel ?? true}
              onChange={(e) => onChange({ ...config, useHardwareAccel: e.target.checked })}
              className="rounded bg-obsidian-800 border-obsidian-600 text-brand-blue focus:ring-brand-blue w-4 h-4"
            />
            <span className="font-medium flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Use Hardware Acceleration</span>
            </span>
          </label>
        )}
      </div>
    </div>
  );
};
