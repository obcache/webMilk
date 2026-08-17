export type ProjectMHandle = number;

export type ProjectMChannelLayoutValue = 1 | 2;

export interface ProjectMWasmExports {
  projectm_pcm_get_max_samples?(): number;
  projectm_init_webgl_context?(canvasSelectorPtr: number, width: number, height: number): number;
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

export type ResolvedProjectMWasmModule = ProjectMWasmModule & ProjectMWasmExports;

export const channelLayoutToProjectMValue = (channelCount: number): ProjectMChannelLayoutValue => (
  channelCount <= 1 ? 1 : 2
);

const requiredFunctionNames = [
  'projectm_create',
  'projectm_destroy',
  'projectm_load_preset_data',
  'projectm_set_window_size',
  'projectm_set_fps',
  'projectm_set_frame_time',
  'projectm_set_preset_locked',
  'projectm_set_preset_start_clean',
  'projectm_pcm_add_float',
  'projectm_opengl_render_frame',
] as const;

const optionalFunctionNames = [
  'projectm_init_webgl_context',
] as const;

const webMilkExportAliases: Record<typeof requiredFunctionNames[number], string> = {
  projectm_create: 'webmilk_projectm_create',
  projectm_destroy: 'webmilk_projectm_destroy',
  projectm_load_preset_data: 'webmilk_projectm_load_preset_data',
  projectm_set_window_size: 'webmilk_projectm_set_window_size',
  projectm_set_fps: 'webmilk_projectm_set_fps',
  projectm_set_frame_time: 'webmilk_projectm_set_frame_time',
  projectm_set_preset_locked: 'webmilk_projectm_set_preset_locked',
  projectm_set_preset_start_clean: 'webmilk_projectm_set_preset_start_clean',
  projectm_pcm_add_float: 'webmilk_projectm_pcm_add_float',
  projectm_opengl_render_frame: 'webmilk_projectm_opengl_render_frame',
};

const optionalWebMilkExportAliases: Record<typeof optionalFunctionNames[number], string> = {
  projectm_init_webgl_context: 'webmilk_projectm_init_webgl_context',
};

const cwrapSignatures: Record<typeof requiredFunctionNames[number], { returnType: string | null; argTypes: string[] }> = {
  projectm_create: { returnType: 'number', argTypes: [] },
  projectm_destroy: { returnType: null, argTypes: ['number'] },
  projectm_load_preset_data: { returnType: null, argTypes: ['number', 'number', 'number'] },
  projectm_set_window_size: { returnType: null, argTypes: ['number', 'number', 'number'] },
  projectm_set_fps: { returnType: null, argTypes: ['number', 'number'] },
  projectm_set_frame_time: { returnType: null, argTypes: ['number', 'number'] },
  projectm_set_preset_locked: { returnType: null, argTypes: ['number', 'number'] },
  projectm_set_preset_start_clean: { returnType: null, argTypes: ['number', 'number'] },
  projectm_pcm_add_float: { returnType: null, argTypes: ['number', 'number', 'number', 'number'] },
  projectm_opengl_render_frame: { returnType: null, argTypes: ['number'] },
};

const optionalCwrapSignatures: Record<typeof optionalFunctionNames[number], { returnType: string | null; argTypes: string[] }> = {
  projectm_init_webgl_context: { returnType: 'number', argTypes: ['number', 'number', 'number'] },
};

export const resolveProjectMExport = (
  module: ProjectMWasmModule & Partial<ProjectMWasmExports>,
  functionName: typeof requiredFunctionNames[number],
): ProjectMWasmExports[typeof functionName] => {
  const direct = module[functionName];
  if (typeof direct === 'function') return direct as ProjectMWasmExports[typeof functionName];

  const underscoredName = `_${functionName}`;
  const underscored = (module as unknown as Record<string, unknown>)[underscoredName];
  if (typeof underscored === 'function') return underscored as ProjectMWasmExports[typeof functionName];

  const alias = webMilkExportAliases[functionName];
  const aliasDirect = (module as unknown as Record<string, unknown>)[alias];
  if (typeof aliasDirect === 'function') return aliasDirect as ProjectMWasmExports[typeof functionName];

  const aliasUnderscored = (module as unknown as Record<string, unknown>)[`_${alias}`];
  if (typeof aliasUnderscored === 'function') return aliasUnderscored as ProjectMWasmExports[typeof functionName];

  if (typeof module.cwrap === 'function') {
    const signature = cwrapSignatures[functionName];
    const wrapped = module.cwrap(functionName, signature.returnType, signature.argTypes);
    if (typeof wrapped === 'function') return wrapped as ProjectMWasmExports[typeof functionName];

    const wrappedAlias = module.cwrap(alias, signature.returnType, signature.argTypes);
    if (typeof wrappedAlias === 'function') return wrappedAlias as ProjectMWasmExports[typeof functionName];
  }

  throw new Error(`ProjectM WASM export is missing: ${functionName}`);
};

export const resolveOptionalProjectMExport = (
  module: ProjectMWasmModule & Partial<ProjectMWasmExports>,
  functionName: typeof optionalFunctionNames[number],
): ProjectMWasmExports[typeof functionName] | undefined => {
  const direct = module[functionName];
  if (typeof direct === 'function') return direct as ProjectMWasmExports[typeof functionName];

  const underscored = (module as unknown as Record<string, unknown>)[`_${functionName}`];
  if (typeof underscored === 'function') return underscored as ProjectMWasmExports[typeof functionName];

  const alias = optionalWebMilkExportAliases[functionName];
  const aliasDirect = (module as unknown as Record<string, unknown>)[alias];
  if (typeof aliasDirect === 'function') return aliasDirect as ProjectMWasmExports[typeof functionName];

  const aliasUnderscored = (module as unknown as Record<string, unknown>)[`_${alias}`];
  if (typeof aliasUnderscored === 'function') return aliasUnderscored as ProjectMWasmExports[typeof functionName];

  if (typeof module.cwrap === 'function') {
    const signature = optionalCwrapSignatures[functionName];
    const wrapped = module.cwrap(functionName, signature.returnType, signature.argTypes);
    if (typeof wrapped === 'function') return wrapped as ProjectMWasmExports[typeof functionName];

    const wrappedAlias = module.cwrap(alias, signature.returnType, signature.argTypes);
    if (typeof wrappedAlias === 'function') return wrappedAlias as ProjectMWasmExports[typeof functionName];
  }

  return undefined;
};

export const resolveProjectMWasmModule = (
  module: ProjectMWasmModule & Partial<ProjectMWasmExports>,
): ResolvedProjectMWasmModule => ({
  ...module,
  projectm_init_webgl_context: resolveOptionalProjectMExport(module, 'projectm_init_webgl_context'),
  projectm_create: resolveProjectMExport(module, 'projectm_create') as ProjectMWasmExports['projectm_create'],
  projectm_destroy: resolveProjectMExport(module, 'projectm_destroy') as ProjectMWasmExports['projectm_destroy'],
  projectm_load_preset_data: resolveProjectMExport(module, 'projectm_load_preset_data') as ProjectMWasmExports['projectm_load_preset_data'],
  projectm_set_window_size: resolveProjectMExport(module, 'projectm_set_window_size') as ProjectMWasmExports['projectm_set_window_size'],
  projectm_set_fps: resolveProjectMExport(module, 'projectm_set_fps') as ProjectMWasmExports['projectm_set_fps'],
  projectm_set_frame_time: resolveProjectMExport(module, 'projectm_set_frame_time') as ProjectMWasmExports['projectm_set_frame_time'],
  projectm_set_preset_locked: resolveProjectMExport(module, 'projectm_set_preset_locked') as ProjectMWasmExports['projectm_set_preset_locked'],
  projectm_set_preset_start_clean: resolveProjectMExport(module, 'projectm_set_preset_start_clean') as ProjectMWasmExports['projectm_set_preset_start_clean'],
  projectm_pcm_add_float: resolveProjectMExport(module, 'projectm_pcm_add_float') as ProjectMWasmExports['projectm_pcm_add_float'],
  projectm_opengl_render_frame: resolveProjectMExport(module, 'projectm_opengl_render_frame') as ProjectMWasmExports['projectm_opengl_render_frame'],
  projectm_opengl_render_frame_fbo: (
    typeof module.projectm_opengl_render_frame_fbo === 'function'
      ? module.projectm_opengl_render_frame_fbo
      : typeof (module as unknown as Record<string, unknown>)._projectm_opengl_render_frame_fbo === 'function'
        ? (module as unknown as Record<string, ProjectMWasmExports['projectm_opengl_render_frame_fbo']>)._projectm_opengl_render_frame_fbo
        : typeof (module as unknown as Record<string, unknown>).webmilk_projectm_opengl_render_frame_fbo === 'function'
          ? (module as unknown as Record<string, ProjectMWasmExports['projectm_opengl_render_frame_fbo']>).webmilk_projectm_opengl_render_frame_fbo
          : typeof (module as unknown as Record<string, unknown>)._webmilk_projectm_opengl_render_frame_fbo === 'function'
            ? (module as unknown as Record<string, ProjectMWasmExports['projectm_opengl_render_frame_fbo']>)._webmilk_projectm_opengl_render_frame_fbo
        : (() => {
          throw new Error('ProjectM WASM export is missing: projectm_opengl_render_frame_fbo');
        })
  ),
});
