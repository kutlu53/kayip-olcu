import Phaser from 'phaser';
import { dokuCiz, yuvarlakDikdortgen, yumusakDaire } from './Tuval.js';
import { kivilcimYayici } from '../fx/Particles.js';

// Kopan gunes paneli: istasyondaki sag ust panelle ayni gorunum. Doku 200x120;
// panel dikdortgeninin merkezi doku merkezinin 10 px solunda (istasyona hizalama icin)
export const PANEL_KAYMA = 10;

export function gunesPaneliDokusu(sahne) {
  return dokuCiz(sahne, 'gunes_paneli', 200, 120, (c) => {
    c.fillStyle = '#0b1a33';
    c.fillRect(5, 14, 170, 92);
    c.strokeStyle = 'rgba(70,100,150,0.5)';
    c.lineWidth = 1;
    for (let i = 10; i < 170; i += 10) {
      c.beginPath();
      c.moveTo(5 + i, 14);
      c.lineTo(5 + i, 106);
      c.stroke();
    }
    for (let j = 10; j < 92; j += 10) {
      c.beginPath();
      c.moveTo(5, 14 + j);
      c.lineTo(175, 14 + j);
      c.stroke();
    }
    c.strokeStyle = '#8a96a6';
    c.lineWidth = 2;
    c.strokeRect(5, 14, 170, 92);
    const p = c.createLinearGradient(5, 106, 125, 14);
    p.addColorStop(0, 'rgba(255,235,210,0.22)');
    p.addColorStop(0.5, 'rgba(255,235,210,0)');
    c.fillStyle = p;
    c.fillRect(5, 14, 170, 92);
    // Kopuk direk parcasi
    c.fillStyle = '#5d6672';
    c.fillRect(86, 106, 8, 10);
    c.fillStyle = '#c3cad3';
    c.fillRect(86, 114, 3, 4);
    c.fillRect(91, 113, 3, 5);
  });
}

// Tamir dronu: kutu govde, kamera gozu, dort kol
export function dronDokusu(sahne) {
  return dokuCiz(sahne, 'tamir_dronu', 44, 34, (c) => {
    c.fillStyle = '#5d6672';
    for (const [x, y] of [[2, 4], [36, 4], [2, 24], [36, 24]]) c.fillRect(x, y, 6, 6);
    const g = c.createLinearGradient(0, 6, 0, 28);
    g.addColorStop(0, '#d5dbe2');
    g.addColorStop(1, '#7a8492');
    c.fillStyle = g;
    yuvarlakDikdortgen(c, 8, 6, 28, 22, 6);
    c.fill();
    c.globalCompositeOperation = 'lighter';
    yumusakDaire(c, 22, 17, 6, '95,227,232', 1);
    c.globalCompositeOperation = 'source-over';
  });
}

// Ara sahne katmani: ayar.surukle -> sabit hiz ve sabit donusle uzaklasir (surtunme yok);
// ayar.uzakta [dx, dy] -> o konumdan baslar, 'yerlestir' ile istasyondaki yerine itilir
export function kopukPanelOlustur(sahne, ayar = {}) {
  const ADD = Phaser.BlendModes.ADD;
  const kap = sahne.add.container(0, 0);
  const ic = sahne.add.container(0, 0);
  const panel = sahne.add.image(0, 0, gunesPaneliDokusu(sahne));
  ic.add(panel);
  const dronlar = [];
  if (ayar.dronlar) {
    // Dronlar paneli istasyona (sol asagi) iter; itici gazi ters yone, sag yukari cikar
    for (const [x, y] of [[70, -40], [70, 40]]) {
      const gaz = sahne.add.image(x + 22, y - 12, 'p_nokta').setBlendMode(ADD).setScale(0.9).setTint(0xbfe6ff);
      const d = sahne.add.image(x, y, dronDokusu(sahne)).setScale(0.8);
      ic.add([gaz, d]);
      dronlar.push(gaz, d);
    }
  }
  const parilti = sahne.add.graphics().setBlendMode(ADD);
  const kivilcim = kivilcimYayici(sahne, -PANEL_KAYMA, 50);
  ic.add([parilti, kivilcim]);
  kap.add(ic);
  if (ayar.uzakta) {
    ic.setPosition(ayar.uzakta[0], ayar.uzakta[1]);
    ic.rotation = ayar.donuk || 0;
  }
  const t0 = sahne.time.now;
  const durum = { parilti: -1 };

  kap.guncelle = (zaman) => {
    const t = (zaman - t0) / 1000;
    if (ayar.surukle) {
      ic.setPosition(22 * t, -14 * t);
      ic.rotation = 0.18 * t;
    }
    parilti.clear();
    if (durum.parilti >= 0 && durum.parilti <= 1) {
      // Hucreler gunesi yakalar: panel boyunca kayan isik bandi
      const x = -95 + durum.parilti * 170;
      parilti.fillStyle(0xfff6e0, 0.35).fillRect(x, -46, 14, 92);
    }
  };
  kap.olay = (ad, o = {}) => {
    if (ad === 'yerlestir') sahne.tweens.add({ targets: ic, x: 0, y: 0, rotation: 0, duration: o.sure || 5000, ease: 'Sine.easeInOut' });
    if (ad === 'kilitle') {
      kivilcim.explode(24);
      sahne.tweens.add({ targets: dronlar, alpha: 0, duration: 800 });
    }
    if (ad === 'parilti') sahne.tweens.add({ targets: durum, parilti: { from: 0, to: 1 }, duration: 1400, repeat: 1 });
  };
  return kap;
}
