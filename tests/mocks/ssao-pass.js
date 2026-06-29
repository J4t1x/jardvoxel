export class SSAOPass {
  constructor(scene, camera, width, height) {
    this.scene = scene;
    this.camera = camera;
    this.enabled = true;
    this.kernelRadius = 8;
    this.minDistance = 0.005;
    this.maxDistance = 0.1;
    this.setSize = () => {};
    this.dispose = () => {};
  }
}
