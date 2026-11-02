import Phaser from 'phaser';
import { dokuCiz, yumusakDaire } from './Tuval.js';
import { rastgele, gauss } from './Rastgele.js';
import { kademe, kademeAdi } from '../fx/Quality.js';

const RENKLER = ['255,255,255', '222,232,255', '205,220,255', '255,244,224', '255,228,200'];

// Uzayda yildizlar goz kirpmaz (titreme atmosferden kaynaklanir): sabit parlaklikta cizilir
export function yildizDokusu(sahne, ayar = {}) {
  const katman = ayar.katman || 'uzak';
  return dokuCiz(sahne, `yildiz_${katman}_${kademeAdi()}`, 1700, 1000, (ctx, W, H) => {
    const r = rastgele(katman === 'uzak' ? 7 : 19);
    const temel = (kademe().yildiz * W * H) / (1280 * 720);

    if (katman === 'uzak') {
      // Samanyolu: soluk, capraz bir bant
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-0.42);
      for (let i = 0; i < 60; i++) {
        ctx.save();
        ctx.translate((r() - 0.5) * W * 1.3, gauss(r) * 70);
        ctx.scale(1, 0.35);
        yumusakDaire(ctx, 0, 0, 120 + r() * 160, '150,165,210', 0.035);
        ctx.restore();
      }
      for (let i = 0; i < temel * 1.2; i++) {
        ctx.globalAlpha = 0.2 + r() * 0.5;
        ctx.fillStyle = `rgb(${RENKLER[(r() * RENKLER.length) | 0]})`;
        ctx.fillRect((r() - 0.5) * W * 1.3, gauss(r) * 90, 0.9, 0.9);
      }
      ctx.restore();
    }

    const adet = katman === 'uzak' ? temel * 1.6 : temel * 0.22;
    for (let i = 0; i < adet; i++) {
      const x = r() * W;
      const y = r() * H;
      const boy = katman === 'uzak' ? 0.35 + Math.pow(r(), 3) * 0.9 : 0.7 + Math.pow(r(), 2.5) * 1.6;
      const renk = RENKLER[(r() * RENKLER.length) | 0];
      ctx.globalAlpha = 0.35 + r() * 0.65;
      ctx.fillStyle = `rgb(${renk})`;
      ctx.beginPath();
      ctx.arc(x, y, boy, 0, Math.PI * 2);
      ctx.fill();
      if (boy > 1.5) {
        ctx.globalAlpha = 1;
        yumusakDaire(ctx, x, y, boy * 6, renk, 0.22);
      }
    }
    ctx.globalAlpha = 1;
  });
}

export function gunesDokusu(sahne) {
  dokuCiz(sahne, 'p_hayalet', 128, 128, (c) => {
    yumusakDaire(c, 64, 64, 64, '255,255,255', 0.35);
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(64, 64, 52, 0, Math.PI * 2);
    c.stroke();
  });
  return dokuCiz(sahne, 'gunes', 512, 512, (c) => {
    c.globalCompositeOperation = 'lighter';
    yumusakDaire(c, 256, 256, 256, '255,236,200', 0.2);
    yumusakDaire(c, 256, 256, 110, '255,244,220', 0.6);
    yumusakDaire(c, 256, 256, 40, '255,255,255', 1);
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(256, 256, 14, 0, Math.PI * 2);
    c.fill();
    // Objektif izi: yatay ince parlama ve soluk isinlar
    c.save();
    c.translate(256, 256);
    c.scale(1, 0.025);
    yumusakDaire(c, 0, 0, 256, '190,215,255', 0.55);
    c.restore();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.3;
      const g = c.createLinearGradient(256, 256, 256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200);
      g.addColorStop(0, 'rgba(255,245,225,0.25)');
      g.addColorStop(1, 'rgba(255,245,225,0)');
      c.strokeStyle = g;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(256, 256);
      c.lineTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200);
      c.stroke();
    }
  });
}

export function gunesOlustur(sahne, ayar = {}) {
  const ADD = Phaser.BlendModes.ADD;
  const kap = sahne.add.container(0, 0);
  const isik = sahne.add.image(0, 0, gunesDokusu(sahne)).setBlendMode(ADD);
  // Objektif hayaletleri: gunesten ekran merkezine giden dogru uzerinde
  const hx = -(ayar.x || 0);
  const hy = -(ayar.y || 0);
  const hayaletler = [
    [0.55, 0.35, 0x9fd0ff],
    [1.1, 0.2, 0xffd8a8],
    [1.45, 0.6, 0xa8e8ff],
    [1.9, 0.3, 0xc8b8ff]
  ].map(([k, boy, renk]) =>
    sahne.add.image(hx * k, hy * k, 'p_hayalet').setScale(boy).setTint(renk).setAlpha(0.1).setBlendMode(ADD)
  );
  kap.add([isik, ...hayaletler]);

  // Beyaz isik parlamasi (cok guclu parlamalarda gorunur hale gelir)
  kap.olay = (ad) => {
    if (ad !== 'parla') return;
    sahne.tweens.add({ targets: isik, scale: 1.45, duration: 700, yoyo: true, hold: 700, ease: 'Sine.easeInOut' });
    sahne.tweens.add({ targets: hayaletler, alpha: 0.28, duration: 700, yoyo: true, hold: 700 });
  };
  return kap;
}
