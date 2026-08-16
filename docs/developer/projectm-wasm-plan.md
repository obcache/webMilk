# ProjectM WASM Backend Plan

## Objective

Compile ProjectM to a browser-loadable WASM/WebGL2 module and bind only the API surface webMilk needs for deterministic projector rendering.

## Required Export Surface

The first backend implementation should expose these ProjectM functions:

- `projectm_create`
- `projectm_destroy`
- `projectm_load_preset_data`
- `projectm_set_window_size`
- `projectm_set_fps`
- `projectm_set_frame_time`
- `projectm_set_preset_locked`
- `projectm_set_preset_start_clean`
- `projectm_pcm_add_float`
- `projectm_opengl_render_frame`
- `projectm_opengl_render_frame_fbo`

The matching TypeScript contract lives in:

- `src/backends/projectMExports.ts`

## Initial Build Assumptions

Use ProjectM's Emscripten path with WebGL2/OpenGL ES support.

Candidate flags from ProjectM documentation:

```text
-sUSE_SDL=2
-sMIN_WEBGL_VERSION=2
-sMAX_WEBGL_VERSION=2
-sFULL_ES2=1
-sFULL_ES3=1
-sALLOW_MEMORY_GROWTH=1
```

The loader should bind rendering to the supplied canvas rather than creating a hidden global canvas.

## Backend Implementation Shape

`WasmProjectMBackendFactory` should:

1. Load the generated ProjectM module.
2. Create a ProjectM instance.
3. Set window size and FPS.
4. Lock preset switching for deterministic first-pass behavior.
5. Load preset data from a string.
6. On each frame:
   - copy interleaved PCM into WASM memory
   - call `projectm_pcm_add_float`
   - call `projectm_set_frame_time`
   - call `projectm_opengl_render_frame` or FBO variant

## Validation Milestones

- [ ] Render one frame with no audio.
- [ ] Render 60 sequential frames with synthetic sine-wave audio.
- [ ] Confirm canvas output changes over time.
- [ ] Confirm reset + warm-up produces stable output for the same target timestamp.
- [ ] Measure frame cost at 1920x1080.
- [ ] Measure frame cost at 1080x1920.

## Licensing Notes

ProjectM is LGPL. Do not publish bundled WASM artifacts until distribution obligations are reviewed. Preset and texture packs must be reviewed separately.
