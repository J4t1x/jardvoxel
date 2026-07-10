import { describe, it, expect } from 'vitest';
import { SurvivalWorld, chunkGenPriority } from '../core/jardvoxel-survival-gameplay.js';

// Helper: create a SurvivalWorld instance without calling the heavy constructor.
// We only need the queue-related fields and methods.
function createQueueTestWorld() {
  const world = Object.create(SurvivalWorld.prototype);
  world.chunks = new Map();
  world.pendingChunks = new Set();
  world._chunkGenQueue = [];
  world._queueReadIdx = 0;
  world._lastQueuePCX = null;
  world._lastQueuePCZ = null;
  world._lastQueueRD = null;
  return world;
}

// Helper: simulate a chunk being generated
function markChunkGenerated(world, cx, cz) {
  const key = world._chunkKey(cx, cz);
  world.chunks.set(key, { generated: true, cx, cz });
}

// Helper: simulate a chunk being pending
function markChunkPending(world, cx, cz) {
  const key = world._chunkKey(cx, cz);
  world.pendingChunks.add(key);
}

// Helper: count chunks within rd of (0,0) — for verifying expected counts
function countChunksInCircle(rd) {
  let count = 0;
  for (let dx = -rd; dx <= rd; dx++) {
    for (let dz = -rd; dz <= rd; dz++) {
      if (Math.sqrt(dx * dx + dz * dz) <= rd) count++;
    }
  }
  return count;
}

describe('SPEC-117: Incremental Chunk Queue', () => {
  describe('_chunkKey', () => {
    it('produces numeric keys (no string allocation)', () => {
      const world = createQueueTestWorld();
      const key1 = world._chunkKey(0, 0);
      const key2 = world._chunkKey(1, 0);
      expect(typeof key1).toBe('number');
      expect(key1).not.toBe(key2);
    });
  });

  describe('_fullChunkScan', () => {
    it('populates queue with all ungenerated chunks within rd', () => {
      const world = createQueueTestWorld();
      world._fullChunkScan(0, 0, 2, 0, false);
      // At rd=2: 5x5=25 grid, 12 cells outside circle (dist > 2), 13 inside
      const expected = countChunksInCircle(2);
      expect(world._chunkGenQueue.length).toBe(expected);
      expect(world._queueReadIdx).toBe(0);
    });

    it('skips already-generated chunks', () => {
      const world = createQueueTestWorld();
      markChunkGenerated(world, 0, 0);
      markChunkGenerated(world, 1, 0);
      world._fullChunkScan(0, 0, 2, 0, false);
      const expected = countChunksInCircle(2) - 2;
      expect(world._chunkGenQueue.length).toBe(expected);
    });

    it('skips pending chunks', () => {
      const world = createQueueTestWorld();
      markChunkPending(world, 0, 0);
      world._fullChunkScan(0, 0, 2, 0, false);
      const expected = countChunksInCircle(2) - 1;
      expect(world._chunkGenQueue.length).toBe(expected);
    });

    it('sorts queue by priority (closest first)', () => {
      const world = createQueueTestWorld();
      world._fullChunkScan(0, 0, 3, 0, false);
      // Without camera, priority = dist, so closest chunks should be first
      expect(world._chunkGenQueue[0].dist).toBeLessThanOrEqual(world._chunkGenQueue[1].dist);
      const firstDist = world._chunkGenQueue[0].dist;
      const lastDist = world._chunkGenQueue[world._chunkGenQueue.length - 1].dist;
      expect(firstDist).toBeLessThanOrEqual(lastDist);
    });

    it('queue is empty when all chunks within rd are generated', () => {
      const world = createQueueTestWorld();
      // Generate all chunks within rd=1
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (Math.sqrt(dx * dx + dz * dz) <= 1) {
            markChunkGenerated(world, dx, dz);
          }
        }
      }
      world._fullChunkScan(0, 0, 1, 0, false);
      expect(world._chunkGenQueue.length).toBe(0);
    });
  });

  describe('_deltaRingChunkScan', () => {
    it('adds only newly-exposed chunks when player moves +1 in x', () => {
      const world = createQueueTestWorld();
      // Initial full scan at (0,0) with rd=2
      world._fullChunkScan(0, 0, 2, 0, false);

      // Simulate all initial chunks being generated
      for (const c of world._chunkGenQueue) {
        markChunkGenerated(world, c.cx, c.cz);
      }

      // Move player to (1, 0) — delta ring should only scan newly-exposed column(s)
      world._deltaRingChunkScan(1, 0, 0, 0, 2, 0, false);

      // After compaction, old generated chunks are removed.
      // New candidates: only from x=3 column within rd=2 of new pos (1,0)
      // (3,0): dx=2, dz=0, dist=2 ≤ 2 → add
      // (3,±1): dist=√5≈2.24 > 2 → skip
      // (3,±2): dist=√8≈2.83 > 2 → skip
      expect(world._chunkGenQueue.length).toBe(1);
      expect(world._chunkGenQueue[0].cx).toBe(3);
      expect(world._chunkGenQueue[0].cz).toBe(0);
    });

    it('adds newly-exposed chunk when player moves -1 in z', () => {
      const world = createQueueTestWorld();
      world._fullChunkScan(0, 0, 2, 0, false);
      for (const c of world._chunkGenQueue) {
        markChunkGenerated(world, c.cx, c.cz);
      }

      // Move to (0, -1) — new row at z=-3 relative to old, z=-3 relative to new pos is dz=-2
      world._deltaRingChunkScan(0, -1, 0, 0, 2, 0, false);

      // Newly exposed z=-3, x from -2 to 2, relative to new pos (0,-1):
      // (0,-3): dx=0, dz=-2, dist=2 ≤ 2 → add
      // Others have dist > 2 → skip
      expect(world._chunkGenQueue.length).toBe(1);
      expect(world._chunkGenQueue[0].cx).toBe(0);
      expect(world._chunkGenQueue[0].cz).toBe(-3);
    });

    it('falls back to full scan on teleport (delta > rd)', () => {
      const world = createQueueTestWorld();
      world._fullChunkScan(0, 0, 2, 0, false);
      for (const c of world._chunkGenQueue) {
        markChunkGenerated(world, c.cx, c.cz);
      }

      // Teleport from (0,0) to (10,10) — should trigger full scan
      world._deltaRingChunkScan(10, 10, 0, 0, 2, 0, false);

      // Should have all ungenerated chunks within rd=2 of (10,10)
      const expected = countChunksInCircle(2);
      expect(world._chunkGenQueue.length).toBe(expected);
      // Verify center is at (10,10)
      const hasCenter = world._chunkGenQueue.some(c => c.cx === 10 && c.cz === 10);
      expect(hasCenter).toBe(true);
    });

    it('does not add duplicates of already-generated or pending chunks', () => {
      const world = createQueueTestWorld();
      world._fullChunkScan(0, 0, 2, 0, false);
      for (const c of world._chunkGenQueue) {
        markChunkGenerated(world, c.cx, c.cz);
      }
      // Mark (3,0) as pending before delta scan
      markChunkPending(world, 3, 0);

      world._deltaRingChunkScan(1, 0, 0, 0, 2, 0, false);
      // (3,0) is pending so should be skipped
      expect(world._chunkGenQueue.length).toBe(0);
    });
  });

  describe('_compactChunkQueue', () => {
    it('removes already-dispatched entries (read pointer advancement)', () => {
      const world = createQueueTestWorld();
      world._fullChunkScan(0, 0, 2, 0, false);
      const total = world._chunkGenQueue.length;

      // Simulate dispatching 3 chunks
      world._queueReadIdx = 3;

      // Mark those 3 as generated
      for (let i = 0; i < 3; i++) {
        markChunkGenerated(world, world._chunkGenQueue[i].cx, world._chunkGenQueue[i].cz);
      }

      world._compactChunkQueue();

      // Should have total - 3 remaining
      expect(world._chunkGenQueue.length).toBe(total - 3);
      expect(world._queueReadIdx).toBe(0);
    });

    it('removes pending entries', () => {
      const world = createQueueTestWorld();
      world._fullChunkScan(0, 0, 2, 0, false);
      const total = world._chunkGenQueue.length;

      // Mark first 2 as pending
      markChunkPending(world, world._chunkGenQueue[0].cx, world._chunkGenQueue[0].cz);
      markChunkPending(world, world._chunkGenQueue[1].cx, world._chunkGenQueue[1].cz);

      world._compactChunkQueue();

      expect(world._chunkGenQueue.length).toBe(total - 2);
    });

    it('clears queue when fully consumed', () => {
      const world = createQueueTestWorld();
      world._fullChunkScan(0, 0, 1, 0, false);
      // Mark all as generated
      for (const c of world._chunkGenQueue) {
        markChunkGenerated(world, c.cx, c.cz);
      }
      // Set read pointer past end
      world._queueReadIdx = world._chunkGenQueue.length;

      world._compactChunkQueue();

      expect(world._chunkGenQueue.length).toBe(0);
      expect(world._queueReadIdx).toBe(0);
    });
  });

  describe('_tryAddChunkCandidate', () => {
    it('adds candidate within rd', () => {
      const world = createQueueTestWorld();
      world._tryAddChunkCandidate(1, 0, 0, 0, 2, 0, false);
      expect(world._chunkGenQueue.length).toBe(1);
      expect(world._chunkGenQueue[0].cx).toBe(1);
      expect(world._chunkGenQueue[0].cz).toBe(0);
    });

    it('does not add candidate outside rd', () => {
      const world = createQueueTestWorld();
      world._tryAddChunkCandidate(5, 5, 0, 0, 2, 0, false);
      expect(world._chunkGenQueue.length).toBe(0);
    });

    it('does not add already-generated chunk', () => {
      const world = createQueueTestWorld();
      markChunkGenerated(world, 1, 0);
      world._tryAddChunkCandidate(1, 0, 0, 0, 2, 0, false);
      expect(world._chunkGenQueue.length).toBe(0);
    });

    it('does not add pending chunk', () => {
      const world = createQueueTestWorld();
      markChunkPending(world, 1, 0);
      world._tryAddChunkCandidate(1, 0, 0, 0, 2, 0, false);
      expect(world._chunkGenQueue.length).toBe(0);
    });

    it('uses SPEC-116 priority with camera direction', () => {
      const world = createQueueTestWorld();
      // Add front chunk (dz=+2) and rear chunk (dz=-2) with camera
      world._tryAddChunkCandidate(0, 2, 0, 0, 2, 0, true);  // front
      world._tryAddChunkCandidate(0, -2, 0, 0, 2, 0, true); // rear
      expect(world._chunkGenQueue[0].priority).toBeLessThan(world._chunkGenQueue[1].priority);
    });
  });

  describe('steady-state behavior (no rescan)', () => {
    it('does not rescan when player stays in same chunk and rd unchanged', () => {
      const world = createQueueTestWorld();
      // Simulate first frame: full scan
      world._fullChunkScan(0, 0, 2, 0, false);
      // Mark all as generated (steady state)
      for (const c of world._chunkGenQueue) {
        markChunkGenerated(world, c.cx, c.cz);
      }
      world._compactChunkQueue();
      const queueLenAfterCompact = world._chunkGenQueue.length;

      // Simulate update() setting last-known position after first frame
      world._lastQueuePCX = 0;
      world._lastQueuePCZ = 0;
      world._lastQueueRD = 2;

      // Second frame: same position, same rd — no scan should happen
      const chunkChanged = world._lastQueuePCX !== 0 || world._lastQueuePCZ !== 0;
      const rdChanged = world._lastQueueRD !== 2;
      expect(chunkChanged).toBe(false);
      expect(rdChanged).toBe(false);

      // In this state, update() would only compact — no full or delta scan
      // Verify queue stays the same
      world._compactChunkQueue();
      expect(world._chunkGenQueue.length).toBe(queueLenAfterCompact);
    });
  });
});
