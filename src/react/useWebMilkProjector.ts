import { useCallback, useEffect, useRef, useState } from 'react';
import { createWebMilkProjector } from '../core/projector';
import type {
  ProjectMBackendFactory,
  WebMilkPresetInput,
  WebMilkProjector,
  WebMilkProjectorOptions,
  WebMilkRenderFrameOptions,
} from '../core/types';

export interface UseWebMilkProjectorOptions extends Omit<WebMilkProjectorOptions, 'canvas' | 'backend'> {
  backend: ProjectMBackendFactory | null;
  canvas: HTMLCanvasElement | OffscreenCanvas | null;
  preset?: WebMilkPresetInput | null;
}

export interface UseWebMilkProjectorResult {
  projector: WebMilkProjector | null;
  ready: boolean;
  error: Error | null;
  renderFrame: (options: WebMilkRenderFrameOptions) => Promise<void>;
}

export const useWebMilkProjector = ({
  backend,
  canvas,
  preset,
  ...options
}: UseWebMilkProjectorOptions): UseWebMilkProjectorResult => {
  const projectorRef = useRef<WebMilkProjector | null>(null);
  const [projector, setProjector] = useState<WebMilkProjector | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    projectorRef.current?.dispose();
    projectorRef.current = null;
    setProjector(null);
    setError(null);

    if (!backend || !canvas) return undefined;

    void createWebMilkProjector({ ...options, backend, canvas })
      .then(async (nextProjector) => {
        if (preset) await nextProjector.loadPreset(preset);
        if (cancelled) {
          nextProjector.dispose();
          return;
        }
        projectorRef.current = nextProjector;
        setProjector(nextProjector);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
      projectorRef.current?.dispose();
      projectorRef.current = null;
      setProjector(null);
    };
  }, [backend, canvas, options.fps, options.height, options.maxFastForwardFrames, options.seekToleranceSeconds, options.warmupSeconds, options.width, preset]);

  const renderFrame = useCallback(async (frameOptions: WebMilkRenderFrameOptions) => {
    if (!projectorRef.current) throw new Error('webMilk projector is not ready.');
    await projectorRef.current.renderFrame(frameOptions);
  }, []);

  return {
    projector,
    ready: !!projector,
    error,
    renderFrame,
  };
};
