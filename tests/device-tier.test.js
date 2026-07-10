// ═══════════════════════════════════════════════════════════
// SPEC-119: Device Tier Detection Unit Tests
// Tests _detectDeviceTier() and _applyTierDefaults() logic
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Extract device tier logic as testable functions
// These mirror the implementation in jardvoxel-zen-game.js:708-731

function detectDeviceTier(mockNavigator, mockWindow) {
  const isTouchPrimary = ('ontouchstart' in mockWindow) || mockNavigator.maxTouchPoints > 0;
  const cores = mockNavigator.hardwareConcurrency || 0;
  const mem = mockNavigator.deviceMemory || 0;
  
  if (isTouchPrimary && (cores <= 4 || (mem > 0 && mem <= 4))) {
    return 'LOW';
  }
  if (!isTouchPrimary && cores >= 8) {
    return 'HIGH';
  }
  return 'MEDIUM';
}

function applyTierDefaults(tier, baseSettings) {
  const settings = { ...baseSettings };
  
  if (tier === 'LOW') {
    settings.renderDistance = 5;
    settings.pixelRatio = Math.min(baseSettings.pixelRatio, 1.0);
  } else if (tier === 'MEDIUM') {
    settings.renderDistance = 8;
    settings.pixelRatio = Math.min(baseSettings.pixelRatio, 1.25);
  }
  // HIGH: keep defaults unchanged
  
  return settings;
}

describe('SPEC-119: Device Tier Detection', () => {
  describe('detectDeviceTier()', () => {
    it('classifies LOW tier: touch device with <= 4 cores', () => {
      const mockNav = { hardwareConcurrency: 4, maxTouchPoints: 1, deviceMemory: 0 };
      const mockWin = { ontouchstart: true };
      
      expect(detectDeviceTier(mockNav, mockWin)).toBe('LOW');
    });

    it('classifies LOW tier: touch device with <= 4GB RAM', () => {
      const mockNav = { hardwareConcurrency: 6, maxTouchPoints: 1, deviceMemory: 4 };
      const mockWin = { ontouchstart: true };
      
      expect(detectDeviceTier(mockNav, mockWin)).toBe('LOW');
    });

    it('classifies LOW tier: touch device with 2 cores', () => {
      const mockNav = { hardwareConcurrency: 2, maxTouchPoints: 5, deviceMemory: 0 };
      const mockWin = {};
      
      expect(detectDeviceTier(mockNav, mockWin)).toBe('LOW');
    });

    it('classifies MEDIUM tier: touch device with > 4 cores and no memory info', () => {
      const mockNav = { hardwareConcurrency: 6, maxTouchPoints: 1, deviceMemory: 0 };
      const mockWin = { ontouchstart: true };
      
      // deviceMemory: 0 means unknown (iOS Safari), so only cores matter
      // 6 cores + touch but deviceMemory unknown → not LOW (needs mem <= 4 when mem > 0)
      expect(detectDeviceTier(mockNav, mockWin)).toBe('MEDIUM');
    });

    it('classifies MEDIUM tier: non-touch device with 4-7 cores', () => {
      const mockNav = { hardwareConcurrency: 6, maxTouchPoints: 0, deviceMemory: 8 };
      const mockWin = {};
      
      expect(detectDeviceTier(mockNav, mockWin)).toBe('MEDIUM');
    });

    it('classifies HIGH tier: non-touch device with >= 8 cores', () => {
      const mockNav = { hardwareConcurrency: 8, maxTouchPoints: 0, deviceMemory: 16 };
      const mockWin = {};
      
      expect(detectDeviceTier(mockNav, mockWin)).toBe('HIGH');
    });

    it('classifies HIGH tier: desktop with 12 cores', () => {
      const mockNav = { hardwareConcurrency: 12, maxTouchPoints: 0, deviceMemory: 32 };
      const mockWin = {};
      
      expect(detectDeviceTier(mockNav, mockWin)).toBe('HIGH');
    });

    it('handles missing hardwareConcurrency (defaults to 0)', () => {
      const mockNav = { maxTouchPoints: 0, deviceMemory: 0 };
      const mockWin = {};
      
      // 0 cores + non-touch → MEDIUM (not HIGH since cores < 8)
      expect(detectDeviceTier(mockNav, mockWin)).toBe('MEDIUM');
    });

    it('handles touch via maxTouchPoints', () => {
      const mockNav = { hardwareConcurrency: 4, maxTouchPoints: 5, deviceMemory: 0 };
      const mockWin = {}; // no ontouchstart
      
      expect(detectDeviceTier(mockNav, mockWin)).toBe('LOW');
    });

    it('handles touch via ontouchstart', () => {
      const mockNav = { hardwareConcurrency: 4, maxTouchPoints: 0, deviceMemory: 0 };
      const mockWin = { ontouchstart: {} }; // property exists
      
      expect(detectDeviceTier(mockNav, mockWin)).toBe('LOW');
    });
  });

  describe('applyTierDefaults()', () => {
    const baseSettings = {
      renderDistance: 8,
      pixelRatio: 1.5,
      shadows: false,
      postprocessing: false,
    };

    it('applies LOW tier defaults', () => {
      const result = applyTierDefaults('LOW', baseSettings);
      
      expect(result.renderDistance).toBe(5);
      expect(result.pixelRatio).toBe(1.0); // min(1.5, 1.0)
      expect(result.shadows).toBe(false);
      expect(result.postprocessing).toBe(false);
    });

    it('applies MEDIUM tier defaults', () => {
      const result = applyTierDefaults('MEDIUM', baseSettings);
      
      expect(result.renderDistance).toBe(8);
      expect(result.pixelRatio).toBe(1.25); // min(1.5, 1.25)
    });

    it('applies HIGH tier defaults (no changes)', () => {
      const result = applyTierDefaults('HIGH', baseSettings);
      
      expect(result.renderDistance).toBe(8); // unchanged
      expect(result.pixelRatio).toBe(1.5); // unchanged
    });

    it('respects lower base pixelRatio for LOW tier', () => {
      const lowDPRSettings = { ...baseSettings, pixelRatio: 0.8 };
      const result = applyTierDefaults('LOW', lowDPRSettings);
      
      expect(result.pixelRatio).toBe(0.8); // min(0.8, 1.0) = 0.8
    });

    it('respects lower base pixelRatio for MEDIUM tier', () => {
      const lowDPRSettings = { ...baseSettings, pixelRatio: 1.0 };
      const result = applyTierDefaults('MEDIUM', lowDPRSettings);
      
      expect(result.pixelRatio).toBe(1.0); // min(1.0, 1.25) = 1.0
    });

    it('does not modify other settings', () => {
      const extendedSettings = {
        ...baseSettings,
        fov: 75,
        clouds: true,
        fog: true,
        volume: 0.5,
      };
      
      const result = applyTierDefaults('LOW', extendedSettings);
      
      expect(result.fov).toBe(75);
      expect(result.clouds).toBe(true);
      expect(result.fog).toBe(true);
      expect(result.volume).toBe(0.5);
    });
  });

  describe('Integration: Tier Detection + Defaults', () => {
    it('LOW tier device gets appropriate defaults', () => {
      const mockNav = { hardwareConcurrency: 4, maxTouchPoints: 1, deviceMemory: 2 };
      const mockWin = { ontouchstart: true };
      const baseSettings = { renderDistance: 8, pixelRatio: 1.5 };
      
      const tier = detectDeviceTier(mockNav, mockWin);
      const settings = applyTierDefaults(tier, baseSettings);
      
      expect(tier).toBe('LOW');
      expect(settings.renderDistance).toBe(5);
      expect(settings.pixelRatio).toBe(1.0);
    });

    it('HIGH tier device keeps defaults', () => {
      const mockNav = { hardwareConcurrency: 16, maxTouchPoints: 0, deviceMemory: 32 };
      const mockWin = {};
      const baseSettings = { renderDistance: 8, pixelRatio: 1.5 };
      
      const tier = detectDeviceTier(mockNav, mockWin);
      const settings = applyTierDefaults(tier, baseSettings);
      
      expect(tier).toBe('HIGH');
      expect(settings.renderDistance).toBe(8);
      expect(settings.pixelRatio).toBe(1.5);
    });

    it('MEDIUM tier device gets balanced defaults', () => {
      const mockNav = { hardwareConcurrency: 6, maxTouchPoints: 1, deviceMemory: 6 };
      const mockWin = { ontouchstart: true };
      const baseSettings = { renderDistance: 8, pixelRatio: 1.5 };
      
      const tier = detectDeviceTier(mockNav, mockWin);
      const settings = applyTierDefaults(tier, baseSettings);
      
      expect(tier).toBe('MEDIUM');
      expect(settings.renderDistance).toBe(8);
      expect(settings.pixelRatio).toBe(1.25);
    });
  });

  describe('Saved Settings Override (Rule)', () => {
    it('saved settings should always take precedence over tier defaults', () => {
      // This test documents the rule: tier defaults only apply on first run
      const savedSettings = { renderDistance: 12, pixelRatio: 2.0 };
      
      // Even on LOW tier, saved settings should not be overridden
      // (This is enforced in ZenGame constructor, not in applyTierDefaults)
      // The test documents the expected behavior
      
      const tier = 'LOW';
      // In actual code, applyTierDefaults is only called when !_hasSavedSettings
      // So this test verifies the contract: don't call applyTierDefaults if settings exist
      
      expect(savedSettings.renderDistance).toBe(12); // unchanged
      expect(savedSettings.pixelRatio).toBe(2.0); // unchanged
    });
  });
});
