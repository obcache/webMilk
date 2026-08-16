import { describe, expect, it } from 'vitest';
import { MockProjectMBackendFactory } from '../backends/mockProjectMBackend';
import { createSineWaveAudio } from './audio';
import { createWebMilkProjector } from './projector';

const createCanvas = (): HTMLCanvasElement => document.createElement('canvas');

describe('StatefulWebMilkProjector', () => {
  it('renders through a backend and tracks the last displayed timestamp', async () => {
    const factory = new MockProjectMBackendFactory();
    const projector = await createWebMilkProjector({
      backend: factory,
      canvas: createCanvas(),
      width: 640,
      height: 360,
      fps: 60,
      warmupSeconds: 0,
    });

    await projector.renderFrame({ timeSec: 1 });

    expect(projector.lastRenderedTimeSec).toBe(1);
    expect(factory.instances[0]?.frames.at(-1)?.timeSec).toBe(1);
  });

  it('feeds interleaved PCM chunks to the backend', async () => {
    const factory = new MockProjectMBackendFactory();
    const projector = await createWebMilkProjector({
      backend: factory,
      canvas: createCanvas(),
      width: 640,
      height: 360,
      fps: 60,
      warmupSeconds: 0,
    });

    await projector.renderFrame({
      timeSec: 1 / 60,
      audio: createSineWaveAudio({ durationSec: 1, sampleRate: 48_000 }),
    });

    const frame = factory.instances[0]?.frames.at(-1);
    expect(frame?.channelLayout).toBe('stereo');
    expect(frame?.audioChunk?.length).toBeGreaterThan(0);
  });

  it('resets the backend when seeking backward', async () => {
    const factory = new MockProjectMBackendFactory();
    const projector = await createWebMilkProjector({
      backend: factory,
      canvas: createCanvas(),
      width: 640,
      height: 360,
      fps: 60,
      warmupSeconds: 0,
    });

    await projector.renderFrame({ timeSec: 5 });
    await projector.renderFrame({ timeSec: 2 });

    expect(factory.instances[0]?.resets).toBe(2);
    expect(projector.lastRenderedTimeSec).toBe(2);
  });
});
