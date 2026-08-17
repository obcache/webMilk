# Build Guide

## Purpose

Document the project-specific process here.

## Prerequisites

- Node.js and npm for project-management scripts.
- Git for source control.
- A WebGL2-capable browser for the demo harness.
- Emscripten will be required once the ProjectM WASM backend work begins.

## Commands

```powershell
npm install
npm run typecheck
npm run test
npm run build
npm run dev
npm run wasm:projectm
```

Current build shape:

- `src/index.ts` exports the framework-agnostic runtime.
- `src/react/index.ts` exports React adapters.
- `examples/react-basic/` is the local Vite demo harness.
- `src/backends/wasmProjectMBackend.ts` is intentionally a placeholder until the ProjectM WASM export is built.
- `src/backends/projectMExports.ts` documents the expected ProjectM WASM export surface.

See `docs/developer/projectm-wasm-plan.md` for the backend implementation plan.
See `docs/developer/plugin-adapter-authoring.md` for the plug-in definition and adapter contract.

`npm run wasm:projectm` requires an activated Emscripten environment. It currently defaults to `E:\Production\Coding\projectm` as the local ProjectM checkout.

On Windows, install Ninja or MinGW make before running the WASM build. The script checks for `ninja.exe` first, then `mingw32-make.exe`.

## Notes

Keep developer-facing details here rather than overloading the public README.
