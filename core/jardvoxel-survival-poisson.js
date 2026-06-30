// ═══════════════════════════════════════════════════════════
// JardVoxel 7.1 — Poisson Disk Sampling (Bridson's Algorithm)
// PRD G-04: Natural feature distribution with minimum spacing
// ═══════════════════════════════════════════════════════════

export class PoissonDiskSampler {
  constructor(seed) {
    this.seed = seed;
  }

  _hash(x, z) {
    const h = ((x * 374761393 + z * 668265263) ^ this.seed) & 0x7FFFFFFF;
    return h / 0x7FFFFFFF;
  }

  _hash2(x, z, salt) {
    const h = ((x * 374761393 + z * 668265263 + salt * 7919) ^ this.seed) & 0x7FFFFFFF;
    return h / 0x7FFFFFFF;
  }

  sampleChunk(chunkSize, minRadius, maxAttempts = 30, ox = 0, oz = 0) {
    const cellSize = minRadius / Math.SQRT2;
    const gridW = Math.ceil(chunkSize / cellSize);
    const gridH = Math.ceil(chunkSize / cellSize);
    const grid = new Float32Array(gridW * gridH * 2).fill(-1);
    const points = [];
    const active = [];

    const seedPoint = {
      x: this._hash(ox, oz) * chunkSize,
      z: this._hash(oz, ox) * chunkSize,
    };
    this._insertGrid(grid, gridW, cellSize, seedPoint);
    points.push(seedPoint);
    active.push(seedPoint);

    while (active.length > 0) {
      const idx = Math.floor(this._hash2(ox + active.length, oz + points.length, 42) * active.length);
      const center = active[idx];

      let found = false;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const angle = this._hash2(ox + attempt, oz + idx, attempt + 1) * Math.PI * 2;
        const r = minRadius + this._hash2(ox + attempt + 1, oz + idx, attempt + 7) * minRadius;
        const candidate = {
          x: center.x + Math.cos(angle) * r,
          z: center.z + Math.sin(angle) * r,
        };

        if (candidate.x < 0 || candidate.x >= chunkSize) continue;
        if (candidate.z < 0 || candidate.z >= chunkSize) continue;

        if (this._isFarEnough(grid, gridW, gridH, cellSize, candidate, minRadius)) {
          this._insertGrid(grid, gridW, cellSize, candidate);
          points.push(candidate);
          active.push(candidate);
          found = true;
          break;
        }
      }

      if (!found) {
        active.splice(idx, 1);
      }
    }

    return points;
  }

  _insertGrid(grid, gridW, cellSize, point) {
    const gx = Math.floor(point.x / cellSize);
    const gz = Math.floor(point.z / cellSize);
    const idx = (gx + gz * gridW) * 2;
    grid[idx] = point.x;
    grid[idx + 1] = point.z;
  }

  _isFarEnough(grid, gridW, gridH, cellSize, point, minRadius) {
    const gx = Math.floor(point.x / cellSize);
    const gz = Math.floor(point.z / cellSize);
    const minR2 = minRadius * minRadius;

    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = gx + dx;
        const nz = gz + dz;
        if (nx < 0 || nx >= gridW || nz < 0 || nz >= gridH) continue;
        const idx = (nx + nz * gridW) * 2;
        const px = grid[idx];
        const pz = grid[idx + 1];
        if (px < 0) continue;
        const ddx = px - point.x;
        const ddz = pz - point.z;
        if (ddx * ddx + ddz * ddz < minR2) return false;
      }
    }
    return true;
  }

  sampleChunkWithDensity(chunkSize, targetCount, minRadius, ox = 0, oz = 0) {
    const points = this.sampleChunk(chunkSize, minRadius, 30, ox, oz);
    if (points.length <= targetCount) return points;

    const result = [];
    const used = new Set();
    for (let i = 0; i < targetCount; i++) {
      let idx;
      do {
        idx = Math.floor(this._hash2(ox + i, oz + i, i + 100) * points.length);
      } while (used.has(idx));
      used.add(idx);
      result.push(points[idx]);
    }
    return result;
  }
}
