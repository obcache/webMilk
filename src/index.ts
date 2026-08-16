export { createSineWaveAudio, getAudioChunk } from './core/audio';
export { buildFramePlan } from './core/framePlanner';
export { createWebMilkProjector, StatefulWebMilkProjector } from './core/projector';
export { MockProjectMBackend, MockProjectMBackendFactory } from './backends/mockProjectMBackend';
export { WasmProjectMBackendFactory } from './backends/wasmProjectMBackend';
export { channelLayoutToProjectMValue } from './backends/projectMExports';
export type {
  AudioChannelLayout,
  ProjectMBackend,
  ProjectMBackendCreateOptions,
  ProjectMBackendFactory,
  ProjectMBackendFrameInput,
  WebMilkAudioBuffer,
  WebMilkCanvas,
  WebMilkFramePlan,
  WebMilkPresetInput,
  WebMilkProjector,
  WebMilkProjectorOptions,
  WebMilkRenderFrameOptions,
} from './core/types';
export type {
  ProjectMChannelLayoutValue,
  ProjectMHandle,
  ProjectMWasmExports,
  ProjectMWasmMemoryHelpers,
  ProjectMWasmModule,
  ProjectMWasmModuleFactory,
} from './backends/projectMExports';
