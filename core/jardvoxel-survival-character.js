// ═══════════════════════════════════════════════════════════
// JardVoxel Survival — Procedural Character Body Generator
// SPEC-067: Procedural Player Body with third-person view
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { PRNG } from './jardvoxel-survival-engine.js';

// ═══════════════════════════════════════════════════════════
// Color Palettes
// ═══════════════════════════════════════════════════════════

const SKIN_PALETTE = [
  0xfdf0d4, 0xf6c7a0, 0xeab98c, 0xd4a373,
  0xc69368, 0xa67c52, 0x8d6346, 0x6b4a2f,
  0x5a3a24, 0x4a2c18, 0x3a2010, 0x2a1808,
];

const HAIR_PALETTE = [
  0x1a1a1a, 0x3b2a1a, 0x6b4a2a, 0x8b6b3a,
  0xc0a050, 0xd0a040, 0x8a2020, 0xaaaaaa, 0xcc4444,
];

const EYE_PALETTE = [
  0x4a7a9a, 0x2a5a3a, 0x6a4a2a, 0x1a1a1a, 0x6a8a6a, 0x4a3a6a,
];

const SHIRT_PALETTE = [
  0x7C3AED, 0x2563eb, 0x059669, 0xdc2626, 0xea580c,
  0x713f12, 0x1e3a8a, 0x831843, 0x365314, 0x155e75,
];

const PANTS_PALETTE = [
  0x1e293b, 0x292524, 0x44403c, 0x1c1917, 0x3730a3,
  0x552202, 0x14532d, 0x4a044e,
];

const SHOE_PALETTE = [
  0x1a1a1a, 0x3a2a1a, 0x5a3a2a, 0x2a2a2a, 0x4a3a2a,
];

const HAT_PALETTE = [
  0x1a1a1a, 0x2a3a2a, 0x4a2a1a, 0x6a2020, 0x1a3a6a,
];

const CAPE_PALETTE = [
  0x7C3AED, 0xdc2626, 0x059669, 0x2563eb, 0xea580c, 0x831843,
];

const HAIR_STYLES = ['bald', 'short', 'long', 'mohawk', 'bun', 'crew'];

// ═══════════════════════════════════════════════════════════
// CharacterGenerator — Seed → DNA → THREE.Group
// ═══════════════════════════════════════════════════════════

export class CharacterGenerator {
  static generateDNA(seed) {
    const rng = new PRNG(seed);

    const bodyRoll = rng.next();
    const bodyType = bodyRoll < 0.3 ? 'slim' : bodyRoll < 0.8 ? 'normal' : 'stocky';

    const skinColor = SKIN_PALETTE[Math.floor(rng.next() * SKIN_PALETTE.length)];
    const hairStyle = HAIR_STYLES[Math.floor(rng.next() * HAIR_STYLES.length)];
    const hairColor = HAIR_PALETTE[Math.floor(rng.next() * HAIR_PALETTE.length)];
    const eyeColor = EYE_PALETTE[Math.floor(rng.next() * EYE_PALETTE.length)];
    const eyeSize = 0.08 + rng.next() * 0.06;

    const shirtColor = SHIRT_PALETTE[Math.floor(rng.next() * SHIRT_PALETTE.length)];
    const pantsColor = PANTS_PALETTE[Math.floor(rng.next() * PANTS_PALETTE.length)];
    const shoeColor = SHOE_PALETTE[Math.floor(rng.next() * SHOE_PALETTE.length)];

    const hasBeard = hairStyle !== 'bald' && rng.next() < 0.35;
    const hasGlasses = rng.next() < 0.3;
    const hasHat = rng.next() < 0.2 && hairStyle !== 'mohawk';
    const hasCape = rng.next() < 0.15;

    const hatColor = HAT_PALETTE[Math.floor(rng.next() * HAT_PALETTE.length)];
    const capeColor = CAPE_PALETTE[Math.floor(rng.next() * CAPE_PALETTE.length)];

    const proportions = {
      head: 0.85 + rng.next() * 0.3,
      torso: 0.9 + rng.next() * 0.2,
      arms: 0.9 + rng.next() * 0.2,
      legs: 0.9 + rng.next() * 0.2,
    };

    return {
      seed, bodyType, skinColor, hairStyle, hairColor, eyeColor, eyeSize,
      shirtColor, pantsColor, shoeColor, hasBeard, beardColor: hairColor,
      hasGlasses, hasHat, hatColor, hasCape, capeColor, proportions,
    };
  }

  static generate(seed) {
    const dna = this.generateDNA(seed);
    return this._buildBody(dna);
  }

  dispose() {
    if (this.group) {
      this.group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      if (this.group.parent) this.group.parent.remove(this.group);
      this.group = null;
    }
  }

  static disposeGroup(group) {
    if (!group) return;
    group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    if (group.parent) group.parent.remove(group);
  }

  static _buildBody(dna) {
    const group = new THREE.Group();
    group.name = 'character';

    // Body type dimensions — shoulders wider than head, human-like proportions
    // Tuned so total model height ≈ 1.8 (matches PlayerController.playerHeight)
    const dims = {
      slim:   { torso: 0.42, arm: 0.16, leg: 0.18 },
      normal: { torso: 0.50, arm: 0.18, leg: 0.20 },
      stocky: { torso: 0.60, arm: 0.22, leg: 0.24 },
    };
    const d = dims[dna.bodyType];
    const p = dna.proportions;

    // Shared materials — one per color, reused across all meshes (performance)
    const matSkin = new THREE.MeshLambertMaterial({ color: dna.skinColor });
    const matShirt = new THREE.MeshLambertMaterial({ color: dna.shirtColor });
    const matPants = new THREE.MeshLambertMaterial({ color: dna.pantsColor });
    const matShoe = new THREE.MeshLambertMaterial({ color: dna.shoeColor });
    const matHair = new THREE.MeshLambertMaterial({ color: dna.hairColor });
    const matEye = new THREE.MeshLambertMaterial({ color: dna.eyeColor });

    // --- Head ---
    const headGroup = new THREE.Group();
    headGroup.name = 'head';

    const headSize = 0.40 * p.head;
    const skullGeo = new THREE.BoxGeometry(headSize, headSize, headSize);
    const skull = new THREE.Mesh(skullGeo, matSkin);
    headGroup.add(skull);

    // Nose — small box on front of face
    const noseGeo = new THREE.BoxGeometry(headSize * 0.12, headSize * 0.15, headSize * 0.08);
    const nose = new THREE.Mesh(noseGeo, matSkin);
    nose.position.set(0, -headSize * 0.05, headSize * 0.5 + 0.02);
    headGroup.add(nose);

    // Eyes — slightly larger, with white sclera
    const scleraGeo = new THREE.BoxGeometry(dna.eyeSize * 1.3, dna.eyeSize * 0.7, 0.02);
    const scleraMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const leftSclera = new THREE.Mesh(scleraGeo, scleraMat);
    leftSclera.position.set(-headSize * 0.22, headSize * 0.05, headSize * 0.5 + 0.01);
    headGroup.add(leftSclera);
    const rightSclera = new THREE.Mesh(scleraGeo, scleraMat);
    rightSclera.position.set(headSize * 0.22, headSize * 0.05, headSize * 0.5 + 0.01);
    headGroup.add(rightSclera);

    const eyeGeo = new THREE.BoxGeometry(dna.eyeSize, dna.eyeSize * 0.6, 0.02);
    const leftEye = new THREE.Mesh(eyeGeo, matEye);
    leftEye.position.set(-headSize * 0.22, headSize * 0.05, headSize * 0.5 + 0.02);
    headGroup.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, matEye);
    rightEye.position.set(headSize * 0.22, headSize * 0.05, headSize * 0.5 + 0.02);
    headGroup.add(rightEye);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(dna.eyeSize * 1.4, 0.025, 0.02);
    const leftBrow = new THREE.Mesh(browGeo, matHair);
    leftBrow.position.set(-headSize * 0.22, headSize * 0.2, headSize * 0.5 + 0.01);
    headGroup.add(leftBrow);
    const rightBrow = new THREE.Mesh(browGeo, matHair);
    rightBrow.position.set(headSize * 0.22, headSize * 0.2, headSize * 0.5 + 0.01);
    headGroup.add(rightBrow);

    // Mouth — small dark line
    const mouthGeo = new THREE.BoxGeometry(headSize * 0.3, headSize * 0.04, 0.02);
    const mouthMat = new THREE.MeshLambertMaterial({ color: 0x6b3a2a });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -headSize * 0.25, headSize * 0.5 + 0.01);
    headGroup.add(mouth);

    // Beard
    if (dna.hasBeard) {
      const beardGeo = new THREE.BoxGeometry(headSize * 0.9, headSize * 0.55, 0.05);
      const beard = new THREE.Mesh(beardGeo, matHair);
      beard.position.set(0, -headSize * 0.3, headSize * 0.45);
      headGroup.add(beard);
    }

    // Glasses
    if (dna.hasGlasses) {
      const frameGeo = new THREE.BoxGeometry(headSize * 1.1, 0.08, 0.03);
      const frameMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      const glasses = new THREE.Mesh(frameGeo, frameMat);
      glasses.position.set(0, headSize * 0.05, headSize * 0.5 + 0.02);
      headGroup.add(glasses);
    }

    // Hair
    this._buildHair(headGroup, dna, headSize, matHair);

    // Hat
    if (dna.hasHat) {
      this._buildHat(headGroup, dna, headSize);
    }

    // Neck — small connector between head and torso
    const neckGeo = new THREE.BoxGeometry(headSize * 0.35, 0.08, headSize * 0.35);
    const neck = new THREE.Mesh(neckGeo, matSkin);
    neck.position.y = -headSize * 0.5 - 0.04;
    headGroup.add(neck);

    // Position head at top of torso
    const torsoHeight = 0.62 * p.torso;
    headGroup.position.y = torsoHeight + headSize * 0.5 + 0.06;
    group.add(headGroup);

    // --- Torso --- slightly tapered (wider at shoulders)
    const torsoGeo = new THREE.BoxGeometry(d.torso, torsoHeight, d.torso * 0.5);
    const torso = new THREE.Mesh(torsoGeo, matShirt);
    torso.name = 'torso';
    torso.position.y = torsoHeight * 0.5;
    group.add(torso);

    // --- Arms --- positioned at shoulder height with slight forward offset
    const armHeight = 0.60 * p.arms;
    const armGeo = new THREE.BoxGeometry(d.arm, armHeight, d.arm);

    // Left arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.name = 'leftArm';
    const leftArm = new THREE.Mesh(armGeo, matShirt);
    leftArm.position.y = -armHeight * 0.5;
    leftArmGroup.add(leftArm);
    const handGeo = new THREE.BoxGeometry(d.arm * 0.9, armHeight * 0.22, d.arm * 0.9);
    const leftHand = new THREE.Mesh(handGeo, matSkin);
    leftHand.position.y = -armHeight * 0.95;
    leftArmGroup.add(leftHand);
    leftArmGroup.position.set(-d.torso * 0.5 - d.arm * 0.5 - 0.02, torsoHeight * 0.9, 0.02);
    group.add(leftArmGroup);

    // Right arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.name = 'rightArm';
    const rightArm = new THREE.Mesh(armGeo, matShirt);
    rightArm.position.y = -armHeight * 0.5;
    rightArmGroup.add(rightArm);
    const rightHand = new THREE.Mesh(handGeo, matSkin);
    rightHand.position.y = -armHeight * 0.95;
    rightArmGroup.add(rightHand);
    rightArmGroup.position.set(d.torso * 0.5 + d.arm * 0.5 + 0.02, torsoHeight * 0.9, 0.02);
    group.add(rightArmGroup);

    // --- Legs --- slightly separated, with shoe detail
    const legHeight = 0.62 * p.legs;
    const legGeo = new THREE.BoxGeometry(d.leg, legHeight, d.leg);

    // Left leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.name = 'leftLeg';
    const leftLeg = new THREE.Mesh(legGeo, matPants);
    leftLeg.position.y = -legHeight * 0.4;
    leftLegGroup.add(leftLeg);
    const leftShoeGeo = new THREE.BoxGeometry(d.leg * 1.1, legHeight * 0.18, d.leg * 1.4);
    const leftShoe = new THREE.Mesh(leftShoeGeo, matShoe);
    leftShoe.position.set(0, -legHeight * 0.85, d.leg * 0.2);
    leftLegGroup.add(leftShoe);
    leftLegGroup.position.set(-d.torso * 0.25, -torsoHeight * 0.5, 0);
    group.add(leftLegGroup);

    // Right leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.name = 'rightLeg';
    const rightLeg = new THREE.Mesh(legGeo, matPants);
    rightLeg.position.y = -legHeight * 0.4;
    rightLegGroup.add(rightLeg);
    const rightShoeGeo = new THREE.BoxGeometry(d.leg * 1.1, legHeight * 0.18, d.leg * 1.4);
    const rightShoe = new THREE.Mesh(rightShoeGeo, matShoe);
    rightShoe.position.set(0, -legHeight * 0.85, d.leg * 0.2);
    rightLegGroup.add(rightShoe);
    rightLegGroup.position.set(d.torso * 0.25, -torsoHeight * 0.5, 0);
    group.add(rightLegGroup);

    // --- Cape ---
    if (dna.hasCape) {
      const capeGeo = new THREE.PlaneGeometry(d.torso * 1.1, torsoHeight * 1.5);
      const capeMat = new THREE.MeshLambertMaterial({
        color: dna.capeColor, side: THREE.DoubleSide, transparent: true, opacity: 0.9,
      });
      const cape = new THREE.Mesh(capeGeo, capeMat);
      cape.name = 'cape';
      cape.position.set(0, torsoHeight * 0.4, -d.torso * 0.3);
      cape.rotation.x = 0.1;
      group.add(cape);
    }

    // Vertical offsets (used by CharacterAnimator to plant feet on the ground)
    // footOffset = distance from group origin down to the bottom of the shoes
    group.userData.footOffset = torsoHeight * 0.5 + legHeight * 0.94;
    group.userData.headTop = torsoHeight + headSize + 0.06;

    // Store references for animation
    group.userData.head = headGroup;
    group.userData.torso = torso;
    group.userData.leftArm = leftArmGroup;
    group.userData.rightArm = rightArmGroup;
    group.userData.leftLeg = leftLegGroup;
    group.userData.rightLeg = rightLegGroup;
    group.userData.cape = group.getObjectByName('cape');
    group.userData.dna = dna;

    return group;
  }

  static _buildHair(headGroup, dna, headSize, hairMat) {
    if (!hairMat) hairMat = new THREE.MeshLambertMaterial({ color: dna.hairColor });

    switch (dna.hairStyle) {
      case 'bald':
        break;

      case 'short': {
        const geo = new THREE.BoxGeometry(headSize * 1.02, 0.08, headSize * 1.02);
        const hair = new THREE.Mesh(geo, hairMat);
        hair.position.y = headSize * 0.5;
        headGroup.add(hair);
        break;
      }

      case 'long': {
        const topGeo = new THREE.BoxGeometry(headSize * 1.02, 0.1, headSize * 1.02);
        const top = new THREE.Mesh(topGeo, hairMat);
        top.position.y = headSize * 0.5;
        headGroup.add(top);
        // Side hair flowing down
        const sideGeo = new THREE.BoxGeometry(headSize * 1.02, headSize * 0.8, 0.08);
        const back = new THREE.Mesh(sideGeo, hairMat);
        back.position.set(0, -headSize * 0.1, -headSize * 0.5);
        headGroup.add(back);
        // Left side
        const leftGeo = new THREE.BoxGeometry(0.08, headSize * 0.8, headSize * 1.02);
        const left = new THREE.Mesh(leftGeo, hairMat);
        left.position.set(-headSize * 0.5, -headSize * 0.1, 0);
        headGroup.add(left);
        // Right side
        const right = new THREE.Mesh(leftGeo, hairMat);
        right.position.set(headSize * 0.5, -headSize * 0.1, 0);
        headGroup.add(right);
        break;
      }

      case 'mohawk': {
        const geo = new THREE.BoxGeometry(headSize * 0.2, headSize * 0.5, headSize * 0.4);
        const mohawk = new THREE.Mesh(geo, hairMat);
        mohawk.position.y = headSize * 0.7;
        headGroup.add(mohawk);
        break;
      }

      case 'bun': {
        const baseGeo = new THREE.BoxGeometry(headSize * 1.02, 0.06, headSize * 1.02);
        const base = new THREE.Mesh(baseGeo, hairMat);
        base.position.y = headSize * 0.5;
        headGroup.add(base);
        const bunGeo = new THREE.BoxGeometry(headSize * 0.4, headSize * 0.4, headSize * 0.4);
        const bun = new THREE.Mesh(bunGeo, hairMat);
        bun.position.y = headSize * 0.8;
        headGroup.add(bun);
        break;
      }

      case 'crew': {
        const geo = new THREE.BoxGeometry(headSize * 1.01, 0.04, headSize * 1.01);
        const hair = new THREE.Mesh(geo, hairMat);
        hair.position.y = headSize * 0.48;
        headGroup.add(hair);
        break;
      }
    }
  }

  static _buildHat(headGroup, dna, headSize) {
    const hatMat = new THREE.MeshLambertMaterial({ color: dna.hatColor });
    const brimGeo = new THREE.BoxGeometry(headSize * 1.3, 0.06, headSize * 1.3);
    const brim = new THREE.Mesh(brimGeo, hatMat);
    brim.position.y = headSize * 0.52;
    headGroup.add(brim);
    const crownGeo = new THREE.BoxGeometry(headSize * 1.0, headSize * 0.35, headSize * 1.0);
    const crown = new THREE.Mesh(crownGeo, hatMat);
    crown.position.y = headSize * 0.72;
    headGroup.add(crown);
  }
}

// ═══════════════════════════════════════════════════════════
// CharacterAnimator — Walk, idle, arm swing, cape flutter
// ═══════════════════════════════════════════════════════════

export class CharacterAnimator {
  constructor() {
    this.walkPhase = 0;
    this.minePhase = 0;
    this.idleTime = 0;
    this.baseY = 0;
    this._jumpBlend = 0;
  }

  update(dt, player, body) {
    if (!body) return;

    const ud = body.userData;
    if (!ud.head) return;

    // Plant feet on the ground: player.position is the eye/head-top, feet are
    // playerHeight below it. footOffset is the distance from the model origin
    // down to the soles, so origin sits at feetY + footOffset.
    const playerHeight = player.playerHeight || 1.8;
    const footOffset = ud.footOffset || 0;
    const feetY = player.position.y - playerHeight;
    const groundY = feetY + footOffset;

    // Position body at player position
    body.position.x = player.position.x;
    body.position.z = player.position.z;
    body.position.y = groundY;
    body.rotation.y = player.yaw;

    // Determine state
    const moving = (player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z) > 0.5;
    const mining = player._mining || false;
    const airborne = !player.onGround && !player.flying;

    if (moving && !airborne) {
      this.walkPhase += dt * 9;
    } else {
      this.walkPhase += dt * 2;
    }

    this.idleTime += dt;
    if (mining) this.minePhase += dt * 7;

    // Jump blend — smooth transition for jump pose
    if (airborne) {
      this._jumpBlend = Math.min(1, this._jumpBlend + dt * 5);
    } else {
      this._jumpBlend = Math.max(0, this._jumpBlend - dt * 5);
    }

    // Walk animation — improved with smoother swing and slight knee bend
    if (moving && !airborne) {
      const swing = 0.55;
      const armSwing = Math.sin(this.walkPhase) * swing;
      const legSwing = Math.sin(this.walkPhase) * swing;
      ud.leftArm.rotation.x = armSwing;
      ud.rightArm.rotation.x = -armSwing;
      ud.leftLeg.rotation.x = -legSwing;
      ud.rightLeg.rotation.x = legSwing;
      // Subtle vertical bob
      const bob = Math.abs(Math.sin(this.walkPhase)) * 0.05;
      body.position.y = groundY + bob;
      // Slight forward lean when walking
      body.rotation.x = 0.06;
    } else {
      // Lerp back to neutral
      const lerpAmt = 0.12;
      ud.leftArm.rotation.x = this._lerpAngle(ud.leftArm.rotation.x, 0, lerpAmt);
      ud.rightArm.rotation.x = this._lerpAngle(ud.rightArm.rotation.x, 0, lerpAmt);
      ud.leftLeg.rotation.x = this._lerpAngle(ud.leftLeg.rotation.x, 0, lerpAmt);
      ud.rightLeg.rotation.x = this._lerpAngle(ud.rightLeg.rotation.x, 0, lerpAmt);
      body.position.y = groundY;
      body.rotation.x = this._lerpAngle(body.rotation.x, 0, lerpAmt);

      // Idle breathing — subtle torso scale + arm sway
      if (!airborne) {
        const breath = Math.sin(this.idleTime * 1.5) * 0.012;
        if (ud.torso) ud.torso.scale.y = 1 + breath;
        // Subtle arm sway
        ud.leftArm.rotation.x = Math.sin(this.idleTime * 0.8) * 0.03;
        ud.rightArm.rotation.x = -Math.sin(this.idleTime * 0.8) * 0.03;
      }
    }

    // Jump pose — arms up, legs slightly bent
    if (this._jumpBlend > 0) {
      const jb = this._jumpBlend;
      ud.leftArm.rotation.x = this._lerpAngle(ud.leftArm.rotation.x, -1.2, jb);
      ud.rightArm.rotation.x = this._lerpAngle(ud.rightArm.rotation.x, -1.2, jb);
      ud.leftLeg.rotation.x = this._lerpAngle(ud.leftLeg.rotation.x, 0.3, jb);
      ud.rightLeg.rotation.x = this._lerpAngle(ud.rightLeg.rotation.x, 0.3, jb);
    }

    // Mining arm swing (right arm)
    if (mining) {
      const mineSwing = Math.sin(this.minePhase * 3.5) * 0.7;
      ud.rightArm.rotation.x = -1.3 + mineSwing;
      // Slight torso twist
      if (ud.torso) ud.torso.rotation.y = mineSwing * 0.05;
    } else if (ud.torso) {
      ud.torso.rotation.y = this._lerpAngle(ud.torso.rotation.y, 0, 0.1);
    }

    // Reset torso scale when moving
    if (moving && ud.torso) {
      ud.torso.scale.y = 1;
    }

    // Cape flutter — more dynamic
    if (ud.cape) {
      let flutter = 0.12 + Math.sin(this.idleTime * 3) * 0.04;
      if (moving) {
        flutter += Math.sin(this.walkPhase * 2) * 0.18;
      }
      if (airborne) {
        flutter += 0.25;
      }
      ud.cape.rotation.x = flutter;
    }

    // Head subtle look toward camera in third person
    if (player.viewMode === 'third' && ud.head) {
      const lookOffset = Math.sin(this.idleTime * 0.3) * 0.02;
      ud.head.rotation.y = lookOffset;
    }
  }

  _lerpAngle(current, target, t) {
    return current + (target - current) * t;
  }
}
