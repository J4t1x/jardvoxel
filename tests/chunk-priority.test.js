import { describe, it, expect } from 'vitest';
import { chunkGenPriority } from '../core/jardvoxel-survival-gameplay.js';

describe('chunkGenPriority (SPEC-116)', () => {
  it('returns raw distance when no camera', () => {
    expect(chunkGenPriority(3, 4, 5, 0, false)).toBe(5);
  });

  it('returns raw distance for very close chunks (dist <= 1.5)', () => {
    expect(chunkGenPriority(1, 0, 1, 0, true)).toBe(1);
    expect(chunkGenPriority(0, 1, 1, 0, true)).toBe(1);
  });

  it('front chunk has lower priority (higher precedence) than rear chunk at same distance', () => {
    // cameraYaw = 0 → looking toward +z
    // Front chunk: dx=0, dz=5 (directly ahead)
    // Rear chunk: dx=0, dz=-5 (directly behind)
    const front = chunkGenPriority(0, 5, 5, 0, true);
    const rear = chunkGenPriority(0, -5, 5, 0, true);
    expect(front).toBeLessThan(rear);
  });

  it('side chunk has intermediate priority between front and rear', () => {
    const front = chunkGenPriority(0, 5, 5, 0, true);
    const side = chunkGenPriority(5, 0, 5, 0, true);
    const rear = chunkGenPriority(0, -5, 5, 0, true);
    expect(front).toBeLessThan(side);
    expect(side).toBeLessThan(rear);
  });

  it('close rear chunk still beats far front chunk (distance dominates at extremes)', () => {
    const closeRear = chunkGenPriority(0, -2, 2, 0, true);
    const farFront = chunkGenPriority(0, 10, 10, 0, true);
    expect(closeRear).toBeLessThan(farFront);
  });

  it('at equal distance, front chunk beats rear chunk by K*2', () => {
    const K = 1.5;
    const front = chunkGenPriority(0, 5, 5, 0, true, K);
    const rear = chunkGenPriority(0, -5, 5, 0, true, K);
    // front: 5 - cos(0)*K = 5 - K; rear: 5 - cos(PI)*K = 5 + K
    expect(front).toBeCloseTo(5 - K, 5);
    expect(rear).toBeCloseTo(5 + K, 5);
    expect(rear - front).toBeCloseTo(2 * K, 5);
  });

  it('respects camera yaw direction', () => {
    // cameraYaw = PI → looking toward -z
    // Now dz=-5 is front, dz=5 is rear
    const front = chunkGenPriority(0, -5, 5, Math.PI, true);
    const rear = chunkGenPriority(0, 5, 5, Math.PI, true);
    expect(front).toBeLessThan(rear);
  });

  it('continuous weight: no hard discontinuity at arc boundaries', () => {
    // Chunks just inside and outside the 90° boundary should have close priorities
    const justInside = chunkGenPriority(5, 0.01, 5.0001, 0, true);
    const justOutside = chunkGenPriority(5, -0.01, 5.0001, 0, true);
    expect(Math.abs(justInside - justOutside)).toBeLessThan(0.01);
  });
});
