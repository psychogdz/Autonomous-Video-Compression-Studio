import React, { useState, useRef } from 'react';
import { UploadCloud, Film, FileText, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  onPathSelected: (path: string) => void;
  isAnalyzing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelected,
  onPathSelected,
  isAnalyzing,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [directPathInput, setDirectPathInput] = useState('');
  const [showPathInput, setShowPathInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  const handleDirectPathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (directPathInput.trim()) {
      onPathSelected(directPathInput.trim());
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
        className={`group relative rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center overflow-hidden border ${
          isDragOver
            ? 'border-prism-cyan bg-prism-cyan/[0.08] shadow-glow-cyan scale-[1.01]'
            : 'border-white/[0.09] bg-gradient-to-b from-void-900/90 to-void-950/90 hover:border-prism-cyan/40 hover:bg-void-900 shadow-glass-rim'
        } ${isAnalyzing ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/gif,.mp4,.mov,.mkv,.webm,.avi,.flv,.ts,.gif"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Ambient background bloom */}
        <div className="absolute inset-0 bg-gradient-radial from-prism-cyan/10 via-prism-electric/[0.03] to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />

        {isAnalyzing ? (
          <div className="relative z-10 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-prism-cyan/10 border border-prism-cyan/40 flex items-center justify-center text-prism-cyan shadow-glow-cyan">
              <Loader2 className="w-8 h-8 animate-spin text-prism-cyan" />
            </div>
            <div>
              <p className="text-base font-bold text-white tracking-tight">Analyzing Media Streams...</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">Deep probing codecs, bitrates, audio channels, and framerate</p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center space-y-4 max-w-md">
            {/* Center aperture glyph */}
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-void-850 border border-white/10 group-hover:border-prism-cyan/50 group-hover:shadow-glow-cyan transition-all duration-300">
              <UploadCloud className="w-8 h-8 text-prism-cyan transition-transform duration-300 group-hover:scale-110" />
            </div>

            <div>
              <p className="text-base sm:text-lg font-bold text-white tracking-tight">
                Drag and drop your video or animated GIF
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                or <span className="text-prism-cyan font-semibold hover:underline">browse files</span> from your workstation
              </p>
            </div>

            {/* Supported formats badge */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              {['MP4', 'MOV', 'MKV', 'WebM', 'AVI', 'GIF', 'ProRes'].map((fmt) => (
                <span
                  key={fmt}
                  className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.06]"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Local path input switch */}
      <div className="flex justify-between items-center px-1">
        <button
          type="button"
          onClick={() => setShowPathInput(!showPathInput)}
          className="text-xs text-slate-400 hover:text-prism-cyan transition-colors flex items-center space-x-1.5 font-medium"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{showPathInput ? 'Hide local path input' : 'Or load directly from host file path'}</span>
        </button>
      </div>

      {showPathInput && (
        <form onSubmit={handleDirectPathSubmit} className="flex items-center space-x-2 pt-1">
          <input
            type="text"
            value={directPathInput}
            onChange={(e) => setDirectPathInput(e.target.value)}
            placeholder="e.g. C:\Videos\raw_capture.mp4"
            className="flex-1 bg-void-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-prism-cyan/60 font-mono shadow-glass-rim transition-colors"
          />
          <button
            type="submit"
            disabled={!directPathInput.trim() || isAnalyzing}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-prism-cyan to-prism-electric text-void-950 font-bold text-xs hover:opacity-95 disabled:opacity-40 transition-all flex items-center space-x-1.5 shadow-glow-cyan"
          >
            <span>Analyze</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
