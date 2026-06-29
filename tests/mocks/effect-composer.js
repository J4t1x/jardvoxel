export class EffectComposer {
  constructor(renderer) {
    this.renderer = renderer;
    this.addPass = (pass) => { this.passes = this.passes || []; this.passes.push(pass); };
    this.render = () => {};
    this.setSize = () => {};
    this.dispose = () => {};
  }
}
