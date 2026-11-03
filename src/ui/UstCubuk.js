import { YAZI, MONO, aralikli } from './tipografi.js';
import { dugme } from './Dugme.js';

export const UST_YUKSEKLIK = 64;
const SISTEM_SAYISI = 7;

// Ust cubuk (CLAUDE.md §6): yorunge geri sayimi (yalnizca hikaye gerilimi), istasyon sagligi, acilan sistemler
export function ustCubuk(sahne, { menuye, menuEtiketi = 'Menü' } = {}) {
  const kap = sahne.add.container(0, 0).setDepth(500);
  const zemin = sahne.add.graphics();
  zemin.fillStyle(0x05070d, 0.88).fillRect(0, 0, 1280, UST_YUKSEKLIK);
  zemin.lineStyle(1.5, 0x5fe3e8, 0.35).lineBetween(0, UST_YUKSEKLIK, 1280, UST_YUKSEKLIK);

  const etiket = { fontFamily: MONO, fontSize: '11px', color: '#8A96A6' };
  const sayacEtiket = sahne.add.text(24, 10, aralikli('YÖRÜNGE DÜZELTMESİ'), etiket);
  const sayac = sahne.add.text(24, 26, '72:00:00', { fontFamily: MONO, fontSize: '26px', fontStyle: 'bold', color: '#FF6B6B' });

  const saglikEtiket = sahne.add.text(420, 10, aralikli('İSTASYON SAĞLIĞI'), etiket);
  const saglik = sahne.add.graphics();
  const saglikYazi = sahne.add.text(640, 30, '', { fontFamily: MONO, fontSize: '16px', color: '#D8F6FF' });

  const sistemEtiket = sahne.add.text(760, 10, aralikli('AÇILAN SİSTEMLER'), etiket);
  const rozetler = sahne.add.graphics();

  kap.add([zemin, sayacEtiket, sayac, saglikEtiket, saglik, saglikYazi, sistemEtiket, rozetler]);
  if (menuye) kap.add(dugme(sahne, 1210, 32, menuEtiketi, menuye, { genislik: 104, yukseklik: 48, boyut: 17 }));

  kap.guncelle = (oyuncu) => {
    const n = oyuncu ? oyuncu.sistemler.length : 0;
    // Hikayedeki geri sayim: 72 saatten son onarimdaki 10 dakikaya; yedi sistem acilinca durur
    const KALAN = ['72:00:00', '60:00:00', '48:00:00', '36:00:00', '24:00:00', '12:00:00', '00:10:00'];
    sayac.setText(n >= 7 ? 'GÜVENDE' : KALAN[n]);
    sayac.setColor(n >= 7 ? '#5FE3E8' : '#FF6B6B');

    const yuzde = Math.min(100, 30 + n * 10);
    const renk = yuzde < 50 ? 0xd64545 : yuzde < 80 ? 0xe3b341 : 0x5fe3e8;
    saglik.clear();
    saglik.fillStyle(0x1a2330, 1).fillRoundedRect(420, 30, 200, 18, 4);
    saglik.fillStyle(renk, 0.9).fillRoundedRect(420, 30, 2 * yuzde, 18, 4);
    saglikYazi.setText(`%${yuzde}`);

    rozetler.clear();
    for (let i = 0; i < SISTEM_SAYISI; i++) {
      const x = 772 + i * 38;
      const acik = oyuncu && oyuncu.sistemler.includes(i + 1);
      rozetler.lineStyle(2, 0x5fe3e8, acik ? 1 : 0.35).strokeCircle(x, 40, 13);
      if (acik) rozetler.fillStyle(0x5fe3e8, 0.85).fillCircle(x, 40, 8);
    }
  };
  return kap;
}
