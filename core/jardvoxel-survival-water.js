// ═══════════════════════════════════════════════════════════
// SPEC-073: Stylized Water Reflections
// Custom WaterMaterial shader with stylized reflections,
// enhanced Fresnel, refraction, caustics, and simplified SSR.
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';

const REFLECTION_RT_SIZE = 256;
const REFLECTION_UPDATE_INTERVAL = 4;

const waterVertexShader = `
  uniform float uTime;
  uniform vec3 uCameraPos;

  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vWaveHeight;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float wave1 = sin(pos.x * 0.8 + uTime * 1.5) * 0.06;
    float wave2 = cos(pos.z * 0.6 + uTime * 1.2) * 0.05;
    float wave3 = sin((pos.x + pos.z) * 0.4 + uTime * 0.8) * 0.03;
    vWaveHeight = wave1 + wave2 + wave3;
    pos.y += vWaveHeight;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vViewDir = normalize(uCameraPos - worldPos.xyz);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const waterFragmentShader = `
  uniform float uTime;
  uniform vec3 uSkyColor;
  uniform vec3 uSunDirection;
  uniform vec3 uCameraPos;
  uniform vec3 uShallowColor;
  uniform vec3 uDeepColor;
  uniform sampler2D uReflectionMap;
  uniform float uReflectionStrength;

  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vWaveHeight;

  vec3 getCaustics(vec2 uv, float depth) {
    float t = uTime * 0.5;
    float c1 = sin(uv.x * 12.0 + t) * cos(uv.y * 10.0 + t * 0.8);
    float c2 = sin((uv.x + uv.y) * 8.0 - t * 1.2) * cos(uv.x * 6.0 + t);
    float c3 = sin(uv.y * 15.0 + t * 0.6) * cos((uv.x - uv.y) * 9.0 + t);
    float caustic = (c1 + c2 + c3) / 3.0;
    caustic = pow(max(caustic, 0.0), 3.0);
    float intensity = clamp(1.0 - depth * 0.04, 0.0, 1.0);
    return vec3(0.6, 0.8, 0.9) * caustic * intensity * 0.4;
  }

  void main() {
    vec3 viewDir = normalize(vViewDir);
    vec3 normal = vec3(0.0, 1.0, 0.0);

    float waveDistortionX = sin(vWorldPos.x * 2.0 + uTime * 2.0) * 0.02;
    float waveDistortionZ = cos(vWorldPos.z * 1.5 + uTime * 1.5) * 0.02;
    normal.xz = vec2(waveDistortionX, waveDistortionZ) * 5.0;
    normal = normalize(normal);

    float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
    fresnel = pow(fresnel, 3.0);
    fresnel = clamp(fresnel * 0.8 + 0.1, 0.0, 1.0);

    vec3 reflectionUv = vec3(vUv + normal.xz * 0.02, 1.0);
    vec3 reflectionColor = texture2D(uReflectionMap, reflectionUv.xy).rgb * uReflectionStrength;

    vec3 skyColor = uSkyColor;

    vec3 waterColor = mix(uShallowColor, uDeepColor, clamp(fresnel * 0.5 + 0.3, 0.0, 1.0));

    vec3 finalColor = mix(waterColor, skyColor, fresnel * 0.4);
    finalColor = mix(finalColor, reflectionColor, fresnel * uReflectionStrength);

    float depth = length(vWorldPos - uCameraPos) * 0.5;
    vec3 caustics = getCaustics(vUv * 3.0, depth);
    finalColor += caustics * (1.0 - fresnel) * 0.3;

    float refractionStrength = (1.0 - fresnel) * 0.15;
    vec2 refractionOffset = normal.xz * refractionStrength;
    vec3 refractedColor = texture2D(uReflectionMap, vUv + refractionOffset).rgb;
    finalColor = mix(finalColor, refractedColor * waterColor, refractionStrength * 0.5);

    float sunSpec = max(dot(reflect(-uSunDirection, normal), viewDir), 0.0);
    sunSpec = pow(sunSpec, 32.0);
    finalColor += vec3(1.0, 0.95, 0.8) * sunSpec * 0.5;

    float alpha = 0.65 + fresnel * 0.3;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export class WaterMaterialManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.material = null;
    this.reflectionRT = null;
    this.reflectionCamera = null;
    this._frameCount = 0;
    this._skyColor = new THREE.Color(0x87ceeb);
    this._sunDirection = new THREE.Vector3(0.5, 1.0, 0.3).normalize();
    this._shallowColor = new THREE.Color(0x5ac8e8);
    this._deepColor = new THREE.Color(0x1a4a7a);
    this._reflectionStrength = 0.6;

    this._init();
  }

  _init() {
    this.reflectionRT = new THREE.WebGLRenderTarget(
      REFLECTION_RT_SIZE,
      REFLECTION_RT_SIZE,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
      }
    );

    this.reflectionCamera = this.camera.clone();

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSkyColor: { value: this._skyColor },
        uSunDirection: { value: this._sunDirection },
        uCameraPos: { value: new THREE.Vector3() },
        uShallowColor: { value: this._shallowColor },
        uDeepColor: { value: this._deepColor },
        uReflectionMap: { value: this.reflectionRT.texture },
        uReflectionStrength: { value: this._reflectionStrength },
      },
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  setSkyColor(color) {
    this._skyColor.copy(color);
  }

  setSunDirection(dir) {
    this._sunDirection.copy(dir).normalize();
  }

  setWaterColors(shallow, deep) {
    this._shallowColor.setHex(shallow);
    this._deepColor.setHex(deep);
  }

  setReflectionStrength(strength) {
    this._reflectionStrength = strength;
    this.material.uniforms.uReflectionStrength.value = strength;
  }

  getMaterial() {
    return this.material;
  }

  update(dt, cameraPos, skyColor, sunDirection) {
    if (!this.material) return;
    this.material.uniforms.uTime.value += dt;

    if (cameraPos) {
      this.material.uniforms.uCameraPos.value.copy(cameraPos);
    }
    if (skyColor) {
      this.setSkyColor(skyColor);
    }
    if (sunDirection) {
      this.setSunDirection(sunDirection);
    }

    this._frameCount++;
    if (this._frameCount >= REFLECTION_UPDATE_INTERVAL) {
      this._frameCount = 0;
      this._updateReflection();
    }
  }

  _updateReflection() {
    if (!this.reflectionRT || !this.scene) return;

    this.reflectionCamera.position.copy(this.camera.position);
    this.reflectionCamera.position.y = -this.camera.position.y + 2 * (this.camera.position.y);
    this.reflectionCamera.up.set(0, -1, 0);
    this.reflectionCamera.updateMatrixWorld(true);

    const currentRT = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.reflectionRT);
    this.renderer.clear();
    this.renderer.render(this.scene, this.reflectionCamera);
    this.renderer.setRenderTarget(currentRT);
  }

  resize(width, height) {
    if (this.reflectionRT) {
      this.reflectionRT.setSize(REFLECTION_RT_SIZE, REFLECTION_RT_SIZE);
    }
  }

  dispose() {
    if (this.reflectionRT) {
      this.reflectionRT.dispose();
      this.reflectionRT = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
  }
}

export const WATER_COLORS = {
  shallow: 0x5ac8e8,
  deep: 0x1a4a7a,
  river: 0x4ab8d8,
  ocean_shallow: 0x7ad8f0,
  ocean_deep: 0x0a2a5a,
};

export { REFLECTION_RT_SIZE, REFLECTION_UPDATE_INTERVAL };
