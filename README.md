# webMilk

webMilk is a browser-native ProjectM projector framework for React and modern web applications.

The goal is to expose ProjectM's WebGL2/WASM rendering through a small, reusable TypeScript API that handles ProjectM's stateful rendering model without forcing application developers to manage preset history, seek warm-up, or render-loop continuity themselves.

## Current Status

- Version: 0.1.0
- Stage: initial scaffold / ProjectM backend integration pending
- Runtime target: browser, Electron renderer, and other WebGL2-capable environments

## Design Goals

- Prioritize React and modern browser/Electron renderer consumers.
- Keep low-level runtime code reusable where it costs little, but do not optimize for legacy or non-React framework interoperability.
- Provide React adapters as first-class public ergonomics over the runtime.
- Render ProjectM output into a supplied `HTMLCanvasElement` or `OffscreenCanvas`.
- Use explicit frame timestamps for deterministic preview/export workflows.
- Preserve ProjectM state during continuous playback.
- Rebuild the minimum necessary context history after seeks or discontinuities.

## Planned Runtime Contract

```ts
const projector = await createWebMilkProjector({
  backend,
  canvas,
  width: 1920,
  height: 1080,
  fps: 60,
  warmupSeconds: 3,
});

await projector.loadPreset({ data: presetText });
await projector.renderFrame({
  timeSec: 42.5,
  audio: decodedAudio,
});
```

## Development

```powershell
npm install
npm run typecheck
npm run test
npm run build
npm run dev
```

Project workflow files live under `docs/` and reusable automation lives under `tools/project-mgmt/`.

```powershell
npm run todo
npm run ledger:message
npm run handoff
npm run version:show
```

## License

Project license is not finalized.

Important: ProjectM is LGPL, and preset/texture packs have separate licensing. Public distribution must preserve those obligations before bundling compiled ProjectM artifacts or preset packs.
