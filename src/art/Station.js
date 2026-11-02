import Phaser from 'phaser';
import { dokuCiz, tuval, boya, yumusakDaire, yuvarlakDikdortgen } from './Tuval.js';
import { titreme } from '../fx/Transitions.js';

// Goktürk-7 dis gorunusu. Doku merkezi (500, 260) = donen halkanin merkezi
const HALKA = { rx: 230, ry: 78 };
const PANELLER = [85, 745].flatMap((x) => [[x, 148], [x, 280]]);

function siluet(s) {
  s.fillStyle = s.strokeStyle = '#fff';
  s.lineWidth = 16;
  s.beginPath();
  s.ellipse(500, 260, HALKA.rx, HALKA.ry, 0, 0, Math.PI * 2);
  s.stroke();
  s.lineWidth = 5;
  for (const a of [0.8, 2.35, 3.95, 5.5]) {
    s.beginPath();
    s.moveTo(500, 260);
    s.lineTo(500 + HALKA.rx * Math.cos(a), 260 + HALKA.ry * Math.sin(a));
    s.stroke();
  }
  s.fillRect(70, 252, 860, 16);
  for (const [x, y] of PANELLER) s.fillRect(x, y, 170, 92);
  for (const x of [85, 745]) s.fillRect(x + 81, 238, 8, 44);
  s.fillRect(330, 268, 44, 74);
  s.fillRect(626, 268, 44, 74);
  yuvarlakDikdortgen(s, 388, 232, 224, 56, 26);
  s.fill();
  yuvarlakDikdortgen(s, 476, 150, 48, 96, 20);
  s.fill();
  s.beginPath();
  s.arc(500, 260, 36, 0, Math.PI * 2);
  s.fill();
  s.fillRect(488, 134, 24, 20);
  yuvarlakDikdortgen(s, 484, 286, 32, 54, 14);
  s.fill();
}

function ayrintilar(c) {
  // Gunes panelleri
  for (const [x, y] of PANELLER) {
    c.fillStyle = '#0b1a33';
    c.fillRect(x, y, 170, 92);
    c.strokeStyle = 'rgba(70,100,150,0.4)';
    c.lineWidth = 1;
    for (let i = 10; i < 170; i += 10) {
      c.beginPath();
      c.moveTo(x + i, y);
      c.lineTo(x + i, y + 92);
      c.stroke();
    }
    for (let j = 10; j < 92; j += 10) {
      c.beginPath();
      c.moveTo(x, y + j);
      c.lineTo(x + 170, y + j);
      c.stroke();
    }
    const parilti = c.createLinearGradient(x, y + 92, x + 120, y);
    parilti.addColorStop(0, 'rgba(255,235,210,0.22)');
    parilti.addColorStop(0.5, 'rgba(255,235,210,0)');
    c.fillStyle = parilti;
    c.fillRect(x, y, 170, 92);
  }
  // Kafes kiris
  c.strokeStyle = 'rgba(130,145,165,0.5)';
  c.lineWidth = 1.2;
  c.beginPath();
  for (let x = 70; x < 930; x += 12) {
    c.moveTo(x, 252);
    c.lineTo(x + 6, 268);
    c.lineTo(x + 12, 252);
  }
  c.stroke();
  // Radyatorler
  c.fillStyle = 'rgba(200,210,220,0.16)';
  c.fillRect(330, 268, 44, 74);
  c.fillRect(626, 268, 44, 74);
  // Modul bantlari ve ust kenar isigi
  c.fillStyle = 'rgba(0,0,0,0.35)';
  for (let x = 410; x < 600; x += 28) c.fillRect(x, 232, 2, 56);
  c.fillStyle = 'rgba(255,240,220,0.1)';
  c.fillRect(392, 234, 216, 5);
  c.fillRect(478, 152, 44, 4);
  // Halka eklem yerleri
  c.strokeStyle = 'rgba(0,0,0,0.45)';
  c.lineWidth = 2;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
    const x = 500 + HALKA.rx * Math.cos(a);
    const y = 260 + HALKA.ry * Math.sin(a);
    c.beginPath();
    c.moveTo(x - 4 * Math.cos(a), y - 8 * Math.sin(a) - 3);
    c.lineTo(x + 4 * Math.cos(a), y + 8 * Math.sin(a) + 3);
    c.stroke();
  }
  // Ad ve bayrak
  c.font = 'bold 11px "Segoe UI", Arial, sans-serif';
  c.fillStyle = 'rgba(205,215,225,0.6)';
  c.fillText('GÖKTÜRK-7', 410, 266);
  c.fillStyle = 'rgba(200,16,46,0.85)';
  c.fillRect(566, 250, 22, 14);
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(574, 257, 4.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(200,16,46,1)';
  c.beginPath();
  c.arc(575.3, 257, 3.4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#fff';
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? 0.7 : 1.7;
    c.lineTo(580 + Math.cos(a) * rr, 257 + Math.sin(a) * rr);
  }
  c.fill();
}

// isik: istasyondan isik kaynagina dogru birim yon. Kenar isigi o taraftan duser
export function istasyonDokusu(sahne, ayar = {}) {
  const isik = ayar.isik || [-0.95, 0.3];
  return dokuCiz(sahne, `istasyon_${isik.join('_')}`, 1000, 520, (ctx, W, H) => {
    const sil = tuval(W, H);
    siluet(sil.getContext('2d'));
    ctx.drawImage(boya(sil, '#fff1d6'), isik[0] * 3, isik[1] * 3);
    ctx.drawImage(
      boya(sil, (x) => {
        const g = x.createLinearGradient(W / 2 + isik[0] * 450, H / 2 + isik[1] * 450, W / 2 - isik[0] * 450, H / 2 - isik[1] * 450);
        g.addColorStop(0, '#3e4a5c');
        g.addColorStop(0.45, '#151c27');
        g.addColorStop(1, '#080c13');
        return g;
      }),
      0,
      0
    );
    ctx.globalCompositeOperation = 'source-atop';
    ayrintilar(ctx);
    ctx.globalCompositeOperation = 'source-over';
  });
}

function pencereDokusu(sahne) {
  return dokuCiz(sahne, 'istasyon_pencere', 1000, 520, (c) => {
    c.globalCompositeOperation = 'lighter';
    const nokta = (x, y) => {
      yumusakDaire(c, x, y, 6, '255,215,150', 0.35);
      c.fillStyle = 'rgba(255,230,180,0.95)';
      c.fillRect(x - 1, y - 1, 2, 2);
    };
    for (let x = 404; x < 600; x += 18) if ((x / 18) % 3 > 0.5) nokta(x, 262);
    for (let y = 165; y < 232; y += 16) nokta(500, y);
    for (let a = 0.25; a < 2.9; a += 0.22) nokta(500 + HALKA.rx * Math.cos(a), 262 + HALKA.ry * Math.sin(a));
  });
}

export function istasyonOlustur(sahne, ayar = {}) {
  const ADD = Phaser.BlendModes.ADD;
  const kap = sahne.add.container(0, 0);
  const govde = sahne.add.image(0, 0, istasyonDokusu(sahne, ayar));
  const pencere = sahne.add.image(0, 0, pencereDokusu(sahne)).setBlendMode(ADD);
  const halkaIsik = sahne.add.graphics().setBlendMode(ADD);
  kap.add([govde, pencere, halkaIsik]);
  const durum = { isik: 1 };

  // Halka doner (eylemsizlik: guc kesilse de donmeye devam eder)
  kap.guncelle = (zaman) => {
    halkaIsik.clear();
    if (durum.isik <= 0.01) return;
    const t = zaman / 1000;
    for (let i = 0; i < 14; i++) {
      const a = (i * Math.PI * 2) / 14 + t * 0.12;
      const onde = Math.sin(a) > 0;
      const x = HALKA.rx * Math.cos(a);
      const y = HALKA.ry * Math.sin(a) + 2;
      halkaIsik.fillStyle(0xbfe9ff, (onde ? 0.18 : 0.06) * durum.isik);
      halkaIsik.fillCircle(x, y, 6);
      halkaIsik.fillStyle(0xe6f7ff, (onde ? 1 : 0.35) * durum.isik);
      halkaIsik.fillCircle(x, y, 1.8);
    }
  };
  kap.olay = (ad) => {
    if (ad !== 'isiklariSondur') return;
    sahne.tweens.add({ targets: pencere, alpha: 0, duration: 1100, ease: titreme });
    sahne.tweens.add({ targets: durum, isik: 0, duration: 1100, ease: titreme });
  };
  return kap;
}

function kapsulDokusu(sahne) {
  return dokuCiz(sahne, 'kapsul', 28, 32, (c) => {
    c.beginPath();
    c.moveTo(10, 2);
    c.lineTo(18, 2);
    c.lineTo(26, 25);
    c.quadraticCurveTo(14, 31, 2, 25);
    c.closePath();
    const g = c.createLinearGradient(0, 0, 28, 0);
    g.addColorStop(0, '#4a5666');
    g.addColorStop(1, '#141a23');
    c.fillStyle = g;
    c.fill();
    // Alttan Dunya isigi
    c.strokeStyle = 'rgba(120,160,230,0.6)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(2, 25);
    c.quadraticCurveTo(14, 31, 26, 25);
    c.stroke();
  });
}

// Kurtarma kapsulleri istasyondan uzaklasir; uzaklastikca kucuk gorunur.
// Itici gazi kapsulun hizlandigi yonun tersine, yani istasyona dogru cikar
export function kapsullerOlustur(sahne) {
  const ADD = Phaser.BlendModes.ADD;
  const kap = sahne.add.container(0, 0);
  const ROTALAR = [
    { bas: [70, -40], son: [-150, 120], gecikme: 0 },
    { bas: [130, -10], son: [40, 160], gecikme: 900 },
    { bas: [20, -70], son: [-270, 50], gecikme: 1800 }
  ];
  const t0 = sahne.time.now;
  const kapsuller = ROTALAR.map((rota) => {
    const k = sahne.add.container(rota.bas[0], rota.bas[1]);
    const itici = sahne.add.image(0, 4, 'p_nokta').setTint(0xbfe6ff).setBlendMode(ADD).setScale(1.3);
    const govde = sahne.add.image(0, 0, kapsulDokusu(sahne));
    const isaret = sahne.add.image(0, -8, 'p_nokta').setBlendMode(ADD).setScale(0.7).setAlpha(0);
    k.add([itici, govde, isaret]);
    kap.add(k);
    return { k, itici, isaret, rota };
  });
  kap.guncelle = (zaman) => {
    for (const { k, itici, isaret, rota } of kapsuller) {
      const p = Phaser.Math.Clamp((zaman - t0 - rota.gecikme) / 9000, 0, 1);
      const e = 1 - Math.pow(1 - p, 2);
      k.setPosition(rota.bas[0] + (rota.son[0] - rota.bas[0]) * e, rota.bas[1] + (rota.son[1] - rota.bas[1]) * e);
      k.setScale(1.7 - 1.5 * e);
      itici.alpha = p < 0.3 ? 1 - p / 0.3 : 0;
      // Seyir flasi: 1,2 saniyede bir kisa yanip soner
      isaret.alpha = (zaman - rota.gecikme) % 1200 < 90 ? 1 : 0;
    }
  };
  return kap;
}
