import {
  WasmProjectMBackendFactory,
  createProjectMModuleFactoryFromUrl,
  createSineWaveAudio,
  createWebMilkPluginRunner,
  type WebMilkPluginDefinitionsFile,
} from '../../src';
import { smokePreset } from './smokePreset';
import './styles.css';

type SmokeResult = {
  ok: boolean;
  message: string;
};

const definitions: WebMilkPluginDefinitionsFile = {
  version: 1,
  plugins: [
    {
      id: 'projectm',
      displayName: 'ProjectM',
      runtime: 'projectm-wasm-webgl2',
      stateModel: 'stateful',
      wasmModuleUrl: '/src/vendor/projectm/webmilk-projectm.js',
      wasmBinaryUrl: '/src/vendor/projectm/webmilk-projectm.wasm',
      defaultWidth: 960,
      defaultHeight: 540,
      defaultFps: 60,
      warmupSeconds: 2,
      presets: [
        {
          id: 'inline-smoke',
          displayName: 'Inline Smoke Preset',
          inlineData: smokePreset,
        },
      ],
    },
  ],
};

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element.');

root.innerHTML = `
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">webMilk plug-in smoke harness</p>
      <h1>Host-style ProjectM frame requests</h1>
      <p>This page renders through a generic plug-in definition and frame-request contract, matching the intended Vizmatic integration boundary.</p>
    </section>
    <section class="panel">
      <canvas id="projector" width="960" height="540"></canvas>
      <div class="controls">
        <button id="run">Run smoke test</button>
        <button id="frame">Render one frame</button>
        <span id="status">Idle</span>
      </div>
      <pre id="log"></pre>
    </section>
  </main>
`;

const canvas = document.getElementById('projector') as HTMLCanvasElement;
const status = document.getElementById('status') as HTMLSpanElement;
const log = document.getElementById('log') as HTMLPreElement;
const runButton = document.getElementById('run') as HTMLButtonElement;
const frameButton = document.getElementById('frame') as HTMLButtonElement;

const appendLog = (message: string): void => {
  log.textContent += `${message}\n`;
};

const sampleCanvas = (): Uint32Array => {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
  if (!gl) return new Uint32Array(0);
  const data = new Uint8Array(canvas.width * canvas.height * 4);
  gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  const sample = new Uint32Array(128);
  const stride = Math.max(4, Math.floor(data.length / sample.length / 4) * 4);
  for (let index = 0; index < sample.length; index += 1) {
    const offset = Math.min(data.length - 4, index * stride);
    sample[index] = (
      data[offset]
      | (data[offset + 1] << 8)
      | (data[offset + 2] << 16)
      | (data[offset + 3] << 24)
    ) >>> 0;
  }
  return sample;
};

const samplesDiffer = (a: Uint32Array, b: Uint32Array): boolean => (
  a.length !== b.length || a.some((value, index) => value !== b[index])
);

const createRunner = () => {
  const plugin = definitions.plugins[0]!;
  const moduleFactory = createProjectMModuleFactoryFromUrl(plugin.wasmModuleUrl!);
  return createWebMilkPluginRunner({
    definitions,
    canvas,
    resolveBackendFactory: ({ plugin: requestedPlugin }) => {
      if (requestedPlugin.runtime !== 'projectm-wasm-webgl2') {
        throw new Error(`Unsupported runtime: ${requestedPlugin.runtime}`);
      }
      return new WasmProjectMBackendFactory({ moduleFactory });
    },
  });
};

let runner = createRunner();
let frameIndex = 0;
const audio = createSineWaveAudio({ durationSec: 12, frequency: 220 });

const renderOne = async (): Promise<void> => {
  await runner.renderFrame({
    pluginId: 'projectm',
    presetId: 'inline-smoke',
    timeSec: frameIndex / 60,
    audio,
  });
  frameIndex += 1;
  status.textContent = `Rendered frame ${frameIndex}`;
};

const runSmoke = async (): Promise<SmokeResult[]> => {
  runner.dispose();
  runner = createRunner();
  frameIndex = 0;
  log.textContent = '';
  status.textContent = 'Running...';

  const results: SmokeResult[] = [];
  const before = sampleCanvas();
  for (let i = 0; i < 120; i += 1) {
    await renderOne();
  }
  const after = sampleCanvas();
  results.push({
    ok: samplesDiffer(before, after),
    message: 'canvas sample changed after sequential frame rendering',
  });

  await runner.renderFrame({
    pluginId: 'projectm',
    presetId: 'inline-smoke',
    timeSec: 6,
    audio,
    forceReset: true,
    warmupSeconds: 2,
  });
  results.push({
    ok: true,
    message: 'forceReset + warm-up request completed',
  });

  status.textContent = results.every((result) => result.ok) ? 'PASS' : 'FAIL';
  return results;
};

frameButton.addEventListener('click', () => {
  void renderOne().catch((err: unknown) => {
    status.textContent = 'ERROR';
    appendLog(err instanceof Error ? err.stack ?? err.message : String(err));
  });
});

runButton.addEventListener('click', () => {
  void runSmoke()
    .then((results) => {
      for (const result of results) appendLog(`${result.ok ? 'PASS' : 'FAIL'}: ${result.message}`);
    })
    .catch((err: unknown) => {
      status.textContent = 'ERROR';
      appendLog(err instanceof Error ? err.stack ?? err.message : String(err));
    });
});
