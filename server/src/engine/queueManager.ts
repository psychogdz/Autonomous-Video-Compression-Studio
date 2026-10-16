import { QueueJob, CompressionJobConfig, EncodingProgress, CompressionOutcome } from '../../../shared/types.js';
import { probeMedia } from './probeService.js';
import { makeCompressionDecision } from './decisionEngine.js';
import { detectHardwareCapabilities } from './hardwareAccel.js';
import { startCompressionJob, cancelCompressionJob } from './encoderService.js';

class QueueManager {
  private queue: QueueJob[] = [];
  private isProcessing = false;
  private isPaused = false;
  private maxConcurrent = 1;
  private activeCount = 0;
  private listeners: Array<(queue: QueueJob[]) => void> = [];

  public getQueue(): QueueJob[] {
    return [...this.queue];
  }

  public subscribe(listener: (queue: QueueJob[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.getQueue()));
  }

  public async addToQueue(filePath: string, customConfig?: Partial<CompressionJobConfig>): Promise<QueueJob> {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const job: QueueJob = {
      id,
      fileName: filePath.split(/[/\\]/).pop() || 'video.mp4',
      filePath,
      fileSizeBytes: 0,
      status: 'probing',
      config: {
        sourceFilePath: filePath,
        mode: customConfig?.mode || 'simple',
        simpleConfig: customConfig?.simpleConfig || { goal: 'balanced', speedPriority: 'balanced' },
        targetSizeConfig: customConfig?.targetSizeConfig,
        advancedConfig: customConfig?.advancedConfig,
      },
      createdAt: Date.now(),
    };

    this.queue.push(job);
    this.notify();

    try {
      const probeData = await probeMedia(filePath);
      job.probeData = probeData;
      job.fileSizeBytes = probeData.fileSizeBytes;
      const hw = await detectHardwareCapabilities();
      const availableEncoders = hw.encoders.filter(e => e.available).map(e => e.id);
      job.estimate = makeCompressionDecision(probeData, job.config, availableEncoders);
      job.status = 'ready';
    } catch (err: any) {
      job.status = 'failed';
      job.error = `Probe failed: ${err.message}`;
    }

    this.notify();
    this.processNext();
    return job;
  }

  public updateJobConfig(jobId: string, newConfig: CompressionJobConfig): boolean {
    const job = this.queue.find(j => j.id === jobId);
    if (!job || job.status === 'encoding') return false;

    job.config = newConfig;
    if (job.probeData) {
      detectHardwareCapabilities().then(hw => {
        const availableEncoders = hw.encoders.filter(e => e.available).map(e => e.id);
        job.estimate = makeCompressionDecision(job.probeData!, newConfig, availableEncoders);
        this.notify();
      });
    }
    this.notify();
    return true;
  }

  public startQueue(): void {
    this.isPaused = false;
    this.processNext();
  }

  public pauseQueue(): void {
    this.isPaused = true;
    this.notify();
  }

  public cancelJob(jobId: string): boolean {
    const job = this.queue.find(j => j.id === jobId);
    if (!job) return false;

    if (job.status === 'encoding') {
      cancelCompressionJob(jobId);
    }
    job.status = 'cancelled';
    this.activeCount = Math.max(0, this.activeCount - 1);
    this.notify();
    this.processNext();
    return true;
  }

  public removeJob(jobId: string): boolean {
    this.cancelJob(jobId);
    const index = this.queue.findIndex(j => j.id === jobId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.notify();
      return true;
    }
    return false;
  }

  public clearCompleted(): void {
    this.queue = this.queue.filter(j => j.status !== 'completed' && j.status !== 'cancelled');
    this.notify();
  }

  private async processNext(): Promise<void> {
    if (this.isPaused || this.activeCount >= this.maxConcurrent) return;

    const nextJob = this.queue.find(j => j.status === 'ready' || j.status === 'pending');
    if (!nextJob) return;

    this.activeCount++;
    nextJob.status = 'encoding';
    nextJob.startedAt = Date.now();
    this.notify();

    try {
      const outcome = await startCompressionJob(nextJob.id, nextJob.config, (prog: EncodingProgress) => {
        nextJob.progress = prog;
        this.notify();
      });

      nextJob.status = 'completed';
      nextJob.result = outcome;
      nextJob.completedAt = Date.now();
    } catch (err: any) {
      if (nextJob.status !== 'cancelled') {
        nextJob.status = 'failed';
        nextJob.error = err.message || 'Compression failed';
      }
    } finally {
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.notify();
      this.processNext();
    }
  }
}

export const queueManager = new QueueManager();
