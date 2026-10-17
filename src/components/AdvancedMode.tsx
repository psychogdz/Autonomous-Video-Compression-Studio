import React from 'react';
import { Sliders, Video, Volume2, Cpu, Maximize } from 'lucide-react';
import { AdvancedModeConfig, VideoCodec, EncoderSpeedPreset, ResolutionPreset, AudioAction, HardwareStatus } from '../../shared/types';

interface AdvancedModeProps {
  config: AdvancedModeConfig;
  onChange: (config: AdvancedModeConfig) => void;
  hardware: HardwareStatus | null;
}

export const AdvancedMode: React.FC<AdvancedModeProps> = ({ config, onChange, hardware }) => {
  const isCrfMode = config.videoBitrateKbps === undefined || config.videoBitrateKbps === 0;

  const availableCodecs: Array<{ id: VideoCodec; label: string; group: string }> = [
    { id: 'libx264', label: 'H.264 / AVC (libx264 Software)', group: 'Software' },
    { id: 'libx265', label: 'H.265 / HEVC (libx265 Software)', group: 'Software' },
    { id: 'libsvtav1', label: 'AV1 (libsvtav1 Modern)', group: 'Software' },
    { id: 'gif', label: 'Animated GIF (Palettegen + Lanczos)', group: 'Image Animation' },
  ];

  if (hardware?.hasNvidia) {
    availableCodecs.push(
      { id: 'h264_nvenc', label: 'NVIDIA NVENC H.264', group: 'GPU Accelerated' },
      { id: 'hevc_nvenc', label: 'NVIDIA NVENC HEVC', group: 'GPU Accelerated' }
    );
  }
  if (hardware?.hasIntel) {
    availableCodecs.push(
      { id: 'h264_qsv', label: 'Intel QuickSync H.264', group: 'GPU Accelerated' },
      { id: 'hevc_qsv', label: 'Intel QuickSync HEVC', group: 'GPU Accelerated' }
    );
  }
  if (hardware?.hasAmd) {
    availableCodecs.push(
      { id: 'h264_amf', label: 'AMD AMF H.264', group: 'GPU Accelerated' },
      { id: 'hevc_amf', label: 'AMD AMF HEVC', group: 'GPU Accelerated' }
    );
  }
  if (hardware?.encoders.some(e => e.id === 'h264_mf' && e.available)) {
    availableCodecs.push(
      { id: 'h264_mf', label: 'MediaFoundation H.264 (Windows GPU)', group: 'Hardware' }
    );
  }

  const presets: EncoderSpeedPreset[] = [
    'ultrafast',
    'superfast',
    'veryfast',
    'faster',
    'fast',
    'medium',
    'slow',
    'slower',
    'veryslow',
  ];

  return (
    <div className="space-y-5">
      {/* Codec & Speed Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Codec */}
        <div className="p-4 rounded-xl bg-void-900/90 border border-white/[0.08] shadow-glass-rim-subtle">
          <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center space-x-1.5">
            <Video className="w-3.5 h-3.5 text-prism-cyan" />
            <span>Target Video Codec</span>
          </label>
          <select
            value={config.codec}
            onChange={(e) => onChange({ ...config, codec: e.target.value as VideoCodec })}
            className="w-full bg-void-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-prism-cyan"
          >
            {availableCodecs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Speed Preset */}
        <div className="p-4 rounded-xl bg-void-900/90 border border-white/[0.08] shadow-glass-rim-subtle">
          <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-prism-mint" />
            <span>Encoder Speed Preset</span>
          </label>
          <select
            value={config.preset}
            onChange={(e) => onChange({ ...config, preset: e.target.value as EncoderSpeedPreset })}
            className="w-full bg-void-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-prism-cyan capitalize"
          >
            {presets.map((p) => (
              <option key={p} value={p}>
                {p} {p === 'medium' ? '(Balanced)' : p === 'slow' ? '(Highest Ratio)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CPU Load Limiter for Software Encoders */}
      {config.codec.startsWith('lib') && (
        <div className="p-4 rounded-xl bg-void-900/90 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-glass-rim-subtle animate-fade-in">
          <div>
            <span className="text-xs font-bold text-white block">
              CPU Utilization Limiter (Throttling)
            </span>
            <span className="text-[11px] text-slate-400">
              Caps CPU core usage to prevent 100% freezing and keep desktop apps smooth
            </span>
          </div>

          <div className="inline-flex p-1 bg-void-950 rounded-xl border border-white/10 text-xs shrink-0">
            {(['eco', 'balanced', 'max'] as const).map((lvl) => {
              const active = (config.cpuThrottle || 'balanced') === lvl;
              const label = lvl === 'eco' ? 'Eco (50% CPU)' : lvl === 'balanced' ? 'Balanced (75%)' : 'Max (100%)';
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onChange({ ...config, cpuThrottle: lvl })}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold text-[11px] transition-all ${
                    active
                      ? 'bg-prism-cyan text-void-950 shadow-[0_0_8px_#00D2FF]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={lvl === 'eco' ? '50% cores used, quiet fans' : lvl === 'balanced' ? '75% cores, Windows stays responsive' : '100% all cores used'}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rate Control Strategy (CRF vs Target Bitrate) */}
      <div className="p-5 rounded-2xl bg-void-900/90 border border-white/[0.08] shadow-glass-rim space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Rate Control Method
          </span>
          <div className="inline-flex p-1 bg-void-950 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => onChange({ ...config, videoBitrateKbps: undefined, crf: config.crf ?? 23 })}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                isCrfMode
                  ? 'bg-gradient-to-r from-prism-cyan to-prism-electric text-void-950 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CRF (Constant Quality)
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, videoBitrateKbps: 2500, crf: undefined })}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                !isCrfMode
                  ? 'bg-gradient-to-r from-prism-cyan to-prism-electric text-void-950 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Target Bitrate (ABR)
            </button>
          </div>
        </div>

        {isCrfMode ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Constant Rate Factor (0 - 51)</span>
              <span className="text-base font-bold font-mono text-prism-cyan">
                CRF {config.crf ?? 23}
              </span>
            </div>
            <input
              type="range"
              min="14"
              max="40"
              step="1"
              value={config.crf ?? 23}
              onChange={(e) => onChange({ ...config, crf: parseInt(e.target.value, 10) })}
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>18 (Master Quality)</span>
              <span className="text-slate-300">23 (Standard)</span>
              <span>28 (High Compression)</span>
              <span>35+ (Aggressive)</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Target Video Bitrate</span>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="200"
                  max="50000"
                  step="100"
                  value={config.videoBitrateKbps || 2500}
                  onChange={(e) => onChange({ ...config, videoBitrateKbps: parseInt(e.target.value, 10) })}
                  className="w-28 px-3 py-1.5 rounded-xl bg-void-950 border border-white/10 text-prism-cyan font-mono font-bold text-sm text-right focus:outline-none focus:border-prism-cyan"
                />
                <span className="text-xs font-mono text-slate-400">kbps</span>
              </div>
            </div>
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={config.twoPass}
                onChange={(e) => onChange({ ...config, twoPass: e.target.checked })}
                className="rounded bg-void-950 border-white/20 text-prism-cyan focus:ring-prism-cyan w-4 h-4"
              />
              <span className="font-medium">Enable 2-Pass Encoding for maximum bitrate distribution</span>
            </label>
          </div>
        )}
      </div>

      {/* Resolution & FPS Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Resolution */}
        <div className="p-4 rounded-xl bg-void-900/90 border border-white/[0.08] shadow-glass-rim-subtle">
          <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center space-x-1.5">
            <Maximize className="w-3.5 h-3.5 text-prism-violet" />
            <span>Resolution Downscaling</span>
          </label>
          <select
            value={config.resolution}
            onChange={(e) => onChange({ ...config, resolution: e.target.value as ResolutionPreset })}
            className="w-full bg-void-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-prism-cyan"
          >
            <option value="original">Original (Preserve Source Resolution)</option>
            <option value="4k">4K UHD (3840x2160)</option>
            <option value="1440p">1440p QHD (2560x1440)</option>
            <option value="1080p">1080p Full HD (1920x1080)</option>
            <option value="720p">720p HD (1280x720)</option>
            <option value="480p">480p SD (854x480)</option>
          </select>
        </div>

        {/* Frame Rate */}
        <div className="p-4 rounded-xl bg-void-900/90 border border-white/[0.08] shadow-glass-rim-subtle">
          <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-prism-electric" />
            <span>Frame Rate (FPS)</span>
          </label>
          <select
            value={config.fps || 0}
            onChange={(e) => onChange({ ...config, fps: parseInt(e.target.value, 10) })}
            className="w-full bg-void-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-prism-cyan"
          >
            <option value={0}>Original (Preserve Source FPS)</option>
            <option value={60}>60 FPS (Ultra Smooth)</option>
            <option value={30}>30 FPS (Standard Video)</option>
            <option value={24}>24 FPS (Cinematic / Efficient)</option>
          </select>
        </div>
      </div>

      {/* Audio Options */}
      <div className="p-4 rounded-xl bg-void-900/90 border border-white/[0.08] shadow-glass-rim-subtle">
        <label className="block text-xs font-bold text-slate-200 mb-3 flex items-center space-x-1.5">
          <Volume2 className="w-3.5 h-3.5 text-prism-cyan" />
          <span>Audio Processing & Codec</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Audio Stream Action</span>
            <select
              value={config.audioAction}
              onChange={(e) => onChange({ ...config, audioAction: e.target.value as AudioAction })}
              className="w-full bg-void-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-prism-cyan"
            >
              <option value="aac">AAC (Universal Compatibility)</option>
              <option value="opus">Opus (High Efficiency Audio)</option>
              <option value="copy">Copy Stream (Lossless Passthrough)</option>
              <option value="remove">Mute / Strip Audio Track</option>
            </select>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Audio Bitrate</span>
            <select
              disabled={config.audioAction === 'copy' || config.audioAction === 'remove'}
              value={config.audioBitrateKbps}
              onChange={(e) => onChange({ ...config, audioBitrateKbps: parseInt(e.target.value, 10) })}
              className="w-full bg-void-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono disabled:opacity-40 focus:outline-none focus:border-prism-cyan"
            >
              <option value={64}>64 kbps (Low / Speech)</option>
              <option value={96}>96 kbps (Voice Optimized)</option>
              <option value={128}>128 kbps (Standard High Quality)</option>
              <option value={192}>192 kbps (Audiophile / Music)</option>
              <option value={256}>256 kbps (Studio Master)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
