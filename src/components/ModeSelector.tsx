import React from 'react';
import { Sparkles, Target, Sliders } from 'lucide-react';
import { CompressionMode } from '../../shared/types';

interface ModeSelectorProps {
  currentMode: CompressionMode;
  onModeChange: (mode: CompressionMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  const modes: Array<{
    id: CompressionMode;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'simple',
      label: 'Simple Mode',
      sublabel: 'Goal-driven presets',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'target_size',
      label: 'Target Size Mode',
      sublabel: 'Exact MB budget & 2-pass',
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: 'advanced',
      label: 'Advanced Mode',
      sublabel: 'Custom codecs & parameters',
      icon: <Sliders className="w-4 h-4" />,
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-obsidian-900/90 rounded-2xl border border-obsidian-700/70">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${
                isActive
                  ? 'bg-gradient-to-r from-brand-blue to-brand-indigo text-white shadow-glow-blue font-semibold scale-[1.01]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800/80 font-medium'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-obsidian-800 text-slate-400'
                }`}
              >
                {m.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold truncate leading-tight">
                  {m.label}
                </p>
                <p
                  className={`text-[11px] truncate mt-0.5 ${
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {m.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
