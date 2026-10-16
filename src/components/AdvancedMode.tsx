import React from 'react';
import { Sliders, Video, Volume2, Cpu } from 'lucide-react';
import { AdvancedModeConfig, VideoCodec, EncoderSpeedPreset, ResolutionPreset, AudioAction, HardwareStatus } from '../../shared/types';

interface AdvancedModeProps {
  config: AdvancedModeConfig;
  onChange: (config: AdvancedModeConfig) => void;
  hardware: HardwareStatus | null;
}

export const AdvancedMode: React.FC<AdvancedModeProps> = ({ config, onChange, hardware }) => {
  const isCrfMode = config.videoBitrateKbps === undefined || config.videoBitrateKbps === 0;

  const availableCodecs: Array<{ id: VideoCodec; label: string; group: string }> = [
    { id: 'libx264', label: 'H.264 / AVC (Software libx264)', group: 'Software' },
    { id: 'libx265', label: 'H.265 / HEVC (Software libx265)', group: 'Software' },
    { id: 'libsvtav1', label: 'AV1 (Software libsvtav1)', group: 'Software' },
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
      {/* Codec & Rate Control Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Codec */}
        <div className="p-4 rounded-xl glass-panel border border-obsidian-700/60">
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
            <Video className="w-3.5 h-3.5 text-brand-blue" />
            <span>Video Codec</span>
          </label>
          <select
            value={config.codec}
            onChange={(e) => onChange({ ...config, codec: e.target.value as VideoCodec })}
            className="w-full bg-obsidian-850 border border-obsidian-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-blue"
          >
            {availableCodecs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Speed Preset */}
        <div className="p-4 rounded-xl glass-panel border border-obsidian-700/60">
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encoder Speed Preset</span>
          </label>
          <select
            value={config.preset}
            onChange={(e) => onChange({ ...config, preset: e.target.value as EncoderSpeedPreset })}
            className="w-full bg-obsidian-850 border border-obsidian-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-blue capitalize"
          >
            {presets.map((p) => (
              <option key={p} value={p}>
                {p} {p === 'medium' ? '(Default Balanced)' : p === 'slow' ? '(Better Compression)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rate Control Strategy (CRF vs Target Bitrate) */}
      <div className="p-5 rounded-2xl glass-panel border border-obsidian-700/70 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Rate Control Method
          </span>
          <div className="inline-flex p-1 bg-obsidian-800 rounded-lg border border-obsidian-700 text-xs">
            <button
              type="button"
              onClick={() => onChange({ ...config, videoBitrateKbps: undefined, crf: config.crf ?? 23 })}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                isCrfMode ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              CRF (Quality Factor)
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, videoBitrateKbps: 2500, crf: undefined })}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                !isCrfMode ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Target Bitrate (ABR)
            </button>
          </div>
        </div>

        {isCrfMode ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">CRF Value (0 - 51)</span>
              <span className="text-base font-bold font-mono text-brand-blue">
                {config.crf ?? 23}
              </span>
            </div>
            <input
              type="range"
              min="14"
              max="40"
              step="1"
              value={config.crf ?? 23}
              onChange={(e) => onChange({ ...config, crf: parseInt(e.target.value, 10) })}
              className="w-full h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>18 (Near Lossless)</span>
              <span>23 (Default Balanced)</span>
              <span>28 (High Compression)</span>
              <span>35+ (Aggressive)</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
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
                  className="w-24 px-2 py-1 rounded bg-obsidian-800 border border-obsidian-700 text-white font-mono text-sm text-right"
                />
                <span className="text-xs font-mono text-slate-400">kbps</span>
              </div>
            </div>
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={config.twoPass}
                onChange={(e) => onChange({ ...config, twoPass: e.target.checked })}
                className="rounded bg-obsidian-800 border-obsidian-600 text-brand-blue focus:ring-brand-blue w-4 h-4"
              />
              <span>Enable 2-Pass Encoding for maximum bitrate efficiency</span>
            </label>
          </div>
        )}
      </div>

      {/* Resolution & FPS Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Resolution */}
        <div className="p-4 rounded-xl glass-panel border border-obsidian-700/60">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Resolution Scaling
          </label>
          <select
            value={config.resolution}
            onChange={(e) => onChange({ ...config, resolution: e.target.value as ResolutionPreset })}
            className="w-full bg-obsidian-850 border border-obsidian-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-blue"
          >
            <option value="original">Original (Keep Source Resolution)</option>
            <option value="4k">4K UHD (3840x2160)</option>
            <option value="1440p">1440p QHD (2560x1440)</option>
            <option value="1080p">1080p Full HD (1920x1080)</option>
            <option value="720p">720p HD (1280x720)</option>
            <option value="480p">480p SD (854x480)</option>
          </select>
        </div>

        {/* Frame Rate */}
        <div className="p-4 rounded-xl glass-panel border border-obsidian-700/60">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Frame Rate (FPS)
          </label>
          <select
            value={config.fps || 0}
            onChange={(e) => onChange({ ...config, fps: parseInt(e.target.value, 10) })}
            className="w-full bg-obsidian-850 border border-obsidian-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-blue"
          >
            <option value={0}>Original (Keep Source FPS)</option>
            <option value={60}>60 FPS (Smooth)</option>
            <option value={30}>30 FPS (Standard Video)</option>
            <option value={24}>24 FPS (Cinematic / Space-saving)</option>
          </select>
        </div>
      </div>

      {/* Audio Options */}
      <div className="p-4 rounded-xl glass-panel border border-obsidian-700/60">
        <label className="block text-xs font-semibold text-slate-300 mb-3 flex items-center space-x-1.5">
          <Volume2 className="w-3.5 h-3.5 text-brand-cyan" />
          <span>Audio Processing</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Audio Codec</span>
            <select
              value={config.audioAction}
              onChange={(e) => onChange({ ...config, audioAction: e.target.value as AudioAction })}
              className="w-full bg-obsidian-850 border border-obsidian-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
            >
              <option value="aac">AAC (Universal Compatibility)</option>
              <option value="opus">Opus (High Efficiency Audio)</option>
              <option value="copy">Copy Stream (Lossless Passthrough)</option>
              <option value="remove">Mute / Remove Audio Stream</option>
            </select>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Audio Bitrate</span>
            <select
              disabled={config.audioAction === 'copy' || config.audioAction === 'remove'}
              value={config.audioBitrateKbps}
              onChange={(e) => onChange({ ...config, audioBitrateKbps: parseInt(e.target.value, 10) })}
              className="w-full bg-obsidian-850 border border-obsidian-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono disabled:opacity-50"
            >
              <option value={64}>64 kbps (Low / Speech)</option>
              <option value={96}>96 kbps (Voice Optimized)</option>
              <option value={128}>128 kbps (Standard High Quality)</option>
              <option value={192}>192 kbps (Audiophile Music)</option>
              <option value={256}>256 kbps (Studio Master)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
