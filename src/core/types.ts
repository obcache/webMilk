export type WebMilkCanvas = HTMLCanvasElement | OffscreenCanvas;

export type AudioChannelLayout = 'mono' | 'stereo';

export interface WebMilkAudioBuffer {
  sampleRate: number;
  channels: Float32Array[];
}

export interface WebMilkPresetInput {
  url?: string;
  data?: string;
  smoothTransition?: boolean;
}

export interface ProjectMBackendCreateOptions {
  canvas: WebMilkCanvas;
  width: number;
  height: number;
  fps: number;
  wasmUrl?: string;
  textureSearchPaths?: string[];
}

export interface ProjectMBackendFrameInput {
  timeSec: number;
  audioChunk?: Float32Array;
  channelLayout?: AudioChannelLayout;
}

export interface ProjectMBackend {
  readonly canvas: WebMilkCanvas;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  loadPreset(input: WebMilkPresetInput): Promise<void>;
  setSize(width: number, height: number): void;
  setFps(fps: number): void;
  reset(options?: { presetStartClean?: boolean }): Promise<void>;
  renderFrame(input: ProjectMBackendFrameInput): Promise<void>;
  dispose(): void;
}

export interface ProjectMBackendFactory {
  create(options: ProjectMBackendCreateOptions): Promise<ProjectMBackend>;
}

export interface WebMilkProjectorOptions extends ProjectMBackendCreateOptions {
  backend: ProjectMBackendFactory;
  warmupSeconds?: number;
  seekToleranceSeconds?: number;
  maxFastForwardFrames?: number;
}

export interface WebMilkRenderFrameOptions {
  timeSec: number;
  audio?: WebMilkAudioBuffer;
  warmupSeconds?: number;
  forceReset?: boolean;
}

export interface WebMilkProjector {
  readonly canvas: WebMilkCanvas;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly lastRenderedTimeSec: number | null;
  loadPreset(input: WebMilkPresetInput): Promise<void>;
  setSize(width: number, height: number): void;
  setFps(fps: number): void;
  renderFrame(options: WebMilkRenderFrameOptions): Promise<void>;
  reset(options?: { presetStartClean?: boolean }): Promise<void>;
  dispose(): void;
}

export interface WebMilkFramePlan {
  reset: boolean;
  startTimeSec: number;
  displayTimesSec: number[];
  hiddenWarmupTimesSec: number[];
}
