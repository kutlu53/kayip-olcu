import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import HubScene from './scenes/HubScene.js';
import CutsceneScene from './scenes/CutsceneScene.js';
import CutsceneOverlay from './scenes/CutsceneOverlay.js';
import Level1Uyanis from './scenes/levels/Level1Uyanis.js';
import Level2KorPusula from './scenes/levels/Level2KorPusula.js';
import Level4Kenetlenme from './scenes/levels/Level4Kenetlenme.js';

// Test icin cizici secimi: ?cizici=canvas (WebGL olmayan eski akilli tahtalari taklit eder)
const cizici = new URLSearchParams(location.search).get('cizici') === 'canvas' ? Phaser.CANVAS : Phaser.AUTO;

// Sahne boyutu sabit 1280x720; FIT ile her ekrana olceklenir (akilli tahta, tablet, telefon)
new Phaser.Game({
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
  scene: [BootScene, MenuScene, HubScene, CutsceneScene, CutsceneOverlay, Level1Uyanis, Level2KorPusula, Level4Kenetlenme]
});
