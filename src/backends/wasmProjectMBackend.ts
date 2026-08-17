import type {
  ProjectMBackend,
  ProjectMBackendCreateOptions,
  ProjectMBackendFactory,
  ProjectMBackendFrameInput,
  WebMilkCanvas,
  WebMilkPresetInput,
} from '../core/types';
import {
  channelLayoutToProjectMValue,
  resolveProjectMWasmModule,
  type ProjectMHandle,
  type ProjectMWasmModuleFactory,
  type ResolvedProjectMWasmModule,
} from './projectMExports';

export interface WasmProjectMBackendFactoryOptions {
  moduleFactory: ProjectMWasmModuleFactory;
}

const textEncoder = new TextEncoder();
let generatedCanvasId = 0;

const ensureEmscriptenCanvasSelector = (canvas: WebMilkCanvas): string => {
  if (typeof HTMLCanvasElement === 'undefined' || !(canvas instanceof HTMLCanvasElement)) {
    throw new Error('ProjectM WASM currently requires an HTMLCanvasElement so Emscripten can create a current WebGL2 context.');
  }

  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(canvas.id)) {
    generatedCanvasId += 1;
    canvas.id = `webmilk-projectm-canvas-${generatedCanvasId}`;
  }

  return `#${canvas.id}`;
};

const allocateBytes = (module: ResolvedProjectMWasmModule, bytes: Uint8Array): number => {
  const ptr = module._malloc(bytes.byteLength);
  if (!ptr) throw new Error(`ProjectM WASM malloc failed for ${bytes.byteLength} bytes.`);
  module.HEAPU8.set(bytes, ptr);
  return ptr;
};

const allocateUtf8 = (module: ResolvedProjectMWasmModule, value: string): number => {
  const encoded = textEncoder.encode(`${value}\0`);
  return allocateBytes(module, encoded);
};

const allocateFloat32 = (module: ResolvedProjectMWasmModule, value: Float32Array): number => {
  const ptr = module._malloc(value.byteLength);
  if (!ptr) throw new Error(`ProjectM WASM malloc failed for ${value.byteLength} bytes.`);
  module.HEAPF32.set(value, ptr / Float32Array.BYTES_PER_ELEMENT);
  return ptr;
};

const loadPresetData = async (input: WebMilkPresetInput): Promise<string> => {
  if (typeof input.data === 'string') return input.data;
  if (!input.url) throw new Error('ProjectM preset input requires either data or url.');
  const response = await fetch(input.url);
  if (!response.ok) throw new Error(`Failed to load ProjectM preset: ${response.status} ${response.statusText}`);
  return response.text();
};

const initializeProjectMWebGL = (
  module: ResolvedProjectMWasmModule,
  options: ProjectMBackendCreateOptions,
): void => {
  const initWebGLContext = module.projectm_init_webgl_context;
  if (typeof initWebGLContext !== 'function') {
    throw new Error('ProjectM WASM module is missing the webMilk WebGL context initializer.');
  }

  const selector = ensureEmscriptenCanvasSelector(options.canvas);
  const selectorPtr = allocateUtf8(module, selector);
  try {
    const contextHandleOrError = initWebGLContext(selectorPtr, options.width, options.height);
    if (contextHandleOrError <= 0) {
      throw new Error(`ProjectM WASM failed to initialize a WebGL2 context for ${selector} (${contextHandleOrError}).`);
    }
  } finally {
    module._free(selectorPtr);
  }
};

export class WasmProjectMBackend implements ProjectMBackend {
  readonly canvas: WebMilkCanvas;
  private module: ResolvedProjectMWasmModule;
  private instance: ProjectMHandle;
  private disposed = false;
  private currentPreset: WebMilkPresetInput | null = null;
  width: number;
  height: number;
  fps: number;

  constructor(module: ResolvedProjectMWasmModule, options: ProjectMBackendCreateOptions) {
    this.module = module;
    this.canvas = options.canvas;
    this.width = options.width;
    this.height = options.height;
    this.fps = options.fps;
    this.instance = this.module.projectm_create();
    if (!this.instance) throw new Error('ProjectM WASM failed to create an instance.');
    this.module.projectm_set_window_size(this.instance, this.width, this.height);
    this.module.projectm_set_fps(this.instance, this.fps);
    this.module.projectm_set_preset_locked(this.instance, true);
    this.module.projectm_set_preset_start_clean(this.instance, true);
  }

  async loadPreset(input: WebMilkPresetInput): Promise<void> {
    this.assertAlive();
    const presetData = await loadPresetData(input);
    const ptr = allocateUtf8(this.module, presetData);
    try {
      this.module.projectm_load_preset_data(this.instance, ptr, !!input.smoothTransition);
      this.currentPreset = input;
    } finally {
      this.module._free(ptr);
    }
  }

  setSize(width: number, height: number): void {
    this.assertAlive();
    this.width = width;
    this.height = height;
    this.module.projectm_set_window_size(this.instance, width, height);
  }

  setFps(fps: number): void {
    this.assertAlive();
    this.fps = fps;
    this.module.projectm_set_fps(this.instance, fps);
  }

  async reset(options?: { presetStartClean?: boolean }): Promise<void> {
    this.assertAlive();
    this.module.projectm_destroy(this.instance);
    this.instance = this.module.projectm_create();
    if (!this.instance) throw new Error('ProjectM WASM failed to recreate an instance.');
    this.module.projectm_set_window_size(this.instance, this.width, this.height);
    this.module.projectm_set_fps(this.instance, this.fps);
    this.module.projectm_set_preset_locked(this.instance, true);
    this.module.projectm_set_preset_start_clean(this.instance, options?.presetStartClean !== false);
    if (this.currentPreset) await this.loadPreset(this.currentPreset);
  }

  async renderFrame(input: ProjectMBackendFrameInput): Promise<void> {
    this.assertAlive();
    if (input.audioChunk && input.audioChunk.length > 0) {
      const channelCount = input.channelLayout === 'stereo' ? 2 : 1;
      const sampleCountPerChannel = Math.floor(input.audioChunk.length / channelCount);
      const ptr = allocateFloat32(this.module, input.audioChunk);
      try {
        this.module.projectm_pcm_add_float(
          this.instance,
          ptr,
          sampleCountPerChannel,
          channelLayoutToProjectMValue(channelCount),
        );
      } finally {
        this.module._free(ptr);
      }
    }

    this.module.projectm_set_frame_time(this.instance, input.timeSec);
    this.module.projectm_opengl_render_frame(this.instance);
  }

  dispose(): void {
    if (this.disposed) return;
    this.module.projectm_destroy(this.instance);
    this.disposed = true;
  }

  private assertAlive(): void {
    if (this.disposed) throw new Error('ProjectM WASM backend has been disposed.');
  }
}

export class WasmProjectMBackendFactory implements ProjectMBackendFactory {
  private moduleFactory: ProjectMWasmModuleFactory;

  constructor(options: WasmProjectMBackendFactoryOptions) {
    this.moduleFactory = options.moduleFactory;
  }

  async create(options: ProjectMBackendCreateOptions): Promise<ProjectMBackend> {
    const rawModule = await this.moduleFactory({
      canvas: options.canvas,
      wasmUrl: options.wasmUrl,
    });
    const module = resolveProjectMWasmModule(rawModule);
    initializeProjectMWebGL(module, options);
    return new WasmProjectMBackend(module, options);
  }
}
