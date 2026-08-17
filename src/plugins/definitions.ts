import type { ProjectMBackendFactory, WebMilkAudioBuffer, WebMilkCanvas, WebMilkPresetInput } from '../core/types';

export type WebMilkPluginRuntime = 'projectm-wasm-webgl2';
export type WebMilkPluginStateModel = 'stateless' | 'stateful';

export interface WebMilkPluginPresetDefinition {
  id: string;
  displayName: string;
  dataUrl?: string;
  inlineData?: string;
}

export interface WebMilkPluginDefinition {
  id: string;
  displayName: string;
  runtime: WebMilkPluginRuntime;
  stateModel: WebMilkPluginStateModel;
  wasmModuleUrl?: string;
  wasmBinaryUrl?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultFps?: number;
  warmupSeconds?: number;
  textureSearchPaths?: string[];
  presets: WebMilkPluginPresetDefinition[];
}

export interface WebMilkPluginDefinitionsFile {
  version: 1;
  plugins: WebMilkPluginDefinition[];
}

export interface WebMilkPluginFrameRequest {
  pluginId: string;
  presetId: string;
  timeSec: number;
  width?: number;
  height?: number;
  fps?: number;
  forceReset?: boolean;
  warmupSeconds?: number;
  audio?: WebMilkAudioBuffer;
}

export interface WebMilkPluginBackendFactoryResolverContext {
  plugin: WebMilkPluginDefinition;
  canvas: WebMilkCanvas;
}

export type WebMilkPluginBackendFactoryResolver = (
  context: WebMilkPluginBackendFactoryResolverContext,
) => ProjectMBackendFactory;

export const findPluginDefinition = (
  definitions: WebMilkPluginDefinitionsFile,
  pluginId: string,
): WebMilkPluginDefinition => {
  const plugin = definitions.plugins.find((candidate) => candidate.id === pluginId);
  if (!plugin) throw new Error(`Unknown webMilk plug-in: ${pluginId}`);
  return plugin;
};

export const findPresetDefinition = (
  plugin: WebMilkPluginDefinition,
  presetId: string,
): WebMilkPluginPresetDefinition => {
  const preset = plugin.presets.find((candidate) => candidate.id === presetId);
  if (!preset) throw new Error(`Unknown preset "${presetId}" for plug-in "${plugin.id}".`);
  return preset;
};

export const presetDefinitionToInput = async (
  preset: WebMilkPluginPresetDefinition,
): Promise<WebMilkPresetInput> => {
  if (typeof preset.inlineData === 'string') return { data: preset.inlineData };
  if (!preset.dataUrl) throw new Error(`Preset "${preset.id}" has no inlineData or dataUrl.`);
  return { url: preset.dataUrl };
};
