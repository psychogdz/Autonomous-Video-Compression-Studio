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
      sublabel: 'Goal-driven smart presets',
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 bg-void-900/95 rounded-2xl border border-white/[0.08] shadow-glass-rim">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              className={`relative flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                isActive
                  ? 'btn-segment-active text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 transition-colors ${
                  isActive
                    ? 'bg-prism-cyan/20 text-prism-cyan shadow-[0_0_12px_rgba(0,210,255,0.4)]'
                    : 'bg-white/[0.04] text-slate-400'
                }`}
              >
                {m.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs sm:text-sm font-bold tracking-tight truncate leading-tight">
                    {m.label}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-prism-cyan shadow-[0_0_6px_#00D2FF]" />
                  )}
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-cyan-200/80 font-medium' : 'text-slate-400'}`}>
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
