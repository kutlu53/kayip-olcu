import Phaser from 'phaser';
import { dokuCiz, yumusakDaire } from '../art/Tuval.js';
import { kademe } from './Quality.js';

export function parcacikDokulari(sahne) {
  dokuCiz(sahne, 'p_nokta', 32, 32, (c) => yumusakDaire(c, 16, 16, 16, '255,255,255', 1));
  dokuCiz(sahne, 'p_kivilcim', 12, 12, (c) => {
    yumusakDaire(c, 6, 6, 6, '255,230,170', 1);
    c.fillStyle = '#fff';
    c.fillRect(5, 5, 2, 2);
  });
  dokuCiz(sahne, 'p_cizgi', 96, 4, (c) => {
    const g = c.createLinearGradient(0, 0, 96, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    c.fillStyle = g;
    c.fillRect(0, 1, 96, 2);
  });
  dokuCiz(sahne, 'gurultu', 256, 256, (c) => {
    const v = c.createImageData(256, 256);
    for (let i = 0; i < v.data.length; i += 4) {
      const n = Math.random() * 255;
      v.data[i] = v.data[i + 1] = v.data[i + 2] = n;
      v.data[i + 3] = 255;
    }
    c.putImageData(v, 0, 0);
  });
}

// Mikro yercekimi: kivilcimlar asagi dusmez, duz cizgide ilerler (yercekimi ivmesi yok)
export function kivilcimYayici(sahne, x, y) {
  return sahne.add.particles(x, y, 'p_kivilcim', {
    emitting: false,
    speed: { min: 60, max: 280 },
    angle: { min: 0, max: 360 },
    lifespan: { min: 450, max: 1300 },
    scale: { start: 1, end: 0.2 },
    alpha: { start: 1, end: 0 },
    blendMode: 'ADD',
    tint: [0xffffff, 0xffe7a8, 0xffc66b],
    maxAliveParticles: Math.min(80, kademe().parcacik)
  });
}

// Gunes ruzgari gozle gorulmez; ekranda sensor goruntusu olarak cizilir (CLAUDE.md §10.7)
export function parcacikAkisiYayici(sahne, x, y, yukseklik) {
  const k = kademe();
  return sahne.add.particles(x, y, 'p_cizgi', {
    emitting: false,
    emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-20, -yukseklik / 2, 40, yukseklik) },
    speedX: { min: 900, max: 1600 },
    speedY: { min: -25, max: 25 },
    lifespan: 1800,
    scaleX: { min: 0.4, max: 1.8 },
    alpha: { start: 0.5, end: 0 },
    blendMode: 'ADD',
    tint: 0xcabdff,
    frequency: Math.max(6, 3000 / k.parcacik),
    quantity: 2,
    maxAliveParticles: k.parcacik
  });
}
