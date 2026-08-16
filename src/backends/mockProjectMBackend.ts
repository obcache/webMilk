import type {
  ProjectMBackend,
  ProjectMBackendCreateOptions,
  ProjectMBackendFactory,
  ProjectMBackendFrameInput,
  WebMilkCanvas,
  WebMilkPresetInput,
} from '../core/types';

export class MockProjectMBackend implements ProjectMBackend {
  readonly canvas: WebMilkCanvas;
  width: number;
  height: number;
  fps: number;
  frames: ProjectMBackendFrameInput[] = [];
  resets = 0;
  preset: WebMilkPresetInput | null = null;
  disposed = false;

  constructor(options: ProjectMBackendCreateOptions) {
    this.canvas = options.canvas;
    this.width = options.width;
    this.height = options.height;
    this.fps = options.fps;
  }

  async loadPreset(input: WebMilkPresetInput): Promise<void> {
    this.preset = input;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  setFps(fps: number): void {
    this.fps = fps;
  }

  async reset(): Promise<void> {
    this.resets += 1;
  }

  async renderFrame(input: ProjectMBackendFrameInput): Promise<void> {
    this.frames.push(input);
  }

  dispose(): void {
    this.disposed = true;
  }
}

export class MockProjectMBackendFactory implements ProjectMBackendFactory {
  instances: MockProjectMBackend[] = [];

  async create(options: ProjectMBackendCreateOptions): Promise<ProjectMBackend> {
    const backend = new MockProjectMBackend(options);
    this.instances.push(backend);
    return backend;
  }
}
