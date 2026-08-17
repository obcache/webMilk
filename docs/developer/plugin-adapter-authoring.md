# Plug-In Adapter Authoring

## Purpose

webMilk plug-ins should be describable by metadata and driven by generic frame requests. A host application such as Vizmatic should not need to know ProjectM-specific APIs to render a plug-in layer.

webMilk is intentionally aimed at React and modern browser/Electron renderer environments. Adapter contracts should remain clean TypeScript, but they do not need to preserve compatibility with older or non-React application frameworks.

The intended host flow is:

1. Load a plug-in definition JSON file.
2. Present available plug-ins and presets from that JSON.
3. Send frame requests containing only plug-in id, preset id, timestamp, dimensions, FPS, and optional audio.
4. Let webMilk resolve the runtime adapter and manage state.

## Definition File Shape

```ts
type WebMilkPluginDefinitionsFile = {
  version: 1;
  plugins: WebMilkPluginDefinition[];
};

type WebMilkPluginDefinition = {
  id: string;
  displayName: string;
  runtime: 'projectm-wasm-webgl2';
  stateModel: 'stateless' | 'stateful';
  wasmModuleUrl?: string;
  wasmBinaryUrl?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultFps?: number;
  warmupSeconds?: number;
  textureSearchPaths?: string[];
  presets: WebMilkPluginPresetDefinition[];
};

type WebMilkPluginPresetDefinition = {
  id: string;
  displayName: string;
  dataUrl?: string;
  inlineData?: string;
};
```

Example:

```json
{
  "version": 1,
  "plugins": [
    {
      "id": "projectm",
      "displayName": "ProjectM",
      "runtime": "projectm-wasm-webgl2",
      "stateModel": "stateful",
      "wasmModuleUrl": "/vendor/projectm/webmilk-projectm.js",
      "wasmBinaryUrl": "/vendor/projectm/webmilk-projectm.wasm",
      "defaultWidth": 1920,
      "defaultHeight": 1080,
      "defaultFps": 60,
      "warmupSeconds": 3,
      "presets": [
        {
          "id": "preset-one",
          "displayName": "Preset One",
          "dataUrl": "/presets/preset-one.milk"
        }
      ]
    }
  ]
}
```

## Frame Request Shape

```ts
type WebMilkPluginFrameRequest = {
  pluginId: string;
  presetId: string;
  timeSec: number;
  width?: number;
  height?: number;
  fps?: number;
  forceReset?: boolean;
  warmupSeconds?: number;
  audio?: {
    sampleRate: number;
    channels: Float32Array[];
  };
};
```

This is intentionally close to what Vizmatic can send from a Plug-In layer without exposing adapter internals.

## Host Integration Pattern

```ts
const runner = createWebMilkPluginRunner({
  definitions,
  canvas,
  resolveBackendFactory: ({ plugin }) => {
    if (plugin.runtime === 'projectm-wasm-webgl2') {
      return new WasmProjectMBackendFactory({ moduleFactory });
    }
    throw new Error(`Unsupported runtime: ${plugin.runtime}`);
  },
});

await runner.renderFrame({
  pluginId: 'projectm',
  presetId: 'preset-one',
  timeSec: frameIndex / 60,
  width: 1920,
  height: 1080,
  fps: 60,
  audio,
});
```

## Writing Another Adapter

A new adapter needs three layers:

1. A metadata value for `runtime`, for example `myengine-wasm-webgl2`.
2. A backend factory implementing `ProjectMBackendFactory`-compatible behavior:
   - create renderer instance
   - load preset
   - set size
   - set FPS
   - render one timestamped frame
   - reset/dispose state
3. A resolver branch in the host app that maps the `runtime` string to the adapter factory.

The host-facing JSON should remain generic. If a plug-in needs adapter-specific settings, add metadata fields that are safe for a host app to pass without knowing private implementation details.

## Stateful Runtime Rule

If `stateModel` is `stateful`, the adapter should support:

- continuous forward rendering without reset
- reset on backward seek
- warm-up from `max(0, requestedTime - warmupSeconds)`
- deterministic explicit `timeSec` rendering where the underlying engine allows it

ProjectM uses this path.

## Stateless Runtime Rule

If `stateModel` is `stateless`, the adapter should be able to render the requested timestamp directly without warm-up. The same frame request shape still applies.
