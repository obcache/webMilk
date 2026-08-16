import type {
  ProjectMBackend,
  ProjectMBackendCreateOptions,
  ProjectMBackendFactory,
} from '../core/types';

export interface WasmProjectMBackendOptions extends ProjectMBackendCreateOptions {
  moduleFactory?: unknown;
}

export class WasmProjectMBackendFactory implements ProjectMBackendFactory {
  async create(_options: ProjectMBackendCreateOptions): Promise<ProjectMBackend> {
    throw new Error(
      'WasmProjectMBackend is not implemented yet. Build/export ProjectM WASM first, then bind the required C API here.',
    );
  }
}
