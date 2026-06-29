// ═══════════════════════════════════════════════════════════
// SPEC-072: Soft Shadow Enhancement
// Cascaded shadow maps with 3 cascades, distance-based blur,
// bias tuning for voxel geometry.
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';

export const SHADOW_QUALITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

const QUALITY_PARAMS = {
  high: { mapSize: 4096, cascades: 3 },
  medium: { mapSize: 2048, cascades: 1 },
  low: { mapSize: 1024, cascades: 1 },
};

const CASCADE_RANGES = [
  { near: 0, far: 32 },
  { near: 32, far: 96 },
  { near: 96, far: 256 },
];

export class ShadowManager {
  constructor(renderer, sunLight, camera) {
    this.renderer = renderer;
    this.sunLight = sunLight;
    this.camera = camera;
    this.quality = SHADOW_QUALITY.HIGH;
    this.cascades = [];
    this._enabled = true;

    this._init();
  }

  _init() {
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._setupShadow();
  }

  _setupShadow() {
    const params = QUALITY_PARAMS[this.quality];

    if (params.cascades === 1) {
      this._disposeCascades();
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(params.mapSize, params.mapSize);
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 256;
      this.sunLight.shadow.camera.left = -96;
      this.sunLight.shadow.camera.right = 96;
      this.sunLight.shadow.camera.top = 96;
      this.sunLight.shadow.camera.bottom = -96;
      this.sunLight.shadow.bias = -0.0005;
      this.sunLight.shadow.normalBias = 0.05;
      this.sunLight.shadow.camera.updateProjectionMatrix();
    } else {
      this._setupCascaded(params.mapSize);
    }
  }

  _setupCascaded(mapSize) {
    this._disposeCascades();
    this.sunLight.castShadow = false;

    for (let i = 0; i < CASCADE_RANGES.length; i++) {
      const range = CASCADE_RANGES[i];
      const light = new THREE.DirectionalLight(0xffffff, 0);
      light.castShadow = true;
      light.shadow.mapSize.set(mapSize, mapSize);
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = range.far + 16;
      const halfRange = range.far / 2;
      light.shadow.camera.left = -halfRange;
      light.shadow.camera.right = halfRange;
      light.shadow.camera.top = halfRange;
      light.shadow.camera.bottom = -halfRange;
      light.shadow.bias = -0.0005;
      light.shadow.normalBias = 0.05;
      light.shadow.camera.updateProjectionMatrix();
      light.userData.cascadeIndex = i;
      light.userData.cascadeRange = range;
      this.cascades.push(light);
    }
  }

  _disposeCascades() {
    for (const light of this.cascades) {
      if (light.shadow && light.shadow.map) {
        light.shadow.map.dispose();
      }
    }
    this.cascades = [];
  }

  setQuality(quality) {
    this.quality = quality;
    this._setupShadow();
  }

  setEnabled(enabled) {
    this._enabled = enabled;
    if (enabled) {
      const params = QUALITY_PARAMS[this.quality];
      if (params.cascades === 1) {
        this.sunLight.castShadow = true;
      } else {
        for (const light of this.cascades) {
          light.castShadow = true;
        }
      }
      this.renderer.shadowMap.enabled = true;
    } else {
      this.sunLight.castShadow = false;
      for (const light of this.cascades) {
        light.castShadow = false;
      }
      this.renderer.shadowMap.enabled = false;
    }
  }

  update(playerPosition, cameraDirection) {
    if (!this._enabled) return;

    const params = QUALITY_PARAMS[this.quality];

    if (params.cascades === 1) {
      this.sunLight.position.copy(playerPosition);
      this.sunLight.position.add(new THREE.Vector3(50, 100, 50));
      this.sunLight.target.position.copy(playerPosition);
      this.sunLight.target.updateMatrixWorld();
    } else {
      for (let i = 0; i < this.cascades.length; i++) {
        const light = this.cascades[i];
        const range = CASCADE_RANGES[i];
        const offsetDist = (range.near + range.far) / 2;
        const offset = cameraDirection.clone().multiplyScalar(offsetDist);
        const center = playerPosition.clone().add(offset);
        light.position.copy(center);
        light.position.add(new THREE.Vector3(50, 100, 50));
        light.target.position.copy(center);
        light.target.updateMatrixWorld();
      }
    }
  }

  addToScene(scene) {
    for (const light of this.cascades) {
      scene.add(light);
      scene.add(light.target);
    }
  }

  removeFromScene(scene) {
    for (const light of this.cascades) {
      scene.remove(light);
      scene.remove(light.target);
    }
  }

  dispose() {
    this._disposeCascades();
    if (this.sunLight.shadow && this.sunLight.shadow.map) {
      this.sunLight.shadow.map.dispose();
    }
  }
}
