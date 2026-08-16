# Project Plan And To-Do

This file is the planning mechanism for active work. Keep it current enough that a new developer or a fresh chat session can understand the next move without reconstructing the whole project history.

## Current Objective

- [ ] Build the first ProjectM WebGL2/WASM projector proof-of-life.
  - Create a framework-agnostic projector runtime.
  - Keep React support as a thin adapter over the runtime.
  - Prove explicit frame-time rendering, audio PCM feed, and warm-up/rebuild behavior before adding higher-level UI.

## Next Actions

- [x] Scaffold TypeScript/Vite library structure.
- [x] Add core projector API and stateful frame planner.
- [x] Add React hook/component adapter.
- [x] Add mock ProjectM backend for tests and demo harness.
- [ ] Build/export ProjectM WASM with the required C API surface.
  - Required export surface documented in `docs/developer/projectm-wasm-plan.md`.
- [ ] Replace the mock backend with a WebGL2/WASM backend implementation.
- [ ] Add one known-good preset fixture and texture fixture.
- [ ] Validate deterministic sequential rendering at 60 FPS timestamps.
- [ ] Validate seek reset plus warm-up behavior.
- [ ] Measure frame cost at 1920x1080 and 1080x1920.

## Backlog

- [ ] Add `captureImageData()` or `readPixels()` helper for automated visual tests.
- [ ] Add preset/texture pack licensing documentation before bundling assets.
- [ ] Add a compatibility report for browser, Electron, and GPU/WebGL2 availability.
- [ ] Add package publishing workflow after license policy is finalized.

## Risks And Questions

- [ ] Confirm ProjectM Emscripten output exposes enough API to bind directly from TypeScript.
- [ ] If not, add a thin C/C++ export layer for the exact functions webMilk needs.
- [ ] Resolve LGPL obligations for WASM distribution before public release.
- [ ] Resolve licensing for any bundled preset and texture packs separately.

## Done

- [x] Initial planning file created.
