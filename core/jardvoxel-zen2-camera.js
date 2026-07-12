// ═══════════════════════════════════════════════════════════
// JardVoxel Zen 2 — Free-orbit Vista Camera
// Unlike ThirdPersonCamera (chase cam locked to player yaw/pitch), this
// camera orbits independently around the player — for pausing to take in
// a landscape, framed like a Ghibli establishing shot.
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';

export class Zen2OrbitalCamera {
  constructor() {
    this.distance = 7.0;
    this.minDistance = 2.5;
    this.maxDistance = 22.0;
    this.height = 1.3;
    this.smoothing = 0.12;
    this.orbitYaw = 0;
    this.orbitPitch = 0.35; // radians above horizon
    this.minPitch = -0.15;
    this.maxPitch = 1.35;
    this.targetOffset = new THREE.Vector3(0, 1.1, 0);

    this._currentDist = this.distance;
    this._active = false;
    this._rayOrigin = new THREE.Vector3();
    this._rayDir = new THREE.Vector3();
    this._desired = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();

    // "Take in the view" — after a short idle period, gently drift pitch/yaw
    // to compose a nicer wide shot (Ghibli/BOTW vista beat).
    this._idleTime = 0;
    this._autoFrameDelay = 4.0;
  }

  // Call when entering vista mode so the orbit starts near the player's
  // current facing instead of snapping to a fixed angle.
  enter(player) {
    this.orbitYaw = player.yaw;
    this.orbitPitch = 0.35;
    this._currentDist = this.distance;
    this._active = true;
    this._idleTime = 0;
  }

  leave() {
    this._active = false;
  }

  // Called from the pointer-lock mousemove handler in the game bootstrap.
  // dx/dy should use the same sign convention as the first-person look code
  // (yaw -= movementX*sens, pitch += movementY*sens*invertY) so orbiting the
  // vista camera feels identical to looking around in first person.
  applyOrbitDelta(dx, dy) {
    this.orbitYaw -= dx;
    this.orbitPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.orbitPitch + dy));
    this._idleTime = 0;
  }

  zoom(deltaScale) {
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + deltaScale));
    this._idleTime = 0;
  }

  update(camera, player, world, dt) {
    this._idleTime += dt;

    // Gentle auto-frame drift once the player stops adjusting the view.
    let yaw = this.orbitYaw;
    let pitch = this.orbitPitch;
    if (this._idleTime > this._autoFrameDelay) {
      const driftT = Math.min(1, (this._idleTime - this._autoFrameDelay) * 0.15);
      yaw += Math.sin(this._idleTime * 0.08) * 0.04 * driftT;
      pitch += 0.08 * driftT;
      pitch = Math.min(this.maxPitch, pitch);
    }

    let targetDist = this.distance;

    // Collision raycast from the player's head toward the desired camera spot
    // (same technique as ThirdPersonCamera — kept local/self-contained since
    // this camera's orbit math otherwise diverges from the chase cam).
    if (world && world.isBlockSolidForCamera) {
      this._rayOrigin.copy(player.position);
      this._rayOrigin.y += 1.0;
      const horiz = this.distance * Math.cos(pitch);
      const desiredX = player.position.x + (-Math.sin(yaw) * horiz);
      const desiredY = player.position.y + 1.0 + this.distance * Math.sin(pitch) + this.height;
      const desiredZ = player.position.z + (-Math.cos(yaw) * horiz);
      this._rayDir.set(desiredX - this._rayOrigin.x, desiredY - this._rayOrigin.y, desiredZ - this._rayOrigin.z);
      const desiredDist = this._rayDir.length();
      if (desiredDist > 0.001) {
        this._rayDir.multiplyScalar(1 / desiredDist);
        const stepSize = 0.2;
        const steps = Math.ceil(desiredDist / stepSize);
        for (let i = 1; i <= steps; i++) {
          const cx = Math.floor(this._rayOrigin.x + this._rayDir.x * i * stepSize);
          const cy = Math.floor(this._rayOrigin.y + this._rayDir.y * i * stepSize);
          const cz = Math.floor(this._rayOrigin.z + this._rayDir.z * i * stepSize);
          if (world.isBlockSolidForCamera(cx, cy, cz)) {
            targetDist = Math.max(this.minDistance, (i - 1) * stepSize);
            break;
          }
        }
      }
    }

    this._currentDist += (targetDist - this._currentDist) * 0.3;

    const horizDist = this._currentDist * Math.cos(pitch);
    const vertDist = this._currentDist * Math.sin(pitch) + this.height;
    this._desired.set(
      player.position.x + (-Math.sin(yaw) * horizDist),
      player.position.y + vertDist,
      player.position.z + (-Math.cos(yaw) * horizDist)
    );

    camera.position.x += (this._desired.x - camera.position.x) * this.smoothing;
    camera.position.y += (this._desired.y - camera.position.y) * this.smoothing;
    camera.position.z += (this._desired.z - camera.position.z) * this.smoothing;

    this._lookTarget.set(
      player.position.x,
      player.position.y + this.targetOffset.y,
      player.position.z
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(this._lookTarget);
  }
}
