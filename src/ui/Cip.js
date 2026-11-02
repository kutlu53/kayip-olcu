import { YAZI } from './tipografi.js';

const RENKLER = {
  normal: { dolgu: 0x0b1426, kenar: 0x5fe3e8, kenarAlfa: 0.6, yazi: '#E6F7FA' },
  secili: { dolgu: 0x1d3b52, kenar: 0x5fe3e8, kenarAlfa: 1, yazi: '#FFFFFF' },
  dogru: { dolgu: 0x0f2a2c, kenar: 0x5fe3e8, kenarAlfa: 1, yazi: '#5FE3E8' },
  yanlis: { dolgu: 0x2a1214, kenar: 0xd64545, kenarAlfa: 1, yazi: '#FF8A8A' },
  pasif: { dolgu: 0x0b1426, kenar: 0x3a4656, kenarAlfa: 0.6, yazi: '#5d6878' }
};

// Dokunulabilir cip (en az 48 px). durum: normal | secili | dogru | yanlis | pasif
export function cip(sahne, x, y, metin, tiklama, { genislik = 96, yukseklik = 52, boyut = 20, yaricap = 12 } = {}) {
  const kap = sahne.add.container(x, y);
  const g = sahne.add.graphics();
  const yazi = sahne.add.text(0, 0, metin, { fontFamily: YAZI, fontSize: `${boyut}px`, fontStyle: 'bold', color: '#E6F7FA', align: 'center' }).setOrigin(0.5);
  kap.add([g, yazi]);
  kap.durum = 'normal';
  kap.durumAyarla = (d) => {
    kap.durum = d;
    const r = RENKLER[d];
    g.clear();
    g.fillStyle(r.dolgu, 0.92).fillRoundedRect(-genislik / 2, -yukseklik / 2, genislik, yukseklik, yaricap);
    g.lineStyle(d === 'secili' ? 3 : 2, r.kenar, r.kenarAlfa).strokeRoundedRect(-genislik / 2, -yukseklik / 2, genislik, yukseklik, yaricap);
    yazi.setColor(r.yazi);
    return kap;
  };
  kap.yaziAyarla = (m) => yazi.setText(m);
  kap.durumAyarla('normal');
  kap.setSize(genislik, yukseklik).setInteractive({ useHandCursor: true });
  kap.on('pointerup', () => kap.durum !== 'pasif' && tiklama && tiklama(kap));
  return kap;
}
