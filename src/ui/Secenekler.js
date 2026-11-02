import { YAZI } from './tipografi.js';

// Tahmin kartlari: secilen kart vurgulanir; "Yanlis!" gosterilmez, sonuc deneyde gorulur (CLAUDE.md §6)
export function secenekler(sahne, x, y, soru, liste, secildi, { genislik = 620, yukseklik = 56 } = {}) {
  const kap = sahne.add.container(0, 0);
  const soruYazi = sahne.add.text(x, y, soru, { fontFamily: YAZI, fontSize: '20px', color: '#EEF3F7', wordWrap: { width: genislik } });
  kap.add(soruYazi);
  let ust = y + soruYazi.height + 14;
  const kartlar = liste.map((s, i) => {
    // Uzun secenek metni kaydirilir; kart yuksekligi metne gore buyur
    const harf = String.fromCharCode(65 + i);
    const yazi = sahne.add.text(-genislik / 2 + 20, 0, `${harf})  ${s.metin}`, { fontFamily: YAZI, fontSize: '19px', color: '#E6F7FA', wordWrap: { width: genislik - 36 } }).setOrigin(0, 0.5);
    const h = Math.max(yukseklik, yazi.height + 20);
    const kart = sahne.add.container(x + genislik / 2, ust + h / 2);
    const g = sahne.add.graphics();
    const ciz = (durum) => {
      g.clear();
      g.fillStyle(0x0b1426, durum === 'secili' ? 1 : 0.85).fillRoundedRect(-genislik / 2, -h / 2, genislik, h, 10);
      g.lineStyle(durum === 'secili' ? 3 : 2, 0x5fe3e8, durum === 'pasif' ? 0.2 : durum === 'secili' ? 1 : 0.55);
      g.strokeRoundedRect(-genislik / 2, -h / 2, genislik, h, 10);
    };
    ciz('normal');
    kart.add([g, yazi]);
    kart.setSize(genislik, h).setInteractive({ useHandCursor: true });
    kart.on('pointerover', () => kart.aktif !== false && ciz('vurgu'));
    kart.on('pointerout', () => kart.aktif !== false && ciz('normal'));
    kart.on('pointerup', () => {
      if (kart.aktif === false) return;
      for (const k of kartlar) {
        k.aktif = false;
        k.disableInteractive();
        k.ciz(k === kart ? 'secili' : 'pasif');
        if (k !== kart) k.yazi.setAlpha(0.45);
      }
      secildi(s, i);
    });
    kart.ciz = ciz;
    kart.yazi = yazi;
    kap.add(kart);
    ust += h + 10;
    return kart;
  });
  kap.yukseklik = ust - y;
  return kap;
}
