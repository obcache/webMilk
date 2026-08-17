# Testing Guide

## Purpose

Document the project-specific process here.

## Prerequisites

- Node.js and npm for project-management scripts.
- Git for source control.

## Commands

```powershell
npm run typecheck
npm run test
npm run test:browser
npm run build
```

Initial automated tests focus on:

- state planning for continuous playback vs seek/reset behavior
- warm-up frame generation
- projector/backend interaction
- PCM chunk handoff shape
- host-style ProjectM smoke rendering through plug-in definition JSON and generic frame requests

`npm run test:browser` requires generated ProjectM WASM artifacts:

```powershell
& E:\Production\Coding\emsdk\emsdk_env.ps1
npm run wasm:projectm
npm run test:browser
```

## Notes

Keep developer-facing details here rather than overloading the public README.
