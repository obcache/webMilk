export type ProjectMHandle = number;

export type ProjectMChannelLayoutValue = 1 | 2;

export interface ProjectMWasmExports {
  projectm_create(): ProjectMHandle;
  projectm_destroy(instance: ProjectMHandle): void;
  projectm_load_preset_data(instance: ProjectMHandle, presetDataPtr: number, smoothTransition: boolean): void;
  projectm_set_window_size(instance: ProjectMHandle, width: number, height: number): void;
  projectm_set_fps(instance: ProjectMHandle, fps: number): void;
  projectm_set_frame_time(instance: ProjectMHandle, secondsSinceFirstFrame: number): void;
  projectm_set_preset_locked(instance: ProjectMHandle, enabled: boolean): void;
  projectm_set_preset_start_clean(instance: ProjectMHandle, enabled: boolean): void;
  projectm_pcm_add_float(
    instance: ProjectMHandle,
    samplesPtr: number,
    sampleCount: number,
    channels: ProjectMChannelLayoutValue,
  ): void;
  projectm_opengl_render_frame(instance: ProjectMHandle): void;
  projectm_opengl_render_frame_fbo(instance: ProjectMHandle, framebufferObjectId: number): void;
}

export interface ProjectMWasmMemoryHelpers {
  HEAPU8: Uint8Array;
  HEAPF32: Float32Array;
  _malloc(byteLength: number): number;
  _free(ptr: number): void;
}

export interface ProjectMWasmModule extends ProjectMWasmMemoryHelpers {
  ccall?: (...args: unknown[]) => unknown;
  cwrap?: (...args: unknown[]) => unknown;
}

export type ProjectMWasmModuleFactory = (options: {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  wasmUrl?: string;
}) => Promise<ProjectMWasmModule & Partial<ProjectMWasmExports>>;

export const channelLayoutToProjectMValue = (channelCount: number): ProjectMChannelLayoutValue => (
  channelCount <= 1 ? 1 : 2
);
