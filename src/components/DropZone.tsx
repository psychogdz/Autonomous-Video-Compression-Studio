import React, { useState, useRef } from 'react';
import { UploadCloud, Film, FileText, ArrowRight, Loader2 } from 'lucide-react';

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
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
          isDragOver
            ? 'border-brand-blue bg-brand-blue/10 scale-[1.01]'
            : 'border-obsidian-700/80 bg-obsidian-900/60 hover:border-obsidian-600 hover:bg-obsidian-900/90'
        } ${isAnalyzing ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/gif,.mp4,.mov,.mkv,.webm,.avi,.flv,.ts,.gif"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Glow backdrop on drag */}
        {isDragOver && (
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/15 to-brand-indigo/15 pointer-events-none" />
        )}

        {isAnalyzing ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center text-brand-blue animate-spin">
              <Loader2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Analyzing Video Streams...</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">Probing codecs, bitrates, audio tracks, and frame rates</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-obsidian-800/90 border border-obsidian-700 flex items-center justify-center text-brand-blue group-hover:scale-105 transition-transform shadow-lg">
              <UploadCloud className="w-8 h-8 text-brand-blue" />
            </div>
            <div>
              <p className="text-base sm:text-lg font-semibold text-white">
                Drag and drop your video file here
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                or <span className="text-brand-blue font-medium hover:underline">browse files</span> from your computer
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-obsidian-850 px-3 py-1.5 rounded-full border border-obsidian-700/50">
              <Film className="w-3.5 h-3.5 text-slate-400" />
              <span>Supports MP4, MOV, MKV, WebM, AVI, GIF, TS, ProRes</span>
            </div>
          </div>
        )}
      </div>

      {/* Alternative direct file path input */}
      <div className="mt-3 flex justify-between items-center text-xs text-slate-400">
        <button
          type="button"
          onClick={() => setShowPathInput(!showPathInput)}
          className="text-slate-400 hover:text-brand-blue transition-colors flex items-center space-x-1"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{showPathInput ? 'Hide local path input' : 'Enter local file path directly'}</span>
        </button>
      </div>

      {showPathInput && (
        <form onSubmit={handleDirectPathSubmit} className="mt-2.5 flex items-center space-x-2">
          <input
            type="text"
            value={directPathInput}
            onChange={(e) => setDirectPathInput(e.target.value)}
            placeholder="e.g. C:\Videos\raw_capture.mp4"
            className="flex-1 bg-obsidian-900 border border-obsidian-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-blue font-mono"
          />
          <button
            type="submit"
            disabled={!directPathInput.trim() || isAnalyzing}
            className="px-3.5 py-2 rounded-lg bg-brand-blue hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <span>Analyze</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
