import { YAZI, aralikli } from './tipografi.js';

// Hologram cam zemin (sabit cizim)
export function camZemin(sahne, x, y, genislik, yukseklik, alfa = 0.82) {
  const g = sahne.add.graphics();
  g.fillStyle(0x05070d, alfa).fillRoundedRect(x, y, genislik, yukseklik, 12);
  g.lineStyle(1.5, 0x5fe3e8, 0.4).strokeRoundedRect(x, y, genislik, yukseklik, 12);
  return g;
}

// Ortada acilan pencere; arka plana dokununca ya da X ile kapanir
export function modalAc(sahne, baslik, icerikKur, { genislik = 760, yukseklik = 480 } = {}) {
  const kap = sahne.add.container(0, 0).setDepth(1000);
  const perde = sahne.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6).setInteractive();
  const sol = 640 - genislik / 2;
  const ust = 360 - yukseklik / 2;
  // Pencerenin icindeki bos alana dokunmak pencereyi kapatmasin (perdeye ulasmasin)
  const kalkan = sahne.add.rectangle(640, 360, genislik, yukseklik, 0x000000, 0).setInteractive();
  const zemin = camZemin(sahne, sol, ust, genislik, yukseklik, 0.95);
  const baslikYazi = sahne.add.text(sol + 28, ust + 22, aralikli(baslik), { fontFamily: YAZI, fontSize: '20px', fontStyle: 'bold', color: '#5FE3E8' });
  const kapat = sahne.add.container(sol + genislik - 36, ust + 36);
  const kapatZemin = sahne.add.graphics().lineStyle(2, 0x5fe3e8, 0.7).strokeRoundedRect(-24, -24, 48, 48, 8);
  kapat.add([kapatZemin, sahne.add.text(0, 0, '✕', { fontFamily: YAZI, fontSize: '22px', color: '#D8F6FF' }).setOrigin(0.5)]);
  kapat.setSize(48, 48).setInteractive({ useHandCursor: true });
  kap.add([perde, kalkan, zemin, baslikYazi, kapat]);

  const kapan = () => {
    sahne.tweens.add({ targets: kap, alpha: 0, duration: 180, onComplete: () => kap.destroy() });
  };
  perde.on('pointerup', kapan);
  kapat.on('pointerup', kapan);
  icerikKur(kap, { sol: sol + 28, ust: ust + 70, genislik: genislik - 56, yukseklik: yukseklik - 100 });
  kap.setAlpha(0);
  sahne.tweens.add({ targets: kap, alpha: 1, duration: 200 });
  return { kap, kapan };
}
