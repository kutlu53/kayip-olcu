import { modalAc } from './Panel.js';
import { YAZI, aralikli } from './tipografi.js';

// Gozlem Defteri simgesi (CLAUDE.md §6, alt kose). Icerik bolumlerde dolacak; PDF disa aktarim Asama 3'te
export function defterSimgesi(sahne, x, y, oyuncuGetir) {
  const kap = sahne.add.container(x, y).setDepth(450);
  const g = sahne.add.graphics();
  g.fillStyle(0x0b1426, 0.9).fillRoundedRect(-36, -36, 72, 72, 12);
  g.lineStyle(2, 0x5fe3e8, 0.7).strokeRoundedRect(-36, -36, 72, 72, 12);
  // Defter cizimi: kapak, sirt, satirlar
  g.fillStyle(0xd8f6ff, 0.12).fillRect(-16, -20, 32, 36);
  g.lineStyle(2, 0xd8f6ff, 0.9).strokeRect(-16, -20, 32, 36);
  g.lineBetween(-10, -20, -10, 16);
  g.lineStyle(1.5, 0xd8f6ff, 0.6);
  for (const yy of [-10, -3, 4]) g.lineBetween(-5, yy, 11, yy);
  const etiket = sahne.add.text(0, 50, aralikli('DEFTER'), { fontFamily: YAZI, fontSize: '12px', color: '#D8F6FF' }).setOrigin(0.5);
  kap.add([g, etiket]);
  kap.setSize(72, 72).setInteractive({ useHandCursor: true });
  kap.on('pointerup', () => defterAc(sahne, oyuncuGetir()));
  return kap;
}

export function defterAc(sahne, oyuncu) {
  const kayitlar = (oyuncu && oyuncu.defter) || [];
  return modalAc(sahne, 'GÖZLEM DEFTERİ', (kap, alan) => {
    const metin = kayitlar.length
      ? kayitlar.map((k) => `• Bölüm ${k.bolum}: ${k.metin}`).join('\n\n')
      : 'Henüz kayıt yok.\n\nKeşiflerinde topladığın veriler, kendi cümlenle yazdığın kurallar ve çizdiğin vektörler burada birikecek. Sonraki bölümlerde bu sayfalara geri dönebileceksin.';
    kap.add(sahne.add.text(alan.sol, alan.ust, metin, { fontFamily: YAZI, fontSize: '19px', color: '#D8F6FF', wordWrap: { width: alan.genislik }, lineSpacing: 6 }));
    if (oyuncu) {
      kap.add(
        sahne.add
          .text(alan.sol, alan.ust + alan.yukseklik, `${oyuncu.takmaAd} · ${oyuncu.sinifKodu}`, { fontFamily: YAZI, fontSize: '14px', color: '#8A96A6' })
          .setOrigin(0, 1)
      );
    }
  });
}
