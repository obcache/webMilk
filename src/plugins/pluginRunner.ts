import { createWebMilkProjector } from '../core/projector';
import type { WebMilkCanvas, WebMilkProjector } from '../core/types';
import {
  findPluginDefinition,
  findPresetDefinition,
  presetDefinitionToInput,
  type WebMilkPluginBackendFactoryResolver,
  type WebMilkPluginDefinitionsFile,
  type WebMilkPluginFrameRequest,
} from './definitions';

export interface WebMilkPluginRunnerOptions {
  definitions: WebMilkPluginDefinitionsFile;
  canvas: WebMilkCanvas;
  resolveBackendFactory: WebMilkPluginBackendFactoryResolver;
}

export interface WebMilkPluginRunner {
  renderFrame(request: WebMilkPluginFrameRequest): Promise<void>;
  dispose(): void;
}

type ProjectorCacheEntry = {
  projector: WebMilkProjector;
  pluginId: string;
  presetId: string;
  width: number;
  height: number;
  fps: number;
};

export class StatefulWebMilkPluginRunner implements WebMilkPluginRunner {
  private readonly options: WebMilkPluginRunnerOptions;
  private cache: ProjectorCacheEntry | null = null;

  constructor(options: WebMilkPluginRunnerOptions) {
    this.options = options;
  }

  async renderFrame(request: WebMilkPluginFrameRequest): Promise<void> {
    const plugin = findPluginDefinition(this.options.definitions, request.pluginId);
    const preset = findPresetDefinition(plugin, request.presetId);
    const width = request.width ?? plugin.defaultWidth ?? 1280;
    const height = request.height ?? plugin.defaultHeight ?? 720;
    const fps = request.fps ?? plugin.defaultFps ?? 60;
    const warmupSeconds = request.warmupSeconds ?? plugin.warmupSeconds;

    const cacheHit = this.cache
      && this.cache.pluginId === plugin.id
      && this.cache.presetId === preset.id
      && this.cache.width === width
      && this.cache.height === height
      && this.cache.fps === fps;

    if (!cacheHit) {
      this.cache?.projector.dispose();
      const backend = this.options.resolveBackendFactory({ plugin, canvas: this.options.canvas });
      const projector = await createWebMilkProjector({
        backend,
        canvas: this.options.canvas,
        width,
        height,
        fps,
        wasmUrl: plugin.wasmBinaryUrl,
        textureSearchPaths: plugin.textureSearchPaths,
        warmupSeconds,
      });
      await projector.loadPreset(await presetDefinitionToInput(preset));
      this.cache = {
        projector,
        pluginId: plugin.id,
        presetId: preset.id,
        width,
        height,
        fps,
      };
    }

    const activeCache = this.cache;
    if (!activeCache) throw new Error('webMilk plug-in runner failed to create a projector cache entry.');

    await activeCache.projector.renderFrame({
      timeSec: request.timeSec,
      audio: request.audio,
      warmupSeconds,
      forceReset: request.forceReset,
    });
  }

  dispose(): void {
    this.cache?.projector.dispose();
    this.cache = null;
  }
}

export const createWebMilkPluginRunner = (options: WebMilkPluginRunnerOptions): WebMilkPluginRunner => (
  new StatefulWebMilkPluginRunner(options)
);
