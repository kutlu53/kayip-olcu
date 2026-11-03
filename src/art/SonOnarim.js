import Phaser from 'phaser';
import { dokuCiz } from './Tuval.js';
import { halkaCiz, nokta } from './Halka.js';
import { okCiz, STILLER } from '../systems/VectorDraw.js';
import { YAZI, MONO } from '../ui/tipografi.js';

// Hareket modelleri: her biri t (s) ve kutu p {x,y,w,h} icin { merkez, isaret } konumlarini verir ve kendini cizer.
// Fizik: yuvarlanan tekerlekte merkez duz gider, kenardaki nokta sikloit cizer; titresim sinusoidal (CLAUDE.md §2, §10.7)
const sarma = (deger, uzunluk) => ((deger % uzunluk) + uzunluk) % uzunluk;

export const HAREKETLER = {
  kargo: {
    durum(t, p) {
      const x = p.x + 40 + sarma(t * 55, p.w - 80);
      const y = p.y + p.h * 0.58;
      return { merkez: [x, y], isaret: [x + 14, y - 12] };
    },
    ciz(g, d, p) {
      g.lineStyle(3, 0x5d6878, 1).lineBetween(p.x + 10, p.y + p.h * 0.58 + 20, p.x + p.w - 10, p.y + p.h * 0.58 + 20);
      const [x, y] = d.merkez;
      g.fillStyle(0x8a96a6, 1).fillRect(x - 24, y - 18, 48, 36);
      g.lineStyle(2, 0x3a4656, 1).strokeRect(x - 24, y - 18, 48, 36).lineBetween(x - 24, y, x + 24, y);
    }
  },
  halka: {
    durum(t, p) {
      const c = [p.x + p.w / 2, p.y + p.h / 2 + 6];
      const aci = t * 45;
      return { merkez: c, isaret: nokta(c[0], c[1], 52, aci + 90), aci };
    },
    ciz(g, d) {
      halkaCiz(g, d.merkez[0], d.merkez[1], 52, d.aci, { kalinlik: 8 });
    }
  },
  anten: {
    // Darbeden sonra yayli baglantida asagi-yukari titresim
    durum(t, p) {
      const x = p.x + p.w / 2;
      const y = p.y + p.h * 0.42 + 16 * Math.sin(2 * Math.PI * 1.1 * t);
      return { merkez: [x, y], isaret: [x, y] };
    },
    ciz(g, d, p) {
      const [x, y] = d.merkez;
      const taban = p.y + p.h - 14;
      g.fillStyle(0x3a4656, 1).fillRect(x - 30, taban, 60, 8);
      g.lineStyle(2, 0xc3cad3, 1).beginPath().moveTo(x, taban);
      const adim = (taban - (y + 14)) / 8;
      for (let i = 1; i <= 8; i++) g.lineTo(x + (i % 2 ? 9 : -9), taban - adim * i);
      g.lineTo(x, y + 14).strokePath();
      g.fillStyle(0xd5dbe2, 1).fillEllipse(x, y, 66, 18);
      g.lineStyle(2, 0x8a96a6, 1).strokeEllipse(x, y, 66, 18).lineBetween(x, y, x, y - 18);
    }
  },
  tekerlek: {
    // Kaymadan yuvarlanma: merkez s kadar ilerlerken tekerlek s/r radyan doner
    durum(t, p) {
      const r = 24;
      const s = sarma(t * 50, p.w - 80);
      const x = p.x + 40 + s;
      const y = p.y + p.h - 18 - r;
      const fi = s / r;
      return { merkez: [x, y], isaret: [x - r * Math.sin(fi), y + r * Math.cos(fi)], fi, r };
    },
    ciz(g, d, p) {
      const [x, y] = d.merkez;
      g.lineStyle(3, 0x5d6878, 1).lineBetween(p.x + 10, y + d.r, p.x + p.w - 10, y + d.r);
      g.fillStyle(0x8a96a6, 1).fillRect(x - 30, y - 34, 60, 22);
      g.fillStyle(0x2b3542, 1).fillCircle(x, y, d.r);
      g.lineStyle(3, 0xc3cad3, 1).strokeCircle(x, y, d.r);
      for (const k of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        const a = d.fi + k;
        g.lineStyle(2, 0x8a96a6, 1).lineBetween(x, y, x - d.r * Math.sin(a), y + d.r * Math.cos(a));
      }
    }
  },
  kapak: {
    durum(t, p) {
      const x = p.x + 50 + sarma(t * 45, p.w - 100);
      const y = p.y + p.h / 2 + 6;
      return { merkez: [x, y], isaret: [x, y - 20] };
    },
    ciz(g, d, p) {
      const y = p.y + p.h / 2 + 6;
      g.lineStyle(2, 0x5d6878, 1).lineBetween(p.x + 10, y - 34, p.x + p.w - 10, y - 34).lineBetween(p.x + 10, y + 34, p.x + p.w - 10, y + 34);
      const [x] = d.merkez;
      g.fillStyle(0xa9b3bf, 1).fillRect(x - 34, y - 30, 68, 60);
      g.lineStyle(2, 0x3a4656, 1).strokeRect(x - 34, y - 30, 68, 60).strokeCircle(x, y, 12);
    }
  },
  panelMotoru: {
    durum(t, p) {
      const c = [p.x + p.w / 2, p.y + p.h / 2 + 6];
      const aci = t * 30;
      return { merkez: c, isaret: nokta(c[0], c[1], 50, aci), aci };
    },
    ciz(g, d) {
      const [cx, cy] = d.merkez;
      const a = (d.aci * Math.PI) / 180;
      const kose = [[-56, -18], [56, -18], [56, 18], [-56, 18]].map(([u, v]) => ({ x: cx + u * Math.cos(a) + v * Math.sin(a), y: cy - u * Math.sin(a) + v * Math.cos(a) }));
      g.fillStyle(0x0b1a33, 1).fillPoints(kose, true);
      g.lineStyle(2, 0x8a96a6, 1).strokePoints(kose, true);
      g.fillStyle(0x5d6878, 1).fillCircle(cx, cy, 8);
    }
  },
  radyator: {
    durum(t, p) {
      const x = p.x + p.w / 2 + 18 * Math.sin(2 * Math.PI * 1.4 * t);
      const y = p.y + p.h / 2 + 6;
      return { merkez: [x, y], isaret: [x, y] };
    },
    ciz(g, d, p) {
      const [x, y] = d.merkez;
      g.lineStyle(2, 0x5d6878, 1).lineBetween(p.x + p.w / 2, p.y + 18, p.x + p.w / 2, y - 34);
      g.fillStyle(0xd5dbe2, 1).fillRect(x - 22, y - 34, 44, 68);
      g.lineStyle(1.5, 0x8a96a6, 1);
      for (let k = -26; k <= 26; k += 9) g.lineBetween(x - 18, y + k, x + 18, y + k);
    }
  },
  reaksiyon: {
    durum(t, p) {
      const c = [p.x + p.w / 2, p.y + p.h / 2 + 6];
      const aci = -t * 140;
      return { merkez: c, isaret: nokta(c[0], c[1], 40, aci), aci };
    },
    ciz(g, d) {
      const [cx, cy] = d.merkez;
      g.fillStyle(0x2b3542, 1).fillCircle(cx, cy, 46);
      g.lineStyle(4, 0xc3cad3, 1).strokeCircle(cx, cy, 46);
      for (let k = 0; k < 6; k++) {
        const [x, y] = nokta(cx, cy, 42, d.aci + k * 60);
        g.lineStyle(2, 0x8a96a6, 1).lineBetween(cx, cy, x, y);
      }
    }
  },
  civata: {
    // Kopan civata: sabit hizla ilerlerken sabit hizla doner (mikro yercekimi)
    durum(t, p) {
      const s = sarma(t * 40, p.w - 70);
      const x = p.x + 35 + s;
      const y = p.y + p.h / 2 + 6 - s * 0.15;
      const aci = s * 3;
      return { merkez: [x, y], isaret: nokta(x, y, 22, aci), aci };
    },
    ciz(g, d) {
      const [x, y] = d.merkez;
      const a = (d.aci * Math.PI) / 180;
      const ux = Math.cos(a);
      const uy = -Math.sin(a);
      g.lineStyle(8, 0xa9b3bf, 1).lineBetween(x - ux * 22, y - uy * 22, x + ux * 14, y + uy * 14);
      g.lineStyle(14, 0x8a96a6, 1).lineBetween(x + ux * 12, y + uy * 12, x + ux * 22, y + uy * 22);
    }
  },
  yay: {
    durum(t, p) {
      const x = p.x + p.w / 2;
      const y = p.y + p.h * 0.62 + 18 * Math.sin(2 * Math.PI * 0.9 * t);
      return { merkez: [x, y], isaret: [x, y] };
    },
    ciz(g, d, p) {
      const [x, y] = d.merkez;
      const ust = p.y + 22;
      g.fillStyle(0x3a4656, 1).fillRect(x - 40, ust - 8, 80, 8);
      g.lineStyle(2, 0xc3cad3, 1).beginPath().moveTo(x, ust);
      const adim = (y - 16 - ust) / 8;
      for (let i = 1; i <= 8; i++) g.lineTo(x + (i % 2 ? 10 : -10), ust + adim * i);
      g.lineTo(x, y - 16).strokePath();
      g.fillStyle(0xe3b341, 0.9).fillRect(x - 18, y - 16, 36, 32);
      g.lineStyle(2, 0x5d6878, 1).strokeRect(x - 18, y - 16, 36, 32);
    }
  }
};

// Iz: son 4 saniyedeki konumlar. Sarmada (basa donus) cizgi kopar
export function izCiz(g, model, t, p, { merkezRenk = 0xe6e8eb, isaretRenk = 0x5fe3e8 } = {}) {
  for (const [anahtar, renk] of [['merkez', merkezRenk], ['isaret', isaretRenk]]) {
    let onceki = null;
    for (let k = 60; k >= 0; k--) {
      const tt = t - k * 0.066;
      if (tt < 0) continue;
      const n = model.durum(tt, p)[anahtar];
      if (onceki && Math.hypot(n[0] - onceki[0], n[1] - onceki[1]) < 30) g.lineStyle(2, renk, 0.25 + (0.6 * (60 - k)) / 60).lineBetween(onceki[0], onceki[1], n[0], n[1]);
      onceki = n;
    }
  }
}

// ---------- Ara sahne katmanlari ----------

// Ust atmosferin kizil parlamasi: istasyon alcaldikca artar (7A)
export function atmosferParlamaOlustur(sahne) {
  dokuCiz(sahne, 'atmosfer_parlama', 1700, 360, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 360);
    g.addColorStop(0, 'rgba(255,90,40,0)');
    g.addColorStop(0.6, 'rgba(255,110,50,0.35)');
    g.addColorStop(1, 'rgba(255,170,90,0.7)');
    c.fillStyle = g;
    c.fillRect(0, 0, 1700, 360);
  });
  const img = sahne.add.image(0, 0, 'atmosfer_parlama').setBlendMode(Phaser.BlendModes.ADD);
  img.guncelle = (zaman) => (img.alpha = 0.75 + 0.2 * Math.sin(zaman / 700));
  return img;
}

// Final: itici gazi geriye (sola) cikar, istasyon ileri (saga) itilir; bileske ok ileri
export function iticiAtesiOlustur(sahne, ayar = {}) {
  const kap = sahne.add.container(0, 0);
  const gaz = sahne.add.particles(0, 0, 'p_nokta', {
    emitting: false, speedX: { min: -420, max: -260 }, speedY: { min: -30, max: 30 }, lifespan: 900,
    scale: { start: 0.6, end: 2.4 }, alpha: { start: 0.5, end: 0 }, tint: 0xd8f0ff, blendMode: 'ADD', frequency: 25, quantity: 2
  });
  const ok = sahne.add.graphics();
  const oy = ayar.okY || 0;
  const yazi = sahne.add.text(40 + (ayar.okUzunluk || 150) + 12, oy - 12, `Bileşke: ${ayar.etiket || '6 kN ileri'}`, { fontFamily: YAZI, fontSize: '18px', fontStyle: 'bold', color: '#4A90E8' }).setAlpha(0);
  kap.add([gaz, ok, yazi]);
  kap.olay = (ad) => {
    if (ad !== 'atesle') return;
    gaz.start();
    const d = { u: 0 };
    sahne.tweens.add({
      targets: d, u: 1, duration: 1200,
      onUpdate: () => {
        ok.clear();
        okCiz(ok, 40, oy, 40 + (ayar.okUzunluk || 150) * d.u, oy, { ...STILLER.bileske, kalinlik: 8 });
      },
      onComplete: () => sahne.tweens.add({ targets: yazi, alpha: 1, duration: 400 })
    });
  };
  return kap;
}

// Yorunge diyagrami: alcalan (kirmizi) yorunge, duzeltmeden sonra guvenli (camgobegi) dairesel yorunge
export function yorungeDiyagramiOlustur(sahne) {
  const kap = sahne.add.container(0, 0);
  const g = sahne.add.graphics();
  const irtifa = sahne.add.text(-560, -220, '', { fontFamily: MONO, fontSize: '16px', color: '#D8F6FF' });
  const etiket = sahne.add.text(0, 0, 'DÜNYA', { fontFamily: MONO, fontSize: '14px', color: '#D8F6FF' }).setOrigin(0.5);
  kap.add([g, irtifa, etiket]);
  const d = { t: 0, duzelme: 0 };
  kap.guncelle = () => {
    g.clear();
    g.fillStyle(0x16305a, 1).fillCircle(0, 0, 120);
    g.lineStyle(10, 0xff5a3c, 0.25).strokeCircle(0, 0, 126);
    // Alcalan spiral: yaricap zamanla kuculur
    g.lineStyle(2, 0xff6b6b, 0.8).beginPath();
    for (let k = 0; k <= 240; k++) {
      const a = (k / 240) * Math.PI * 4;
      const r = 210 - (k / 240) * 70;
      if (k === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.strokePath();
    if (d.duzelme > 0) g.lineStyle(3, 0x5fe3e8, d.duzelme).strokeCircle(0, 0, 205);
    const a = d.t * 1.4;
    const r = d.duzelme > 0.5 ? 205 : 160 - 15 * Math.min(1, d.t / 6);
    g.fillStyle(0xffffff, 1).fillCircle(Math.cos(a) * r, Math.sin(a) * r, 6);
    const km = Math.round(d.duzelme > 0 ? 398 + 14 * d.duzelme : 398 - 2 * Math.min(1, d.t / 6));
    irtifa.setText(`İRTİFA: ${km} km`).setColor(d.duzelme > 0.9 ? '#5FE3E8' : '#FF8A8A');
  };
  sahne.tweens.add({ targets: d, t: 60, duration: 60000 });
  kap.olay = (ad) => {
    if (ad === 'duzelt') sahne.tweens.add({ targets: d, duzelme: 1, duration: 3500, ease: 'Sine.easeInOut' });
  };
  return kap;
}

// Final: yedi sistem rozeti sirayla parlar, ardindan kariyer karti
export function rozetlerOlustur(sahne, ayar = {}) {
  const kap = sahne.add.container(0, 0);
  const adlar = ayar.adlar || ['Uyanış', 'Kör Pusula', 'Römorkör', 'Kenetlenme', 'Dört Kuvvet', 'Kim Hareket Ediyor?', 'Son Onarım'];
  const rozetler = adlar.map((ad, i) => {
    const x = (i - 3) * 120;
    const g = sahne.add.graphics();
    g.fillStyle(0x0b1426, 0.9).fillCircle(x, -60, 40);
    g.lineStyle(3, 0x5fe3e8, 1).strokeCircle(x, -60, 40);
    const no = sahne.add.text(x, -60, String(i + 1), { fontFamily: YAZI, fontSize: '28px', fontStyle: 'bold', color: '#5FE3E8' }).setOrigin(0.5);
    const yazi = sahne.add.text(x, -8, ad, { fontFamily: YAZI, fontSize: '13px', color: '#D8F6FF', align: 'center', wordWrap: { width: 110 } }).setOrigin(0.5, 0);
    const r = sahne.add.container(0, 0, [g, no, yazi]).setAlpha(0);
    kap.add(r);
    return r;
  });
  const kart = sahne.add.text(0, 90, ayar.kariyer || '', { fontFamily: YAZI, fontSize: '19px', color: '#FFFFFF', align: 'center', wordWrap: { width: 820 }, lineSpacing: 6, backgroundColor: 'rgba(5,7,13,0.75)', padding: { x: 18, y: 12 } }).setOrigin(0.5, 0).setAlpha(0);
  kap.add(kart);
  kap.olay = (ad) => {
    if (ad === 'goster') rozetler.forEach((r, i) => sahne.tweens.add({ targets: r, alpha: 1, duration: 400, delay: i * 450 }));
    if (ad === 'kariyer') sahne.tweens.add({ targets: kart, alpha: 1, duration: 800 });
  };
  return kap;
}
