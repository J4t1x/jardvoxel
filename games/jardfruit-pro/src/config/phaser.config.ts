import Phaser from 'phaser';
import { BootScene } from '@scenes/BootScene';
import { MenuScene } from '@scenes/MenuScene';
import { SlotScene } from '@scenes/SlotScene';
import { BonusScene } from '@scenes/BonusScene';
import { GambleScene } from '@scenes/GambleScene';
import { MysteryScene } from '@scenes/MysteryScene';
import { InfoScene } from '@scenes/InfoScene';
import { TutorialScene } from '@scenes/TutorialScene';

export const SCENES = {
  BOOT: 'Boot',
  MENU: 'Menu',
  SLOT: 'Slot',
  BONUS: 'Bonus',
  GAMBLE: 'Gamble',
  MYSTERY: 'Mystery',
  INFO: 'Info',
  TUTORIAL: 'Tutorial',
} as const;

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#0d0d1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, SlotScene, BonusScene, GambleScene, MysteryScene, InfoScene, TutorialScene],
  render: {
    antialias: true,
    roundPixels: true,
  },
};
