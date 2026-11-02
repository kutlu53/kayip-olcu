import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import HubScene from './scenes/HubScene.js';
import CutsceneScene from './scenes/CutsceneScene.js';
import CutsceneOverlay from './scenes/CutsceneOverlay.js';
import Level1Uyanis from './scenes/levels/Level1Uyanis.js';
import Level2KorPusula from './scenes/levels/Level2KorPusula.js';
import Level3Romorkor from './scenes/levels/Level3Romorkor.js';
import Level5DortKuvvet from './scenes/levels/Level5DortKuvvet.js';
import Level6KimHareketEdiyor from './scenes/levels/Level6KimHareketEdiyor.js';
import Level4Kenetlenme from './scenes/levels/Level4Kenetlenme.js';

// Test icin cizici secimi: ?cizici=canvas (WebGL olmayan eski akilli tahtalari taklit eder)
const cizici = new URLSearchParams(location.search).get('cizici') === 'canvas' ? Phaser.CANVAS : Phaser.AUTO;

// Sahne boyutu sabit 1280x720; FIT ile her ekrana olceklenir (akilli tahta, tablet, telefon)
const oyun = new Phaser.Game({
  type: cizici,
  parent: 'oyun',
  backgroundColor: '#05070D',
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [BootScene, MenuScene, HubScene, CutsceneScene, CutsceneOverlay, Level1Uyanis, Level2KorPusula, Level3Romorkor, Level4Kenetlenme, Level5DortKuvvet, Level6KimHareketEdiyor]
});

// Yalnizca gelistirme sunucusunda: otomatik testler nesnelere yaziyla erisebilsin (yayin surumune girmez)
if (import.meta.env.DEV) window.oyun = oyun;
