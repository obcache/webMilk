import { describe, expect, it } from 'vitest';
import { MockProjectMBackendFactory } from '../backends/mockProjectMBackend';
import { createSineWaveAudio } from '../core/audio';
import { createWebMilkPluginRunner } from './pluginRunner';
import type { WebMilkPluginDefinitionsFile } from './definitions';

const definitions: WebMilkPluginDefinitionsFile = {
  version: 1,
  plugins: [
    {
      id: 'projectm',
      displayName: 'ProjectM',
      runtime: 'projectm-wasm-webgl2',
      stateModel: 'stateful',
      wasmModuleUrl: '/vendor/projectm/webmilk-projectm.js',
      wasmBinaryUrl: '/vendor/projectm/webmilk-projectm.wasm',
      defaultWidth: 640,
      defaultHeight: 360,
      defaultFps: 60,
      warmupSeconds: 2,
      presets: [
        {
          id: 'inline-smoke',
          displayName: 'Inline Smoke Preset',
          inlineData: '[preset]',
        },
      ],
    },
  ],
};

describe('createWebMilkPluginRunner', () => {
  it('creates and reuses a projector from plugin definitions and frame requests', async () => {
    const backendFactory = new MockProjectMBackendFactory();
    const runner = createWebMilkPluginRunner({
      definitions,
      canvas: document.createElement('canvas'),
      resolveBackendFactory: () => backendFactory,
    });

    await runner.renderFrame({
      pluginId: 'projectm',
      presetId: 'inline-smoke',
      timeSec: 1,
      audio: createSineWaveAudio({ durationSec: 2 }),
    });
    await runner.renderFrame({
      pluginId: 'projectm',
      presetId: 'inline-smoke',
      timeSec: 1 + (1 / 60),
    });

    expect(backendFactory.instances).toHaveLength(1);
    expect(backendFactory.instances[0]?.preset?.data).toBe('[preset]');
    expect(backendFactory.instances[0]?.frames.at(-1)?.timeSec).toBe(1.016666667);
  });

  it('recreates the projector when preset changes', async () => {
    const backendFactory = new MockProjectMBackendFactory();
    const localDefinitions: WebMilkPluginDefinitionsFile = {
      version: 1,
      plugins: [
        {
          ...definitions.plugins[0]!,
          presets: [
            { id: 'a', displayName: 'A', inlineData: '[a]' },
            { id: 'b', displayName: 'B', inlineData: '[b]' },
          ],
        },
      ],
    };
    const runner = createWebMilkPluginRunner({
      definitions: localDefinitions,
      canvas: document.createElement('canvas'),
      resolveBackendFactory: () => backendFactory,
    });

    await runner.renderFrame({ pluginId: 'projectm', presetId: 'a', timeSec: 0 });
    await runner.renderFrame({ pluginId: 'projectm', presetId: 'b', timeSec: 0 });

    expect(backendFactory.instances).toHaveLength(2);
    expect(backendFactory.instances[0]?.disposed).toBe(true);
    expect(backendFactory.instances[1]?.preset?.data).toBe('[b]');
  });

  it('throws clear errors for unknown plugin or preset ids', async () => {
    const runner = createWebMilkPluginRunner({
      definitions,
      canvas: document.createElement('canvas'),
      resolveBackendFactory: () => new MockProjectMBackendFactory(),
    });

    await expect(runner.renderFrame({ pluginId: 'missing', presetId: 'inline-smoke', timeSec: 0 }))
      .rejects
      .toThrow('Unknown webMilk plug-in');
    await expect(runner.renderFrame({ pluginId: 'projectm', presetId: 'missing', timeSec: 0 }))
      .rejects
      .toThrow('Unknown preset');
  });
});
