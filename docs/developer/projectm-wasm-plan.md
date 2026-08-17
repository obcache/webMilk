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

## Added webMilk Adapter Target

The repository includes an experimental ProjectM adapter target:

- `wasm/projectm-adapter/CMakeLists.txt`
- `wasm/projectm-adapter/bindings.cpp`

This target wraps ProjectM's public C API with stable `webmilk_projectm_*` exports. The TypeScript backend accepts either native ProjectM export names or these adapter export names.

Build helper:

```powershell
npm run wasm:projectm
```

Default ProjectM source path:

```text
E:\Production\Coding\projectm
```

The helper passes this into CMake as:

```text
-DPROJECTM_ROOT:PATH=E:\Production\Coding\projectm
```

Expected generated artifact destination:

```text
public\vendor\projectm\
src\vendor\projectm\
```

Those destinations are gitignored until licensing/distribution policy is finalized. The `src\vendor\projectm\` copy exists so Vite can dynamically import the generated Emscripten module during local smoke testing.

The build requires Emscripten tools on PATH:

- `emcmake`
- `emmake`
- `emcc`

On Windows, CMake also needs one Emscripten-compatible build tool on PATH:

- preferred: `ninja.exe`
- alternate: `mingw32-make.exe`

The npm `ninja-build` package is not viable for this project on Windows because it does not support `win32`.

Known install options:

```powershell
choco install ninja -y
```

or:

```powershell
winget install Ninja-build.Ninja
```

After installing Ninja, restart the terminal or refresh PATH, then run:

```powershell
& E:\Production\Coding\emsdk\emsdk_env.ps1
npm run wasm:projectm
```

Current local status when scaffolded: CMake is available, Emscripten is not on PATH.

Updated local status: Emscripten and Ninja are available, and `npm run wasm:projectm` successfully produced:

- `public\vendor\projectm\webmilk-projectm.js`
- `public\vendor\projectm\webmilk-projectm.wasm`
- `src\vendor\projectm\webmilk-projectm.js`
- `src\vendor\projectm\webmilk-projectm.wasm`

These generated artifacts remain gitignored until licensing/distribution policy is finalized.

The browser smoke path requires the webMilk adapter export `webmilk_projectm_init_webgl_context`. ProjectM's Emscripten GL resolver expects `emscripten_webgl_get_current_context()` to return a current context before `projectm_create()` succeeds. The TypeScript factory therefore lets the Emscripten module create/make-current the canvas context before constructing the ProjectM instance.

## Validation Milestones

- [x] Render one frame with no audio.
- [x] Render 60 sequential frames with synthetic sine-wave audio.
- [x] Confirm canvas output changes over time.
- [ ] Confirm reset + warm-up produces stable output for the same target timestamp.
- [ ] Measure frame cost at 1920x1080.
- [ ] Measure frame cost at 1080x1920.

## Licensing Notes

ProjectM is LGPL. Do not publish bundled WASM artifacts until distribution obligations are reviewed. Preset and texture packs must be reviewed separately.
