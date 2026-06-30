---
spec_id: SPEC-072
title: "Soft Shadow Enhancement"
priority: critical
estimated_time: 8h
depends_on: []
status: pending
phase: 1
created_at: 2026-06-28
updated_at: 2026-06-28
---

# SPEC-072: Soft Shadow Enhancement

## Description

Enhance existing PCFSoft 2048x2048 shadows with cascaded shadow maps (3 cascades), higher resolution for near field, and distance-based blur.

## Requirements

### Shadow Map Enhancement
- Shadow map 4096x4096 for LOD 0 (near field)
- Shadow bias adjusted for voxel geometry (reduce acne)
- Shadow blur by distance: sharp near, soft far
- Cascaded shadow maps: 3 cascades (near 0-32, mid 32-96, far 96-256)
- Auto-disable shadows for LOD > 1 (already exists, maintain)

### Implementation
- Use THREE.PCFSoftShadowMap (already set, increase resolution)
- Implement CSM-like approach with 3 shadow cameras at different ranges
- Blend between cascades to avoid visible seams
- Bias tuning: normalBias = 0.05, bias = -0.0005

### Integration
- Modify shadow setup in `jardvoxel-survival-gameplay.js`
- Update shadow camera near/far based on player position
- Quality toggle: High (4096 + CSM), Medium (2048 single), Low (1024 single)

## Acceptance Criteria

- [ ] Shadow map 4096x4096 for near field
- [ ] 3 cascades with smooth blending
- [ ] Shadow bias tuned (no acne, no peter-panning)
- [ ] Distance-based blur (sharp near, soft far)
- [ ] Shadows auto-disable for LOD > 1
- [ ] Quality toggle works
- [ ] No FPS impact >10% at High quality
- [ ] No console errors

## Files to Modify

- **Modify:** `core/jardvoxel-survival-gameplay.js` (shadow setup, CSM logic)
- **Create:** `tests/shadow.test.js`
