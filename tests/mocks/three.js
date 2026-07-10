// Mock minimal de Three.js para tests del core de JardVoxel

export class Vector2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  set(x, y) { this.x = x; this.y = y; return this; }
}

export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  negate() { this.x = -this.x; this.y = -this.y; this.z = -this.z; return this; }
  normalize() {
    const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    if (len > 0) { this.x /= len; this.y /= len; this.z /= len; }
    return this;
  }
  length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
  clone() { return new Vector3(this.x, this.y, this.z); }
}

export class Color {
  constructor(hex = 0xffffff) { this.hex = hex; }
  setHex(hex) { this.hex = hex; return this; }
  copy(c) { this.hex = c.hex; return this; }
  lerp(c, t) { this.hex = Math.round(this.hex * (1 - t) + c.hex * t); return this; }
  clone() { return new Color(this.hex); }
}

export class Group {
  constructor() { this.children = []; this.position = new Vector3(); }
  add(child) { this.children.push(child); }
  remove(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) this.children.splice(idx, 1);
  }
}

export class Mesh {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    this.position = new Vector3();
    this.userData = {};
  }
}

export class BoxGeometry {
  constructor(w = 1, h = 1, d = 1) { this.width = w; this.height = h; this.depth = d; }
}

export class PointsMaterial {
  constructor(opts = {}) {
    this.color = new Color(opts.color || 0xffffff);
    this.size = opts.size || 1;
    this.transparent = opts.transparent || false;
    this.opacity = opts.opacity !== undefined ? opts.opacity : 1;
    this.depthWrite = opts.depthWrite !== undefined ? opts.depthWrite : true;
    this.sizeAttenuation = opts.sizeAttenuation !== undefined ? opts.sizeAttenuation : true;
    this.disposed = false;
  }
  dispose() { this.disposed = true; }
}

export class Points {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    this.frustumCulled = true;
    this.visible = true;
    this.position = new Vector3();
  }
}

export class MeshLambertMaterial {
  constructor(opts = {}) { this.color = opts.color || 0xffffff; }
}

export class PointLight {
  constructor(color, intensity, distance) {
    this.color = new Color(color);
    this.intensity = intensity;
    this.distance = distance;
    this.position = new Vector3();
    this.visible = true;
  }
}

export class AmbientLight {
  constructor(color, intensity) {
    this.color = new Color(color);
    this.intensity = intensity;
  }
}

export class DirectionalLight {
  constructor(color, intensity) {
    this.color = color;
    this.intensity = intensity;
    this.position = new Vector3();
    this.target = { position: new Vector3(), updateMatrixWorld: () => {} };
    this.castShadow = false;
    this.userData = {};
    this.shadow = {
      mapSize: { x: 512, y: 512, set: function(x, y) { this.x = x; this.y = y; } },
      camera: {
        near: 0.5, far: 200,
        left: -50, right: 50, top: 50, bottom: -50,
        updateProjectionMatrix: () => {},
      },
      bias: 0,
      normalBias: 0,
      map: null,
    };
  }
}

export const PCFSoftShadowMap = 2;

export class Fog {
  constructor(color, near, far) {
    this.color = new Color(color);
    this.near = near;
    this.far = far;
    this.isFog = true;
  }
}

export class FogExp2 {
  constructor(color, density) {
    this.color = new Color(color);
    this.density = density;
    this.isFogExp2 = true;
  }
}

export class Scene {
  constructor() { this.children = []; }
  add(child) { this.children.push(child); }
  remove(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) this.children.splice(idx, 1);
  }
}

export class PerspectiveCamera {
  constructor(fov, aspect, near, far) {
    this.fov = fov; this.aspect = aspect; this.near = near; this.far = far;
    this.position = new Vector3();
    this.up = new Vector3(0, 1, 0);
  }
  getWorldDirection(v) { v.set(0, 0, -1); return v; }
  updateMatrixWorld() {}
  clone() { const c = new PerspectiveCamera(this.fov, this.aspect, this.near, this.far); c.position.copy(this.position); c.up.copy(this.up); return c; }
}

export class Raycaster {
  constructor() { this.ray = { origin: new Vector3(), direction: new Vector3() }; }
  setFromCamera() {}
  intersectObjects() { return []; }
}

export const MathUtils = {
  clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
};

export class WebGLRenderer {
  constructor(opts = {}) {
    this.domElement = { width: 800, height: 600 };
    this.toneMapping = 0;
    this.toneMappingExposure = 1;
    this.shadowMap = { enabled: true, type: 0 };
  }
  render() {}
  setSize() {}
  setPixelRatio() {}
  dispose() {}
  getRenderTarget() { return null; }
  setRenderTarget() {}
  clear() {}
}

export class ShaderMaterial {
  constructor(opts = {}) {
    this.uniforms = opts.uniforms || {};
    this.vertexShader = opts.vertexShader || '';
    this.fragmentShader = opts.fragmentShader || '';
    this.transparent = opts.transparent || false;
    this.depthWrite = opts.depthWrite !== undefined ? opts.depthWrite : true;
    this.side = opts.side || 0;
    this.disposed = false;
  }
  dispose() { this.disposed = true; }
}

export class WebGLRenderTarget {
  constructor(w, h, opts = {}) {
    this.width = w;
    this.height = h;
    this.texture = { image: null };
    this.disposed = false;
  }
  setSize(w, h) { this.width = w; this.height = h; }
  dispose() { this.disposed = true; }
}

export class BufferGeometry {
  constructor() {
    this.attributes = {};
    this.index = null;
  }
  setAttribute(name, attr) { this.attributes[name] = attr; }
  setIndex(arr) { this.index = arr; }
  setDrawRange(start, count) { this.drawRange = { start, count }; }
  computeVertexNormals() {}
  dispose() {}
}

export class Float32BufferAttribute {
  constructor(array, itemSize) {
    this.array = array;
    this.itemSize = itemSize;
  }
}

export class Matrix4 {
  constructor() { this.elements = new Float32Array(16); }
  identity() { return this; }
  multiplyMatrices() { return this; }
}

export const DoubleSide = 2;
export const FrontSide = 1;
export const HalfFloatType = 1016;
export const LinearFilter = 1006;
export const NearestFilter = 1003;
export const RGBAFormat = 1023;
export const RedFormat = 1028;
export const ACESFilmicToneMapping = 4;

export class DataTexture {
  constructor(data, width, height, format) {
    this.image = { data, width, height };
    this.format = format;
    this.magFilter = LinearFilter;
    this.minFilter = LinearFilter;
    this.generateMipmaps = true;
    this.needsUpdate = false;
    this.disposed = false;
  }
  dispose() { this.disposed = true; }
}

export class MeshStandardMaterial {
  constructor(opts = {}) {
    this.vertexColors = opts.vertexColors || false;
    this.roughness = opts.roughness ?? 1;
    this.metalness = opts.metalness ?? 0;
    this.flatShading = opts.flatShading || false;
    this.side = opts.side ?? FrontSide;
    this.disposed = false;
  }
  dispose() { this.disposed = true; }
}

export class MeshToonMaterial {
  constructor(opts = {}) {
    this.vertexColors = opts.vertexColors || false;
    this.gradientMap = opts.gradientMap || null;
    this.side = opts.side ?? FrontSide;
    this.disposed = false;
  }
  dispose() { this.disposed = true; }
}
