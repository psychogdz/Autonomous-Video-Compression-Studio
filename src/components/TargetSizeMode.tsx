import React from 'react';
import { Target, Sliders, CheckCircle2 } from 'lucide-react';
import { TargetSizeModeConfig, MediaProbeResult } from '../../shared/types';

interface TargetSizeModeProps {
  config: TargetSizeModeConfig;
  onChange: (config: TargetSizeModeConfig) => void;
  probe: MediaProbeResult;
}

export const TargetSizeMode: React.FC<TargetSizeModeProps> = ({ config, onChange, probe }) => {
  const sourceMB = Math.round((probe.fileSizeBytes / (1024 * 1024)) * 10) / 10;
  const duration = Math.max(1, probe.durationSeconds);

  // Quick preset chips
  const quickSizes = [8, 16, 24.5, 50, 100];

  // Compute live approximate video bitrate for display
  const targetBits = config.targetSizeMB * 1024 * 1024 * 8;
  const audioBits = config.audioBitrateKbps * 1000 * duration;
  const remainingVideoBits = Math.max(1000, targetBits - audioBits);
  const calculatedVideoBitrateKbps = Math.round(remainingVideoBits / (duration * 1000));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange({ ...config, targetSizeMB: val });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, parseFloat(e.target.value) || 1);
    onChange({ ...config, targetSizeMB: val });
  };

  return (
    <div className="space-y-5">
      {/* Target Size Dial Box */}
      <div className="p-5 rounded-2xl bg-void-900/90 border border-white/[0.08] shadow-glass-rim space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-prism-cyan/10 border border-prism-cyan/30 text-prism-cyan">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Target Output Budget</h4>
              <p className="text-[11px] text-slate-400">Strictly hit requested file size</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max={Math.max(100, Math.round(sourceMB * 1.5))}
              step="0.5"
              value={config.targetSizeMB}
              onChange={handleNumberChange}
              className="w-24 px-3 py-1.5 rounded-xl bg-void-950 border border-white/10 text-prism-cyan font-mono font-bold text-right text-base focus:outline-none focus:border-prism-cyan/70 shadow-glass-rim transition-colors"
            />
            <span className="text-sm font-bold text-slate-300 font-mono">MB</span>
          </div>
        </div>

        {/* Custom Range Slider */}
        <div className="pt-2">
          <input
            type="range"
            min="2"
            max={Math.max(50, Math.min(1000, Math.round(sourceMB)))}
            step="1"
            value={Math.min(config.targetSizeMB, Math.max(50, Math.round(sourceMB)))}
            onChange={handleSliderChange}
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2">
            <span>Min: 2 MB</span>
            <span className="text-slate-300">Source: {sourceMB} MB</span>
            <span>Max: {Math.max(50, Math.round(sourceMB))} MB</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="pt-1">
          <span className="text-[11px] text-slate-400 font-medium block mb-2">Quick Standard Targets:</span>
          <div className="flex flex-wrap gap-2">
            {quickSizes.map((size) => {
              const active = config.targetSizeMB === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChange({ ...config, targetSizeMB: size })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                    active
                      ? 'bg-gradient-to-r from-prism-cyan to-prism-electric text-void-950 border-prism-cyan shadow-glow-cyan'
                      : 'bg-void-950 text-slate-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  {size === 24.5 ? '25 MB (Discord / Email)' : `${size} MB`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bitrate & Calculation Telemetry */}
      <div className="p-4 rounded-xl bg-void-900/90 border border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-glass-rim-subtle">
        <div>
          <span className="text-[11px] text-slate-400 font-medium">Allocated Video Bitrate Budget</span>
          <p className="text-lg font-bold text-prism-mint font-mono mt-0.5">
            {calculatedVideoBitrateKbps} kbps
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Calculated over {Math.round(duration)}s video duration
          </p>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 font-medium block mb-1">Audio Overhead Allocation</label>
          <select
            value={config.audioBitrateKbps}
            onChange={(e) => onChange({ ...config, audioBitrateKbps: parseInt(e.target.value, 10) })}
            className="w-full bg-void-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-prism-cyan"
          >
            <option value={64}>64 kbps (Max Video Budget)</option>
            <option value={96}>96 kbps (Voice Optimized)</option>
            <option value={128}>128 kbps (Standard High Quality)</option>
            <option value={192}>192 kbps (Audiophile / Music)</option>
          </select>
        </div>
      </div>

      {/* 2-Pass and Downscale Switches */}
      <div className="p-4 rounded-xl bg-void-900/60 border border-white/[0.07] space-y-3">
        <label className="flex items-start space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={config.twoPass}
            onChange={(e) => onChange({ ...config, twoPass: e.target.checked })}
            className="mt-0.5 rounded bg-void-950 border-white/20 text-prism-cyan focus:ring-prism-cyan w-4 h-4"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white">2-Pass Bitrate Mode</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-prism-mint/20 text-prism-mint border border-prism-mint/30">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Pass 1 analyzes motion complexity; Pass 2 encodes with precise bitrate distribution to guarantee target size within ±3%.
            </p>
          </div>
        </label>

        <label className="flex items-start space-x-3 cursor-pointer pt-3 border-t border-white/[0.06] group">
          <input
            type="checkbox"
            checked={config.allowDownscale}
            onChange={(e) => onChange({ ...config, allowDownscale: e.target.checked })}
            className="mt-0.5 rounded bg-void-950 border-white/20 text-prism-cyan focus:ring-prism-cyan w-4 h-4"
          />
          <div>
            <span className="text-xs font-bold text-white">Smart Resolution Adaptation</span>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Automatically downscales (e.g. 1080p → 720p) if the bitrate budget is too tight, ensuring crisp details instead of blurry pixelation.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};
