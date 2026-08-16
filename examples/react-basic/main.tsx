import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MockProjectMBackendFactory, createSineWaveAudio } from '../../src';
import { WebMilkCanvas, useWebMilkProjector, type WebMilkCanvasHandle } from '../../src/react';
import './styles.css';

const Demo = () => {
  const canvasHandle = useRef<WebMilkCanvasHandle | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const backend = useMemo(() => new MockProjectMBackendFactory(), []);
  const audio = useMemo(() => createSineWaveAudio({ durationSec: 30 }), []);
  const [timeSec, setTimeSec] = useState(0);
  const { ready, error, renderFrame } = useWebMilkProjector({
    backend,
    canvas,
    width: 1280,
    height: 720,
    fps: 60,
    warmupSeconds: 3,
    preset: { data: '[preset placeholder]' },
  });

  const renderNext = async () => {
    const nextTime = timeSec + (1 / 60);
    await renderFrame({ timeSec: nextTime, audio });
    setTimeSec(nextTime);
  };

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">webMilk</p>
        <h1>ProjectM WebGL2 projector harness</h1>
        <p>
          This demo currently uses the mock backend. Replace it with the WASM ProjectM backend once the exported C API
          bridge is available.
        </p>
      </section>

      <section className="panel">
        <WebMilkCanvas
          ref={(handle) => {
            canvasHandle.current = handle;
            setCanvas(handle?.canvas ?? null);
          }}
          logicalWidth={1280}
          logicalHeight={720}
        />
        <div className="controls">
          <button disabled={!ready} onClick={() => { void renderNext(); }}>
            Render next frame
          </button>
          <span>Time: {timeSec.toFixed(3)}s</span>
          <span>Status: {error ? error.message : ready ? 'ready' : 'initializing'}</span>
        </div>
      </section>
    </main>
  );
};

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element.');

createRoot(root).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>,
);
