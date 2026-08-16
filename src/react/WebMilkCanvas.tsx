import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { CanvasHTMLAttributes } from 'react';

export interface WebMilkCanvasHandle {
  canvas: HTMLCanvasElement | null;
}

export interface WebMilkCanvasProps extends CanvasHTMLAttributes<HTMLCanvasElement> {
  logicalWidth: number;
  logicalHeight: number;
}

export const WebMilkCanvas = forwardRef<WebMilkCanvasHandle, WebMilkCanvasProps>(({
  logicalWidth,
  logicalHeight,
  style,
  ...props
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useImperativeHandle(ref, () => ({
    canvas: canvasRef.current,
  }), []);

  return (
    <canvas
      {...props}
      ref={canvasRef}
      width={logicalWidth}
      height={logicalHeight}
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        background: '#05070d',
        ...style,
      }}
    />
  );
});

WebMilkCanvas.displayName = 'WebMilkCanvas';
