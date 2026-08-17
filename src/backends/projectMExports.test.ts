import { describe, expect, it } from 'vitest';
import { resolveProjectMExport, resolveProjectMWasmModule } from './projectMExports';
import type { ProjectMWasmModule } from './projectMExports';

const baseModule = (): ProjectMWasmModule => ({
  HEAPU8: new Uint8Array(1024),
  HEAPF32: new Float32Array(256),
  _malloc: () => 8,
  _free: () => {},
});

describe('ProjectM export resolution', () => {
  it('resolves direct exports', () => {
    const fn = () => 1;
    const resolved = resolveProjectMExport({ ...baseModule(), projectm_create: fn }, 'projectm_create');

    expect(resolved).toBe(fn);
  });

  it('resolves underscored Emscripten exports', () => {
    const fn = () => 1;
    const resolved = resolveProjectMExport({ ...baseModule(), _projectm_create: fn } as ProjectMWasmModule, 'projectm_create');

    expect(resolved).toBe(fn);
  });

  it('resolves webMilk adapter exports', () => {
    const fn = () => 1;
    const resolved = resolveProjectMExport({ ...baseModule(), _webmilk_projectm_create: fn } as ProjectMWasmModule, 'projectm_create');

    expect(resolved).toBe(fn);
  });

  it('throws when a required export is missing', () => {
    expect(() => resolveProjectMWasmModule(baseModule())).toThrow('ProjectM WASM export is missing');
  });
});
