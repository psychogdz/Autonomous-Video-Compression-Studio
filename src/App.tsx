import React, { useState, useEffect, useRef } from 'react';
import { Play, Layers, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { MediaInspector } from './components/MediaInspector';
import { ModeSelector } from './components/ModeSelector';
import { SimpleMode } from './components/SimpleMode';
import { TargetSizeMode } from './components/TargetSizeMode';
import { AdvancedMode } from './components/AdvancedMode';
import { EstimateBadge } from './components/EstimateBadge';
import { EncodingProgress } from './components/EncodingProgress';
import { ResultCard } from './components/ResultCard';
import { VideoCompareModal } from './components/VideoCompareModal';
import { BatchQueueView } from './components/BatchQueueView';
import {
  HardwareStatus,
  MediaProbeResult,
  CompressionMode,
  SimpleModeConfig,
  TargetSizeModeConfig,
  AdvancedModeConfig,
  DecisionEstimate,
  EncodingProgress as ProgressType,
  CompressionOutcome,
  QueueJob,
} from '../shared/types';

export const App: React.FC = () => {
  // System & Environment
  const [hardware, setHardware] = useState<HardwareStatus | null>(null);
  const [ffmpegVersion, setFfmpegVersion] = useState<string>('9.0.2');

  // Active File & Probing
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<MediaProbeResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Configuration Modes
  const [mode, setMode] = useState<CompressionMode>('simple');
  const [simpleConfig, setSimpleConfig] = useState<SimpleModeConfig>({
    goal: 'max_compression',
    speedPriority: 'balanced',
    useHardwareAccel: true,
  });
  const [targetSizeConfig, setTargetSizeConfig] = useState<TargetSizeModeConfig>({
    targetSizeMB: 25,
    twoPass: true,
    allowDownscale: true,
    audioBitrateKbps: 128,
  });
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedModeConfig>({
    codec: 'libx264',
    crf: 23,
    twoPass: false,
    preset: 'medium',
    resolution: 'original',
    audioAction: 'aac',
    audioBitrateKbps: 128,
    keepSubtitles: true,
    stripMetadata: false,
  });

  // Decision & Estimates
  const [estimate, setEstimate] = useState<DecisionEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState<boolean>(false);

  // Compression Execution & Telemetry
  const [isEncoding, setIsEncoding] = useState<boolean>(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressType | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [result, setResult] = useState<CompressionOutcome | null>(null);

  // Modals & Drawers
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [queue, setQueue] = useState<QueueJob[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);

  // 1. Fetch system status on load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.ffmpeg?.version) setFfmpegVersion(data.ffmpeg.version);
      })
      .catch(() => {});

    fetch('/api/hardware')
      .then((res) => res.json())
      .then((hw: HardwareStatus) => setHardware(hw))
      .catch(() => {});

    fetchQueue();
  }, []);

  const fetchQueue = () => {
    fetch('/api/queue')
      .then((res) => res.json())
      .then((q: QueueJob[]) => setQueue(q))
      .catch(() => {});
  };

  // 2. Fetch live estimate whenever metadata or config changes
  useEffect(() => {
    if (!metadata || !activeFilePath) {
      setEstimate(null);
      return;
    }

    setIsEstimating(true);
    const debounceTimer = setTimeout(() => {
      fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          probe: metadata,
          config: {
            sourceFilePath: activeFilePath,
            mode,
            simpleConfig,
            targetSizeConfig,
            advancedConfig,
          },
        }),
      })
        .then((res) => res.json())
        .then((est: DecisionEstimate) => {
          setEstimate(est);
        })
        .catch(() => {})
        .finally(() => setIsEstimating(false));
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [metadata, activeFilePath, mode, simpleConfig, targetSizeConfig, advancedConfig]);

  // File Handlers
  const handleFileSelected = async (file: File) => {
    setIsAnalyzing(true);
    setErrorBanner(null);
    setResult(null);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload and analyze video');

      setActiveFilePath(data.filePath);
      setMetadata(data.metadata);

      // Set sensible initial target size (e.g. 50% of source size)
      const halfMB = Math.max(5, Math.round(data.metadata.fileSizeBytes / (1024 * 1024 * 2)));
      setTargetSizeConfig((prev) => ({ ...prev, targetSizeMB: halfMB }));
    } catch (err: any) {
      setErrorBanner(err.message || 'Error uploading file');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePathSelected = async (filePath: string) => {
    setIsAnalyzing(true);
    setErrorBanner(null);
    setResult(null);

    try {
      const res = await fetch('/api/probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to probe video file');

      setActiveFilePath(filePath);
      setMetadata(data);

      const halfMB = Math.max(5, Math.round(data.fileSizeBytes / (1024 * 1024 * 2)));
      setTargetSizeConfig((prev) => ({ ...prev, targetSizeMB: halfMB }));
    } catch (err: any) {
      setErrorBanner(err.message || 'Error analyzing local path');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setActiveFilePath(null);
    setMetadata(null);
    setResult(null);
    setProgress(null);
    setEstimate(null);
  };

  // Start Compression Job
  const handleStartCompression = async () => {
    if (!activeFilePath || isEncoding) return;

    setErrorBanner(null);
    setIsEncoding(true);
    setIsCancelling(false);
    setResult(null);
    setProgress(null);

    try {
      const res = await fetch('/api/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceFilePath: activeFilePath,
          mode,
          simpleConfig,
          targetSizeConfig,
          advancedConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start compression job');

      const jobId = data.jobId;
      setActiveJobId(jobId);

      // Connect to Server-Sent Events (SSE) telemetry stream
      const sse = new EventSource(`/api/compress/${jobId}/progress`);
      eventSourceRef.current = sse;
      let hasCompleted = false;

      sse.addEventListener('progress', (e) => {
        const prog: ProgressType = JSON.parse(e.data);
        setProgress(prog);
      });

      sse.addEventListener('complete', (e) => {
        hasCompleted = true;
        const outcome: CompressionOutcome = JSON.parse(e.data);
        setResult(outcome);
        setIsEncoding(false);
        setActiveJobId(null);
        sse.close();
      });

      sse.addEventListener('job_error', (e: any) => {
        if (!hasCompleted) {
          try {
            const errData = JSON.parse(e.data || '{}');
            setErrorBanner(errData.message || 'Compression process encountered an error');
          } catch {
            setErrorBanner('Compression process encountered an error');
          }
          setIsEncoding(false);
          setActiveJobId(null);
        }
        sse.close();
      });

      sse.onerror = () => {
        // Only report connection error if the job has not completed and is still encoding
        if (!hasCompleted) {
          // SSE connection dropped before completion
          sse.close();
        }
      };
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to initialize compression job');
      setIsEncoding(false);
    }
  };

  // Cancel Job
  const handleCancelJob = async () => {
    if (!activeJobId) return;
    setIsCancelling(true);
    try {
      await fetch(`/api/compress/${activeJobId}/cancel`, { method: 'POST' });
    } catch {
      // Ignore cancel error
    } finally {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setIsEncoding(false);
      setIsCancelling(false);
      setActiveJobId(null);
      setProgress(null);
    }
  };

  const handleRevealFolder = (path: string) => {
    fetch('/api/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: path }),
    });
  };

  // Add active file to batch queue
  const handleAddToQueue = async () => {
    if (!activeFilePath) return;
    await fetch('/api/queue/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath: activeFilePath,
        config: {
          sourceFilePath: activeFilePath,
          mode,
          simpleConfig,
          targetSizeConfig,
          advancedConfig,
        },
      }),
    });
    fetchQueue();
    setIsQueueOpen(true);
  };

  return (
    <div className="min-h-screen bg-void-950 flex flex-col font-sans">
      <Header
        hardware={hardware}
        queueCount={queue.length}
        onOpenQueue={() => setIsQueueOpen(true)}
        ffmpegVersion={ffmpegVersion}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error Banner */}
        {errorBanner && (
          <div className="p-4 rounded-2xl bg-prism-rose/10 border border-prism-rose/30 flex items-start space-x-3 text-rose-200 text-xs shadow-lg animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-prism-rose" />
            <div className="flex-1">
              <span className="font-bold block text-white">System Advisory:</span>
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-slate-400 hover:text-white font-bold px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Dual-Column Ergonomic Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Source Video & Configuration (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Video File Input / Inspector */}
            {!metadata ? (
              <DropZone
                onFileSelected={handleFileSelected}
                onPathSelected={handlePathSelected}
                isAnalyzing={isAnalyzing}
              />
            ) : (
              <MediaInspector metadata={metadata} onClear={handleClear} />
            )}

            {/* Step 2: Mode Selector & Configuration */}
            {metadata && (
              <div className="space-y-5">
                <ModeSelector currentMode={mode} onModeChange={setMode} />

                {/* Dynamic Configuration Panel */}
                <div className="studio-card rounded-2xl p-6 border border-white/[0.08] shadow-2xl relative overflow-hidden">
                  {mode === 'simple' && (
                    <SimpleMode
                      config={simpleConfig}
                      onChange={setSimpleConfig}
                      hasGpu={!!(hardware?.hasNvidia || hardware?.hasIntel || hardware?.hasAmd)}
                    />
                  )}

                  {mode === 'target_size' && (
                    <TargetSizeMode
                      config={targetSizeConfig}
                      onChange={setTargetSizeConfig}
                      probe={metadata}
                    />
                  )}

                  {mode === 'advanced' && (
                    <AdvancedMode
                      config={advancedConfig}
                      onChange={setAdvancedConfig}
                      hardware={hardware}
                    />
                  )}
                </div>

                {/* Pre-Flight Estimate Card */}
                <EstimateBadge estimate={estimate} isLoading={isEstimating} />

                {/* Action Controls */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={handleStartCompression}
                    disabled={isEncoding || isAnalyzing}
                    className="btn-aperture-trigger flex-1 py-4 px-6 rounded-2xl text-sm font-bold tracking-tight disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center space-x-2.5 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Initialize Compression</span>
                  </button>

                  <button
                    onClick={handleAddToQueue}
                    disabled={isEncoding || isAnalyzing}
                    className="px-5 py-4 rounded-2xl bg-void-900 hover:bg-void-850 border border-white/10 hover:border-prism-cyan/40 text-slate-200 text-xs font-semibold transition-all shadow-glass-rim flex items-center space-x-2 disabled:opacity-40"
                    title="Add to batch queue"
                  >
                    <Layers className="w-4 h-4 text-prism-cyan" />
                    <span className="hidden sm:inline">Add to Queue</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Real-Time Telemetry & Outcomes (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Real-time Progress Monitor (when encoding) */}
            {isEncoding && progress && (
              <EncodingProgress
                progress={progress}
                onCancel={handleCancelJob}
                isCancelling={isCancelling}
              />
            )}

            {/* Result Card (when completed) */}
            {result && (
              <ResultCard
                result={result}
                onCompare={() => setIsCompareOpen(true)}
                onReset={handleClear}
                onRevealFolder={handleRevealFolder}
              />
            )}

            {/* Idle Placeholder when no active encoding or result */}
            {!isEncoding && !result && (
              <div className="studio-card rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px] border border-white/[0.06] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial from-prism-cyan/[0.04] via-transparent to-transparent pointer-events-none" />

                <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-void-900 border border-white/10 shadow-glass-rim">
                  <Sparkles className="w-7 h-7 text-prism-cyan/80" />
                  <div className="absolute inset-0 rounded-2xl border border-prism-cyan/20 animate-pulse" />
                </div>

                <div className="relative z-10 max-w-xs">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Studio Telemetry & Monitoring Deck
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Select a target media file and compression profile. Live encoding FPS, real-time bitrate metrics, and dual-frame video comparison will render here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Interactive Video Compare Modal */}
      {isCompareOpen && result && metadata && (
        <VideoCompareModal
          originalPath={result.sourceFilePath}
          compressedPath={result.outputFilePath}
          onClose={() => setIsCompareOpen(false)}
        />
      )}

      {/* Batch Processing Queue Drawer */}
      <BatchQueueView
        queue={queue}
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        onStartQueue={() => {
          fetch('/api/queue/start', { method: 'POST' }).then(() => fetchQueue());
        }}
        onPauseQueue={() => {
          fetch('/api/queue/pause', { method: 'POST' }).then(() => fetchQueue());
        }}
        onCancelJob={(id) => {
          fetch(`/api/queue/${id}/cancel`, { method: 'POST' }).then(() => fetchQueue());
        }}
        onRemoveJob={(id) => {
          fetch(`/api/queue/${id}`, { method: 'DELETE' }).then(() => fetchQueue());
        }}
        onClearCompleted={() => {
          fetchQueue();
        }}
      />
    </div>
  );
};
