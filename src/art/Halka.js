import Phaser from 'phaser';
import { dokuCiz, yuvarlakDikdortgen, yumusakDaire } from './Tuval.js';
import { YAZI, MONO } from '../ui/tipografi.js';
import { PEDAGOJIK } from '../config/colors.js';

// Acilar derece, saat yonunun tersine, +x (sag) ekseninden. Ekranda y asagi oldugu icin sin cikarilir
export const nokta = (cx, cy, r, derece) => {
  const a = (derece * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
};

// Donen halka (yapay yercekimi) + donmeyen merkez modul. aci: halkanin donus acisi; merkezAci: merkez modulun isaret acisi
export function halkaCiz(g, cx, cy, R, aci, { kalinlik = 14, alfa = 1, merkezAci = 0 } = {}) {
  g.lineStyle(kalinlik, 0x3a4656, alfa).strokeCircle(cx, cy, R);
  g.lineStyle(1.5, 0x8a96a6, 0.6 * alfa).strokeCircle(cx, cy, R + kalinlik / 2).strokeCircle(cx, cy, R - kalinlik / 2);
  g.lineStyle(Math.max(2, kalinlik * 0.35), 0x2b3542, alfa);
  for (const d of [45, 135, 225, 315]) {
    const [x1, y1] = nokta(cx, cy, R * 0.24, aci + d);
    const [x2, y2] = nokta(cx, cy, R - kalinlik / 2, aci + d);
    g.lineBetween(x1, y1, x2, y2);
  }
  g.fillStyle(0xffd79a, 0.8 * alfa);
  for (let d = 15; d < 360; d += 30) {
    const [x, y] = nokta(cx, cy, R, aci + d);
    g.fillCircle(x, y, Math.max(1.2, kalinlik * 0.12));
  }
  // Halkanin isareti: donusu gormek icin beyaz ucgen
  const dis = R + kalinlik / 2;
  const [ax, ay] = nokta(cx, cy, dis + 2, aci + 90);
  const [bx, by] = nokta(cx, cy, dis + 13, aci + 86);
  const [kx, ky] = nokta(cx, cy, dis + 13, aci + 94);
  g.fillStyle(0xffffff, alfa).fillTriangle(ax, ay, bx, by, kx, ky);
  // Merkez modul: donmez
  g.fillStyle(0x1d2633, alfa).fillCircle(cx, cy, R * 0.22);
  g.lineStyle(2, 0x8a96a6, alfa).strokeCircle(cx, cy, R * 0.22);
  const [mx, my] = nokta(cx, cy, R * 0.22 - 5, merkezAci + 90);
  g.fillStyle(0x5fe3e8, alfa).fillCircle(mx, my, 3);
}

export function dunyaSimgesi(g, x, y, r) {
  g.fillStyle(0x16305a, 1).fillCircle(x, y, r);
  g.fillStyle(0x24508a, 1).fillCircle(x - r * 0.2, y - r * 0.2, r * 0.7);
  g.lineStyle(2, 0x6fa8e8, 0.8).strokeCircle(x, y, r + 2);
}

// Halkanin icindeki bir nesne: ayaklari disa (zemine) bakacak bicimde dondurulur
export const zemineDondur = (dunyaAci) => {
  const a = (dunyaAci * Math.PI) / 180;
  // Yerel +y (ayaklar) disa bakmali: (-sin r, cos r) = (cos a, -sin a)
  return Math.atan2(-Math.cos(a), -Math.sin(a));
};

export function kargoRobotuDokusu(sahne) {
  return dokuCiz(sahne, 'kargo_robotu', 28, 28, (c) => {
    c.fillStyle = '#2b3542';
    c.fillRect(4, 22, 7, 5);
    c.fillRect(17, 22, 7, 5);
    const g = c.createLinearGradient(0, 6, 0, 22);
    g.addColorStop(0, '#e6e8eb');
    g.addColorStop(1, '#8a96a6');
    c.fillStyle = g;
    yuvarlakDikdortgen(c, 3, 7, 22, 16, 4);
    c.fill();
    c.fillStyle = '#3a4656';
    c.fillRect(7, 11, 14, 5);
    c.strokeStyle = '#c3cad3';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(14, 7);
    c.lineTo(14, 2);
    c.stroke();
    c.globalCompositeOperation = 'lighter';
    yumusakDaire(c, 14, 2, 4, '95,227,232', 1);
  });
}

// 6K ara sahnesi: firtina uyarisinin kaydi. Merkez module gore bakilir; halka doner, anten halkayla birlikte doner
export function uyariKaydiOlustur(sahne) {
  const kap = sahne.add.container(0, 0);
  const g = sahne.add.graphics();
  const R = 130;
  const M = [0, -70];
  const DUNYA = [0, 720];
  const DUNYA_R = 480;
  const baslik = sahne.add.text(-560, -230, 'KAYIT · MERKEZ MODÜLE GÖRE', { fontFamily: MONO, fontSize: '15px', color: '#5FE3E8' });
  const aciYazi = sahne.add.text(-560, -205, '', { fontFamily: MONO, fontSize: '14px', color: '#D8F6FF' });
  const yerKontrol = sahne.add.text(0, 232, 'YER KONTROL', { fontFamily: YAZI, fontSize: '16px', fontStyle: 'bold', color: '#D8F6FF' }).setOrigin(0.5);
  kap.add([g, baslik, aciYazi, yerKontrol]);
  const d = { halka: 0, anten: 270, isin: 0, isinAci: null, alindi: false };

  kap.guncelle = () => {
    g.clear();
    g.fillStyle(0x16305a, 1).fillCircle(DUNYA[0], DUNYA[1], DUNYA_R);
    g.lineStyle(3, d.alindi ? 0x5fe3e8 : 0x6fa8e8, d.alindi ? 1 : 0.7).strokeCircle(DUNYA[0], DUNYA[1], DUNYA_R + 2);
    halkaCiz(g, M[0], M[1], R, d.halka, { kalinlik: 18 });
    // Anten: halkanin uzerinde, disa bakan
    const dunyaAci = d.anten + d.halka;
    const [ax, ay] = nokta(M[0], M[1], R + 9, dunyaAci);
    const [bx, by] = nokta(M[0], M[1], R + 26, dunyaAci);
    g.lineStyle(6, 0xe6e8eb, 1).lineBetween(ax, ay, bx, by);
    g.fillStyle(0xe6e8eb, 1).fillCircle(bx, by, 7);
    if (d.isinAci !== null && d.isin > 0) {
      const [ex, ey] = nokta(M[0], M[1], R + 26 + d.isin, d.isinAci);
      g.lineStyle(5, PEDAGOJIK.vektor, 0.95).lineBetween(bx, by, ex, ey);
    }
    aciYazi.setText(`halka dönüşü: ${Math.round(d.halka)}°   anten (halkaya göre): ${Math.round(d.anten)}°`);
    yerKontrol.setText(d.alindi ? 'YER KONTROL · UYARI ALINDI' : 'YER KONTROL').setColor(d.alindi ? '#5FE3E8' : '#D8F6FF');
  };

  const atesle = (uzunluk, bitince) => {
    d.isinAci = d.anten + d.halka;
    d.isin = 0;
    sahne.tweens.add({ targets: d, isin: uzunluk, duration: 1100, ease: 'Quad.easeIn', onComplete: bitince });
  };
  kap.olay = (ad) => {
    if (ad === 'yanlis') {
      d.isinAci = null;
      sahne.tweens.add({ targets: d, halka: 120, duration: 3200, ease: 'Sine.easeInOut', onComplete: () => atesle(520) });
    }
    if (ad === 'dogru') {
      d.isinAci = null;
      d.alindi = false;
      sahne.tweens.add({ targets: d, anten: 150, duration: 2200, ease: 'Sine.easeInOut', onComplete: () => atesle(130, () => (d.alindi = true)) });
    }
  };
  return kap;
}
