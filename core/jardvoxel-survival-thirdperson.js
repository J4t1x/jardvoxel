// ═══════════════════════════════════════════════════════════
// JardVoxel Survival — Third Person Camera
// SPEC-067: Procedural Player Body with third-person view
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';

export class ThirdPersonCamera {
  constructor() {
    this.distance = 4.0;
    this.height = 1.6;
    this.smoothing = 0.2;
    this.minDistance = 1.5;
    this.targetOffset = new THREE.Vector3(0, 1.0, 0);
    this._rayDir = new THREE.Vector3();
    this._rayOrigin = new THREE.Vector3();
    this._currentDist = 4.0;
  }

  update(camera, player, world) {
    const yaw = player.yaw;
    const pitch = Math.max(-1.2, Math.min(1.2, player.pitch));

    // Smoothly interpolate distance for collision adjustments
    let targetDist = this.distance;

    // Collision check: raycast from player head to desired camera position
    if (world && world.isBlockSolidForCamera) {
      this._rayOrigin.copy(player.position);
      this._rayOrigin.y += 1.0;
      const desiredX = player.position.x + (-Math.sin(yaw) * this.distance * Math.cos(pitch));
      const desiredY = player.position.y + 1.0 + this.distance * Math.sin(pitch) + this.height;
      const desiredZ = player.position.z + (-Math.cos(yaw) * this.distance * Math.cos(pitch));
      this._rayDir.set(desiredX - this._rayOrigin.x, desiredY - this._rayOrigin.y, desiredZ - this._rayOrigin.z);
      const desiredDist = this._rayDir.length();
      if (desiredDist > 0.001) {
        this._rayDir.multiplyScalar(1 / desiredDist);
        const stepSize = 0.15;
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

    // Smooth distance interpolation
    this._currentDist += (targetDist - this._currentDist) * 0.3;

    // Calculate final camera position
    const horizDist = this._currentDist * Math.cos(pitch);
    const vertDist = this._currentDist * Math.sin(pitch) + this.height;
    const finalX = player.position.x + (-Math.sin(yaw) * horizDist);
    const finalY = player.position.y + vertDist;
    const finalZ = player.position.z + (-Math.cos(yaw) * horizDist);

    // Smooth lerp camera position
    camera.position.x += (finalX - camera.position.x) * this.smoothing;
    camera.position.y += (finalY - camera.position.y) * this.smoothing;
    camera.position.z += (finalZ - camera.position.z) * this.smoothing;

    // Look at player (from eye level)
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }
}
