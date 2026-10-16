import React from 'react';
import { Target, Info, CheckCircle2, Sliders } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Target Size Input & Slider */}
      <div className="p-5 rounded-2xl glass-panel border border-obsidian-700/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-brand-blue" />
            <h4 className="text-sm font-bold text-white">Desired Output File Size</h4>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max={Math.max(100, Math.round(sourceMB * 1.5))}
              step="0.5"
              value={config.targetSizeMB}
              onChange={handleNumberChange}
              className="w-24 px-3 py-1.5 rounded-lg bg-obsidian-800 border border-obsidian-600 text-white font-mono font-bold text-right text-sm focus:outline-none focus:border-brand-blue"
            />
            <span className="text-sm font-bold text-slate-300">MB</span>
          </div>
        </div>

        {/* Range Slider */}
        <div>
          <input
            type="range"
            min="2"
            max={Math.max(50, Math.min(1000, Math.round(sourceMB)))}
            step="1"
            value={Math.min(config.targetSizeMB, Math.max(50, Math.round(sourceMB)))}
            onChange={handleSliderChange}
            className="w-full h-2 rounded-lg cursor-pointer accent-brand-blue"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
            <span>2 MB</span>
            <span>Source: {sourceMB} MB</span>
            <span>Max: {Math.max(50, Math.round(sourceMB))} MB</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-xs text-slate-400 block mb-1.5">Quick Presets:</span>
          <div className="flex flex-wrap gap-2">
            {quickSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onChange({ ...config, targetSizeMB: size })}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${
                  config.targetSizeMB === size
                    ? 'bg-brand-blue text-white border-brand-blue shadow-glow-blue'
                    : 'bg-obsidian-800 text-slate-300 border-obsidian-700 hover:border-obsidian-600'
                }`}
              >
                {size === 24.5 ? '25 MB (Discord/Email)' : `${size} MB`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bitrate & Calculation Telemetry */}
      <div className="p-4 rounded-xl bg-obsidian-900/80 border border-obsidian-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-slate-400">Calculated Video Bitrate</span>
          <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
            {calculatedVideoBitrateKbps} kbps
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Calculated over {Math.round(duration)} seconds of video
          </p>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Audio Track Allocation</label>
          <select
            value={config.audioBitrateKbps}
            onChange={(e) => onChange({ ...config, audioBitrateKbps: parseInt(e.target.value, 10) })}
            className="w-full bg-obsidian-800 border border-obsidian-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-brand-blue"
          >
            <option value={64}>64 kbps (Low - saves max budget for video)</option>
            <option value={96}>96 kbps (Voice / Dialogue optimized)</option>
            <option value={128}>128 kbps (Standard High Quality)</option>
            <option value={192}>192 kbps (Audiophile / Music)</option>
          </select>
        </div>
      </div>

      {/* 2-Pass and Downscale Options */}
      <div className="p-4 rounded-xl bg-obsidian-900/60 border border-obsidian-700/60 space-y-3">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.twoPass}
            onChange={(e) => onChange({ ...config, twoPass: e.target.checked })}
            className="mt-0.5 rounded bg-obsidian-800 border-obsidian-600 text-brand-blue focus:ring-brand-blue w-4 h-4"
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-white">2-Pass Strict Bitrate Encoding</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Pass 1 analyzes frame motion complexity; Pass 2 encodes with exact distribution to hit your target size within ±3%.
            </p>
          </div>
        </label>

        <label className="flex items-start space-x-3 cursor-pointer pt-2 border-t border-obsidian-800">
          <input
            type="checkbox"
            checked={config.allowDownscale}
            onChange={(e) => onChange({ ...config, allowDownscale: e.target.checked })}
            className="mt-0.5 rounded bg-obsidian-800 border-obsidian-600 text-brand-blue focus:ring-brand-blue w-4 h-4"
          />
          <div>
            <span className="text-xs font-semibold text-white">Smart Resolution Adaptation</span>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Automatically downscales resolution (e.g. 1080p → 720p) if the target bitrate is too tight to preserve sharpness and prevent pixelation.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};
