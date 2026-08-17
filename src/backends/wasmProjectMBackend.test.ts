import { describe, expect, it } from 'vitest';
import { WasmProjectMBackend } from './wasmProjectMBackend';
import type { ResolvedProjectMWasmModule } from './projectMExports';

const makeFakeModule = () => {
  const calls: Array<{ name: string; args: unknown[] }> = [];
  let nextPtr = 8;
  let nextHandle = 100;
  const freed: number[] = [];
  const heapBuffer = new ArrayBuffer(1024 * 1024);
  const module: ResolvedProjectMWasmModule = {
    HEAPU8: new Uint8Array(heapBuffer),
    HEAPF32: new Float32Array(heapBuffer),
    _malloc(byteLength: number) {
      const ptr = nextPtr;
      nextPtr += byteLength + (8 - (byteLength % 8));
      calls.push({ name: '_malloc', args: [byteLength, ptr] });
      return ptr;
    },
    _free(ptr: number) {
      freed.push(ptr);
      calls.push({ name: '_free', args: [ptr] });
    },
    projectm_create() {
      const handle = nextHandle;
      nextHandle += 1;
      calls.push({ name: 'projectm_create', args: [handle] });
      return handle;
    },
    projectm_destroy(instance: number) {
      calls.push({ name: 'projectm_destroy', args: [instance] });
    },
    projectm_load_preset_data(instance: number, presetDataPtr: number, smoothTransition: boolean) {
      calls.push({ name: 'projectm_load_preset_data', args: [instance, presetDataPtr, smoothTransition] });
    },
    projectm_set_window_size(instance: number, width: number, height: number) {
      calls.push({ name: 'projectm_set_window_size', args: [instance, width, height] });
    },
    projectm_set_fps(instance: number, fps: number) {
      calls.push({ name: 'projectm_set_fps', args: [instance, fps] });
    },
    projectm_set_frame_time(instance: number, secondsSinceFirstFrame: number) {
      calls.push({ name: 'projectm_set_frame_time', args: [instance, secondsSinceFirstFrame] });
    },
    projectm_set_preset_locked(instance: number, enabled: boolean) {
      calls.push({ name: 'projectm_set_preset_locked', args: [instance, enabled] });
    },
    projectm_set_preset_start_clean(instance: number, enabled: boolean) {
      calls.push({ name: 'projectm_set_preset_start_clean', args: [instance, enabled] });
    },
    projectm_pcm_add_float(instance: number, samplesPtr: number, sampleCount: number, channels: 1 | 2) {
      calls.push({ name: 'projectm_pcm_add_float', args: [instance, samplesPtr, sampleCount, channels] });
    },
    projectm_opengl_render_frame(instance: number) {
      calls.push({ name: 'projectm_opengl_render_frame', args: [instance] });
    },
    projectm_opengl_render_frame_fbo(instance: number, framebufferObjectId: number) {
      calls.push({ name: 'projectm_opengl_render_frame_fbo', args: [instance, framebufferObjectId] });
    },
  };
  return { module, calls, freed };
};

describe('WasmProjectMBackend', () => {
  it('initializes a ProjectM instance with size, fps, and deterministic preset settings', () => {
    const { module, calls } = makeFakeModule();

    new WasmProjectMBackend(module, {
      canvas: document.createElement('canvas'),
      width: 1920,
      height: 1080,
      fps: 60,
    });

    expect(calls.map((call) => call.name)).toEqual([
      'projectm_create',
      'projectm_set_window_size',
      'projectm_set_fps',
      'projectm_set_preset_locked',
      'projectm_set_preset_start_clean',
    ]);
  });

  it('loads preset text into WASM memory and frees it after ProjectM receives it', async () => {
    const { module, calls, freed } = makeFakeModule();
    const backend = new WasmProjectMBackend(module, {
      canvas: document.createElement('canvas'),
      width: 1280,
      height: 720,
      fps: 60,
    });

    await backend.loadPreset({ data: '[preset]', smoothTransition: false });

    const loadCall = calls.find((call) => call.name === 'projectm_load_preset_data');
    expect(loadCall).toBeTruthy();
    expect(freed).toContain(loadCall?.args[1]);
  });

  it('passes stereo PCM sample count per channel and renders at explicit frame time', async () => {
    const { module, calls } = makeFakeModule();
    const backend = new WasmProjectMBackend(module, {
      canvas: document.createElement('canvas'),
      width: 1280,
      height: 720,
      fps: 60,
    });

    await backend.renderFrame({
      timeSec: 2.5,
      channelLayout: 'stereo',
      audioChunk: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]),
    });

    const pcmCall = calls.find((call) => call.name === 'projectm_pcm_add_float');
    expect(pcmCall?.args.slice(2)).toEqual([3, 2]);
    expect(calls.find((call) => call.name === 'projectm_set_frame_time')?.args[1]).toBe(2.5);
    expect(calls.at(-1)?.name).toBe('projectm_opengl_render_frame');
  });

  it('recreates the instance and reloads the current preset on reset', async () => {
    const { module, calls } = makeFakeModule();
    const backend = new WasmProjectMBackend(module, {
      canvas: document.createElement('canvas'),
      width: 1280,
      height: 720,
      fps: 60,
    });

    await backend.loadPreset({ data: '[preset]' });
    await backend.reset();

    expect(calls.filter((call) => call.name === 'projectm_create')).toHaveLength(2);
    expect(calls.filter((call) => call.name === 'projectm_destroy')).toHaveLength(1);
    expect(calls.filter((call) => call.name === 'projectm_load_preset_data')).toHaveLength(2);
  });
});
