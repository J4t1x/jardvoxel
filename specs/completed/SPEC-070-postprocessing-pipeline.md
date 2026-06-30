---
spec_id: SPEC-070
title: "Postprocessing Pipeline (SSAO + Bloom)"
priority: critical
estimated_time: 12h
depends_on: []
status: pending
phase: 1
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-070: Postprocessing Pipeline (SSAO + Bloom)

## Description

Implement Three.js EffectComposer with SSAO and UnrealBloomPass for cinematic lighting. The pass chain: RenderPass → SSAOPass → UnrealBloomPass → OutputPass.

## Requirements

### EffectComposer Setup
- Create `jardvoxel-survival-postprocessing.js` module
- EffectComposer replaces direct renderer.render() calls
- Pass chain: RenderPass (scene base) → SSAOPass (soft AO) → UnrealBloomPass (subtle glow) → OutputPass (tone mapping + color space)

### SSAO Configuration
- SSAO visible in corners and crevices
- Soft, not noisy
- Kernel radius: 8-16
- Min distance: 0.005, max distance: 0.1

### Bloom Configuration
- Strength: 0.15 (very subtle)
- Radius: 0.4
- Threshold: 0.85 (only bright objects: torches, lava, glowstone, moon)
- No visible artifacts on chunk edges

### Quality Toggle
- High: SSAO + Bloom (default for desktop)
- Medium: Bloom only
- Low: No postprocessing (direct render)
- Auto-switch based on FPS (if FPS < 45 for 3s, drop one tier)

### Integration
- Hook into existing render loop in `jardvoxel-survival-gameplay.js`
- Replace `this.renderer.render(this.scene, this.camera)` with `this.composer.render()`
- Resize handler updates composer dimensions

## Acceptance Criteria

- [ ] EffectComposer with RenderPass + SSAOPass + UnrealBloomPass + OutputPass
- [ ] SSAO visible in corners and crevices
- [ ] Bloom subtle on torches, lava, glowstone, moon
- [ ] No visible artifacts on chunk edges
- [ ] Performance: <3ms overhead per frame
- [ ] Quality toggle (High/Medium/Low) with auto-switch
- [ ] 60 FPS maintained on desktop with postprocessing active
- [ ] Resize correctly updates composer
- [ ] No console errors

## Files to Create/Modify

- **Create:** `core/jardvoxel-survival-postprocessing.js`
- **Modify:** `core/jardvoxel-survival-gameplay.js` (integrate composer into render loop)
- **Create:** `tests/postprocessing.test.js`
