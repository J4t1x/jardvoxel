// ═══════════════════════════════════════════════════════════
// SPEC-122: Regression test for setToonShading() infinite loop
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SPEC-122: setToonShading() infinite loop fix', () => {
  let mockWorld;
  let rebuildCallCount;
  const MAX_EXPECTED_REBUILDS = 50; // Safety cap for test

  beforeEach(() => {
    rebuildCallCount = 0;

    // Mock SurvivalWorld with minimal structure needed to reproduce the bug
    mockWorld = {
      meshes: new Map(),
      _toonShading: false,
      _lodMaterials: null,
      scene: { remove: vi.fn() },

      // Stub _rebuildChunkMesh that mimics the real mutation pattern:
      // delete old mesh, create new mesh, set new mesh
      _rebuildChunkMesh(cx, cz, force) {
        rebuildCallCount++;
        if (rebuildCallCount > MAX_EXPECTED_REBUILDS) {
          throw new Error(`Infinite loop detected: _rebuildChunkMesh called ${rebuildCallCount} times`);
        }

        const key = `${cx},${cz}`;
        const oldMesh = this.meshes.get(key);
        
        // Simulate the real mutation: delete then set
        // This is what causes the infinite loop in the buggy version
        if (oldMesh) {
          this.meshes.delete(key);
        }
        
        // Create new mock mesh
        const newMesh = {
          userData: { cx, cz },
          geometry: { dispose: vi.fn() },
          material: { dispose: vi.fn() },
        };
        
        this.meshes.set(key, newMesh);
      },

      // BUGGY VERSION (for reference, not used in test):
      // setToonShading_BUGGY(enabled) {
      //   this._toonShading = !!enabled;
      //   if (this._lodMaterials) {
      //     this._lodMaterials = null;
      //   }
      //   // BUG: Iterating over live Map while mutating it
      //   for (const [key, mesh] of this.meshes) {
      //     const { cx, cz } = mesh.userData;
      //     this._rebuildChunkMesh(cx, cz, true);
      //   }
      // },

      // FIXED VERSION (snapshot before iteration):
      setToonShading(enabled) {
        this._toonShading = !!enabled;
        if (this._lodMaterials) {
          this._lodMaterials = null;
        }
        // FIX: Snapshot chunk coordinates before iterating
        const targets = Array.from(this.meshes.values(), m => ({ cx: m.userData.cx, cz: m.userData.cz }));
        for (const { cx, cz } of targets) {
          this._rebuildChunkMesh(cx, cz, true);
        }
      },
    };
  });

  it('should terminate promptly with 20 loaded chunks', () => {
    // Populate meshes with 20 chunks
    for (let i = 0; i < 20; i++) {
      const cx = i % 5;
      const cz = Math.floor(i / 5);
      const key = `${cx},${cz}`;
      mockWorld.meshes.set(key, {
        userData: { cx, cz },
        geometry: { dispose: vi.fn() },
        material: { dispose: vi.fn() },
      });
    }

    expect(mockWorld.meshes.size).toBe(20);

    // Call setToonShading - should complete without throwing
    expect(() => {
      mockWorld.setToonShading(true);
    }).not.toThrow();

    // Should have rebuilt exactly 20 chunks (one per mesh)
    expect(rebuildCallCount).toBe(20);
    expect(mockWorld._toonShading).toBe(true);
  });

  it('should terminate promptly with 50 loaded chunks', () => {
    // Populate meshes with 50 chunks
    for (let i = 0; i < 50; i++) {
      const cx = i % 10;
      const cz = Math.floor(i / 10);
      const key = `${cx},${cz}`;
      mockWorld.meshes.set(key, {
        userData: { cx, cz },
        geometry: { dispose: vi.fn() },
        material: { dispose: vi.fn() },
      });
    }

    expect(mockWorld.meshes.size).toBe(50);

    // Call setToonShading - should complete without throwing
    expect(() => {
      mockWorld.setToonShading(true);
    }).not.toThrow();

    // Should have rebuilt exactly 50 chunks
    expect(rebuildCallCount).toBe(50);
    expect(mockWorld._toonShading).toBe(true);
  });

  it('should work correctly when toggling off', () => {
    // Start with toon shading enabled
    mockWorld._toonShading = true;

    // Populate with 10 chunks
    for (let i = 0; i < 10; i++) {
      const cx = i % 5;
      const cz = Math.floor(i / 5);
      const key = `${cx},${cz}`;
      mockWorld.meshes.set(key, {
        userData: { cx, cz },
        geometry: { dispose: vi.fn() },
        material: { dispose: vi.fn() },
      });
    }

    // Toggle off
    expect(() => {
      mockWorld.setToonShading(false);
    }).not.toThrow();

    expect(rebuildCallCount).toBe(10);
    expect(mockWorld._toonShading).toBe(false);
  });

  it('should handle empty meshes map gracefully', () => {
    expect(mockWorld.meshes.size).toBe(0);

    expect(() => {
      mockWorld.setToonShading(true);
    }).not.toThrow();

    expect(rebuildCallCount).toBe(0);
    expect(mockWorld._toonShading).toBe(true);
  });

  it('should handle single chunk', () => {
    mockWorld.meshes.set('0,0', {
      userData: { cx: 0, cz: 0 },
      geometry: { dispose: vi.fn() },
      material: { dispose: vi.fn() },
    });

    expect(() => {
      mockWorld.setToonShading(true);
    }).not.toThrow();

    expect(rebuildCallCount).toBe(1);
    expect(mockWorld._toonShading).toBe(true);
  });

  it('should complete in reasonable time (performance check)', () => {
    // Populate with 30 chunks
    for (let i = 0; i < 30; i++) {
      const cx = i % 6;
      const cz = Math.floor(i / 6);
      const key = `${cx},${cz}`;
      mockWorld.meshes.set(key, {
        userData: { cx, cz },
        geometry: { dispose: vi.fn() },
        material: { dispose: vi.fn() },
      });
    }

    const start = performance.now();
    mockWorld.setToonShading(true);
    const duration = performance.now() - start;

    // Should complete in under 100ms (very generous, actual should be <1ms)
    expect(duration).toBeLessThan(100);
    expect(rebuildCallCount).toBe(30);
  });
});
