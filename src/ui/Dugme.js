import { YAZI } from './tipografi.js';

// Hologram cam dugme. Dokunma hedefi en az 48 px (CLAUDE.md §0)
export function dugme(sahne, x, y, metin, tiklama, secenek = {}) {
  const { genislik = 320, yukseklik = 56, birincil = false, boyut = 20 } = secenek;
  const kap = sahne.add.container(x, y);
  const zemin = sahne.add.graphics();

  const ciz = (vurgu) => {
    zemin.clear();
    if (birincil) zemin.fillStyle(0x5fe3e8, vurgu ? 0.3 : 0.2);
    else zemin.fillStyle(0x0b1426, vurgu ? 0.9 : 0.7);
    zemin.fillRoundedRect(-genislik / 2, -yukseklik / 2, genislik, yukseklik, 10);
    zemin.lineStyle(2, 0x5fe3e8, vurgu ? 1 : 0.6);
    zemin.strokeRoundedRect(-genislik / 2, -yukseklik / 2, genislik, yukseklik, 10);
  };
  ciz(false);

  const yazi = sahne.add
    .text(0, 0, metin, {
      fontFamily: YAZI,
      fontSize: `${boyut}px`,
      color: '#E6F7FA',
      fontStyle: birincil ? 'bold' : 'normal'
    })
    .setOrigin(0.5);

  kap.add([zemin, yazi]);
  kap.setSize(genislik, yukseklik);
  kap.setInteractive({ useHandCursor: true });
  kap.on('pointerover', () => ciz(true));
  kap.on('pointerout', () => ciz(false));
  kap.on('pointerup', () => tiklama());
  kap.yaziAyarla = (m) => yazi.setText(m);
  return kap;
}
