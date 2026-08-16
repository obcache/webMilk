import { describe, expect, it } from 'vitest';
import { buildFramePlan } from './framePlanner';

describe('buildFramePlan', () => {
  it('resets and warms up for an initial arbitrary frame', () => {
    const plan = buildFramePlan({
      targetTimeSec: 10,
      previousTimeSec: null,
      fps: 60,
      warmupSeconds: 3,
      seekToleranceSeconds: 1 / 30,
      maxFastForwardFrames: 3,
    });

    expect(plan.reset).toBe(true);
    expect(plan.startTimeSec).toBe(7);
    expect(plan.hiddenWarmupTimesSec).toHaveLength(180);
    expect(plan.displayTimesSec).toEqual([10]);
  });

  it('continues forward without reset when frame delta is small', () => {
    const plan = buildFramePlan({
      targetTimeSec: 10 + (1 / 60),
      previousTimeSec: 10,
      fps: 60,
      warmupSeconds: 3,
      seekToleranceSeconds: 1,
      maxFastForwardFrames: 3,
    });

    expect(plan.reset).toBe(false);
    expect(plan.hiddenWarmupTimesSec).toEqual([]);
    expect(plan.displayTimesSec).toEqual([10.016666667]);
  });

  it('resets when the target moves backward', () => {
    const plan = buildFramePlan({
      targetTimeSec: 4,
      previousTimeSec: 10,
      fps: 60,
      warmupSeconds: 3,
      seekToleranceSeconds: 1,
      maxFastForwardFrames: 3,
    });

    expect(plan.reset).toBe(true);
    expect(plan.startTimeSec).toBe(1);
    expect(plan.displayTimesSec).toEqual([4]);
  });

  it('resets when a forward jump exceeds fast-forward tolerance', () => {
    const plan = buildFramePlan({
      targetTimeSec: 20,
      previousTimeSec: 10,
      fps: 60,
      warmupSeconds: 2,
      seekToleranceSeconds: 1,
      maxFastForwardFrames: 3,
    });

    expect(plan.reset).toBe(true);
    expect(plan.startTimeSec).toBe(18);
    expect(plan.hiddenWarmupTimesSec).toHaveLength(120);
  });
});
