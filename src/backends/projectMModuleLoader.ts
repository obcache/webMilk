import type { ProjectMWasmModuleFactory } from './projectMExports';

type EmscriptenModuleFactory = (options: Record<string, unknown>) => Promise<unknown>;

export const createProjectMModuleFactoryFromUrl = (moduleUrl: string): ProjectMWasmModuleFactory => (
  async ({ canvas, wasmUrl }) => {
    const imported = await import(/* @vite-ignore */ moduleUrl) as {
      default?: EmscriptenModuleFactory;
      createWebMilkProjectMModule?: EmscriptenModuleFactory;
    };
    const factory = imported.default ?? imported.createWebMilkProjectMModule;
    if (typeof factory !== 'function') {
      throw new Error(`ProjectM module at "${moduleUrl}" did not export an Emscripten module factory.`);
    }

    return factory({
      canvas,
      locateFile: (path: string) => {
        if (path.endsWith('.wasm') && wasmUrl) return wasmUrl;
        return new URL(path, new URL(moduleUrl, window.location.href)).toString();
      },
    }) as ReturnType<ProjectMWasmModuleFactory>;
  }
);
