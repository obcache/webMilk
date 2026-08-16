import { getAudioChunk } from './audio';
import { buildFramePlan } from './framePlanner';
import type {
  ProjectMBackend,
  WebMilkPresetInput,
  WebMilkProjector,
  WebMilkProjectorOptions,
  WebMilkRenderFrameOptions,
} from './types';

export class StatefulWebMilkProjector implements WebMilkProjector {
  private backend: ProjectMBackend;
  private warmupSeconds: number;
  private seekToleranceSeconds: number;
  private maxFastForwardFrames: number;
  private disposed = false;
  private lastTimeSec: number | null = null;

  private constructor(backend: ProjectMBackend, options: WebMilkProjectorOptions) {
    this.backend = backend;
    this.warmupSeconds = options.warmupSeconds ?? 3;
    this.seekToleranceSeconds = options.seekToleranceSeconds ?? (1.5 / options.fps);
    this.maxFastForwardFrames = options.maxFastForwardFrames ?? 3;
  }

  static async create(options: WebMilkProjectorOptions): Promise<StatefulWebMilkProjector> {
    const backend = await options.backend.create(options);
    return new StatefulWebMilkProjector(backend, options);
  }

  get canvas() {
    return this.backend.canvas;
  }

  get width() {
    return this.backend.width;
  }

  get height() {
    return this.backend.height;
  }

  get fps() {
    return this.backend.fps;
  }

  get lastRenderedTimeSec() {
    return this.lastTimeSec;
  }

  async loadPreset(input: WebMilkPresetInput): Promise<void> {
    this.assertAlive();
    await this.backend.loadPreset(input);
    this.lastTimeSec = null;
  }

  setSize(width: number, height: number): void {
    this.assertAlive();
    this.backend.setSize(width, height);
    this.lastTimeSec = null;
  }

  setFps(fps: number): void {
    this.assertAlive();
    this.backend.setFps(fps);
    this.lastTimeSec = null;
  }

  async reset(options?: { presetStartClean?: boolean }): Promise<void> {
    this.assertAlive();
    await this.backend.reset(options);
    this.lastTimeSec = null;
  }

  async renderFrame(options: WebMilkRenderFrameOptions): Promise<void> {
    this.assertAlive();
    const plan = buildFramePlan({
      targetTimeSec: options.timeSec,
      previousTimeSec: this.lastTimeSec,
      fps: this.backend.fps,
      warmupSeconds: options.warmupSeconds ?? this.warmupSeconds,
      seekToleranceSeconds: this.seekToleranceSeconds,
      maxFastForwardFrames: this.maxFastForwardFrames,
      forceReset: options.forceReset,
    });

    if (plan.reset) await this.backend.reset({ presetStartClean: true });

    let previousTime = plan.reset ? plan.startTimeSec : (this.lastTimeSec ?? 0);
    for (const timeSec of plan.hiddenWarmupTimesSec) {
      const { chunk, channelLayout } = getAudioChunk(options.audio, previousTime, timeSec);
      await this.backend.renderFrame({ timeSec, audioChunk: chunk, channelLayout });
      previousTime = timeSec;
    }

    for (const timeSec of plan.displayTimesSec) {
      const { chunk, channelLayout } = getAudioChunk(options.audio, previousTime, timeSec);
      await this.backend.renderFrame({ timeSec, audioChunk: chunk, channelLayout });
      previousTime = timeSec;
      this.lastTimeSec = timeSec;
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.backend.dispose();
    this.disposed = true;
  }

  private assertAlive(): void {
    if (this.disposed) throw new Error('webMilk projector has been disposed.');
  }
}

export const createWebMilkProjector = (options: WebMilkProjectorOptions): Promise<WebMilkProjector> => (
  StatefulWebMilkProjector.create(options)
);
