import type { WebMilkFramePlan } from './types';

const roundFrameTime = (frameIndex: number, fps: number): number => Number((frameIndex / fps).toFixed(9));

export const buildFramePlan = ({
  targetTimeSec,
  previousTimeSec,
  fps,
  warmupSeconds,
  seekToleranceSeconds,
  maxFastForwardFrames,
  forceReset,
}: {
  targetTimeSec: number;
  previousTimeSec: number | null;
  fps: number;
  warmupSeconds: number;
  seekToleranceSeconds: number;
  maxFastForwardFrames: number;
  forceReset?: boolean;
}): WebMilkFramePlan => {
  if (!Number.isFinite(targetTimeSec) || targetTimeSec < 0) {
    throw new Error(`Invalid target time: ${targetTimeSec}`);
  }
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error(`Invalid FPS: ${fps}`);
  }

  const targetFrame = Math.round(targetTimeSec * fps);
  const normalizedTargetTimeSec = roundFrameTime(targetFrame, fps);
  const previousFrame = previousTimeSec === null ? null : Math.round(previousTimeSec * fps);
  const previousTimeForContinuity = previousTimeSec ?? 0;
  const isContinuousForward = previousFrame !== null
    && targetFrame >= previousFrame
    && (normalizedTargetTimeSec - previousTimeForContinuity) <= seekToleranceSeconds
    && (targetFrame - previousFrame) <= maxFastForwardFrames;

  if (!forceReset && isContinuousForward) {
    const displayTimesSec: number[] = [];
    for (let frame = previousFrame + 1; frame <= targetFrame; frame += 1) {
      displayTimesSec.push(roundFrameTime(frame, fps));
    }
    if (displayTimesSec.length === 0) displayTimesSec.push(normalizedTargetTimeSec);
    return {
      reset: false,
      startTimeSec: previousTimeForContinuity,
      hiddenWarmupTimesSec: [],
      displayTimesSec,
    };
  }

  const startTimeSec = Math.max(0, normalizedTargetTimeSec - Math.max(0, warmupSeconds));
  const startFrame = Math.round(startTimeSec * fps);
  const hiddenWarmupTimesSec: number[] = [];
  for (let frame = startFrame; frame < targetFrame; frame += 1) {
    hiddenWarmupTimesSec.push(roundFrameTime(frame, fps));
  }

  return {
    reset: true,
    startTimeSec: roundFrameTime(startFrame, fps),
    hiddenWarmupTimesSec,
    displayTimesSec: [normalizedTargetTimeSec],
  };
};
