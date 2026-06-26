// ═══════════════════════════════════════════════════════════
// JardVoxel Survival Particles — Mining, placing, weather
// SPEC-040: Particle Effects
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { MC_BLOCK_COLORS, BLOCK } from './jardvoxel-survival-mesher.js';

export class ParticleSystem {
  constructor(scene, maxParticles = 200) {
    this.scene = scene;
    this.maxParticles = maxParticles;
    this.particles = [];
    this.geom = new THREE.BufferGeometry();
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);
    this.geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geom.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geom.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
    });
    this.points = new THREE.Points(this.geom, mat);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  spawnBlockBreak(x, y, z, blockId, count = 8) {
    const c = MC_BLOCK_COLORS[blockId] || [0.5, 0.5, 0.5];
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        x: x + 0.5 + (Math.random() - 0.5) * 0.8,
        y: y + 0.5 + (Math.random() - 0.5) * 0.8,
        z: z + 0.5 + (Math.random() - 0.5) * 0.8,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 1,
        vz: (Math.random() - 0.5) * 3,
        r: c[0], g: c[1], b: c[2],
        life: 1.0,
        size: 0.1 + Math.random() * 0.1,
      });
    }
  }

  spawnBlockPlace(x, y, z, blockId, count = 6) {
    const c = MC_BLOCK_COLORS[blockId] || [0.5, 0.5, 0.5];
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        x: x + 0.5 + (Math.random() - 0.5) * 0.6,
        y: y + 0.1,
        z: z + 0.5 + (Math.random() - 0.5) * 0.6,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 2 + 0.5,
        vz: (Math.random() - 0.5) * 1.5,
        r: c[0] * 0.8, g: c[1] * 0.8, b: c[2] * 0.8,
        life: 0.8,
        size: 0.08 + Math.random() * 0.08,
      });
    }
  }

  spawnWalkDust(x, y, z, count = 3) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 0.4,
        y: y - 0.9,
        z: z + (Math.random() - 0.5) * 0.4,
        vx: (Math.random() - 0.5) * 0.8,
        vy: Math.random() * 1.5,
        vz: (Math.random() - 0.5) * 0.8,
        r: 0.6, g: 0.55, b: 0.45,
        life: 0.5,
        size: 0.06 + Math.random() * 0.06,
      });
    }
  }

  spawnRain(x, y, z, count = 4) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + 8 + Math.random() * 4,
        z: z + (Math.random() - 0.5) * 10,
        vx: 0,
        vy: -12,
        vz: 0,
        r: 0.4, g: 0.5, b: 0.7,
        life: 1.0,
        size: 0.04,
      });
    }
  }

  spawnSnow(x, y, z, count = 3) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + 8 + Math.random() * 4,
        z: z + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -2,
        vz: (Math.random() - 0.5) * 0.5,
        r: 0.9, g: 0.9, b: 1.0,
        life: 1.0,
        size: 0.06,
      });
    }
  }

  update(dt) {
    const gravity = -10;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.life -= dt * 1.5;
      if (p.life <= 0 || p.y < -64) {
        this.particles.splice(i, 1);
      }
    }

    // Update buffers
    const n = Math.min(this.particles.length, this.maxParticles);
    for (let i = 0; i < n; i++) {
      const p = this.particles[i];
      this.positions[i * 3] = p.x;
      this.positions[i * 3 + 1] = p.y;
      this.positions[i * 3 + 2] = p.z;
      this.colors[i * 3] = p.r * p.life;
      this.colors[i * 3 + 1] = p.g * p.life;
      this.colors[i * 3 + 2] = p.b * p.life;
      this.sizes[i] = p.size * p.life;
    }
    // Clear remaining
    for (let i = n; i < this.maxParticles; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = -1000;
      this.positions[i * 3 + 2] = 0;
    }
    this.geom.attributes.position.needsUpdate = true;
    this.geom.attributes.color.needsUpdate = true;
    this.geom.setDrawRange(0, n);
  }

  dispose() {
    this.scene.remove(this.points);
    this.geom.dispose();
    this.points.material.dispose();
  }
}
