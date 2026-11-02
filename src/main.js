import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import CutsceneScene from './scenes/CutsceneScene.js';
import CutsceneOverlay from './scenes/CutsceneOverlay.js';

// Sahne boyutu sabit 1280x720; FIT ile her ekrana olceklenir (akilli tahta, tablet, telefon)
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'oyun',
  backgroundColor: '#05070D',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [BootScene, MenuScene, CutsceneScene, CutsceneOverlay]
});
