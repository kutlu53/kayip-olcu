import Phaser from 'phaser';
import { Arge } from '../art/Arge.js';
import { elifDokusu } from '../art/Characters.js';
import { camZemin } from './Panel.js';
import { dugme } from './Dugme.js';
import { YAZI, OKUMA, OKUMA_OLCEK, aralikli } from './tipografi.js';
import { altyaziOlcegi } from '../config/settings.js';
import { oku, durdur as okumaDurdur, okumaSuresi } from '../systems/SesliOkuma.js';

// Sag panel (CLAUDE.md §6): ustte ARGE konusma balonu, altta Komutan Elif'in telsizi + ipucu dugmesi
export function diyalogPaneli(sahne, { x = 948, y = 80, genislik = 320, yukseklik = 620, argeDurum = 7 } = {}) {
  const kap = sahne.add.container(0, 0).setDepth(400);
  const ic = genislik - 36;
  const argeYukseklik = Math.round(yukseklik * 0.52);

  const argeZemin = camZemin(sahne, x, y, genislik, argeYukseklik - 10, 0.94);
  const argeAd = sahne.add.text(x + 18, y + 16, aralikli('ARGE'), { fontFamily: YAZI, fontSize: '15px', fontStyle: 'bold', color: '#5FE3E8' });
  const arge = new Arge(sahne, x + genislik / 2, y + 92, { yaricap: 44, durum: argeDurum });
  const argeYazi = sahne.add.text(x + 18, y + 160, '', { fontFamily: OKUMA, fontSize: '19px', color: '#EEF3F7', wordWrap: { width: ic }, lineSpacing: 4 });

  const ey = y + argeYukseklik;
  const elifZemin = camZemin(sahne, x, ey, genislik, yukseklik - argeYukseklik, 0.94);
  const elifAd = sahne.add.text(x + 82, ey + 18, aralikli('TELSİZ · K. ELİF'), { fontFamily: YAZI, fontSize: '14px', fontStyle: 'bold', color: '#D8F6FF' });
  const elifResim = sahne.add.image(x + 42, ey + 46, elifDokusu(sahne, 'notr')).setScale(0.16).setBlendMode(Phaser.BlendModes.ADD);
  const elifYazi = sahne.add.text(x + 18, ey + 84, '', { fontFamily: OKUMA, fontSize: '17px', color: '#D8F6FF', wordWrap: { width: ic }, lineSpacing: 4 });
  const ipucu = dugme(sahne, x + genislik / 2, ey + yukseklik - argeYukseklik - 40, 'İpucu iste', () => kap.ipucuIstegi && kap.ipucuIstegi(), {
    genislik: ic,
    yukseklik: 52,
    boyut: 18
  }).setVisible(false);

  kap.add([argeZemin, argeAd, arge, argeYazi, elifZemin, elifAd, elifResim, elifYazi, ipucu]);

  // Uzun metin (ör. ARGE ogrencinin kuralini tekrar ederken) panele sigsin diye yazi kuculur.
  // Altyazi boyutu ayari baslangic boyutunu buyutur; sigmazsa yine kuculur
  const olcek = altyaziOlcegi() * OKUMA_OLCEK;
  const dizi = (bas, son) => {
    const r = [];
    for (let b = Math.round(bas * olcek); b > son; b -= 2) r.push(b);
    return [...r, son];
  };
  const boyutlar = { arge: dizi(19, 13), elif: dizi(17, 14) };
  const sigdir = (yazi, metin, tur) => {
    const alan = tur === 'arge' ? argeYukseklik - 180 : yukseklik - argeYukseklik - 150;
    for (const b of boyutlar[tur]) {
      yazi.setFontSize(b).setText(metin);
      if (yazi.height <= alan) break;
    }
  };
  const daktilo = (yazi, metin, sure = 26) => {
    if (yazi.daktilo) yazi.daktilo.remove(false);
    sigdir(yazi, metin, yazi === argeYazi ? 'arge' : 'elif');
    let i = 0;
    yazi.setText('');
    yazi.daktilo = sahne.time.addEvent({ delay: sure, repeat: metin.length - 1, callback: () => yazi.setText(metin.slice(0, ++i)) });
  };

  kap.arge = arge;
  kap.argeSoyle = (metin) => {
    daktilo(argeYazi, metin);
    oku('ARGE', metin, { kuyruk: true });
    arge.konus(metin.length * 26 + 400);
    kap.argeMesgul = sahne.time.now + Math.max(metin.length * 26, okumaSuresi('ARGE', metin)) + 400;
  };
  kap.elifSoyle = (metin) => {
    daktilo(elifYazi, metin, 22);
    oku('Elif', metin, { kuyruk: true });
    // Elif'in yazisi okunup bitene kadar dolu sayilir (ipucu onerisi bunu bekler)
    kap.elifMesgul = sahne.time.now + Math.max(metin.length * 22, okumaSuresi('Elif', metin)) + 400;
    sahne.tweens.add({ targets: elifResim, alpha: { from: 0.4, to: 1 }, duration: 300 });
  };
  // fn verilirse ipucu dugmesi gorunur (Elif'in 3 kademeli ipucu sistemi bolumlerde baglanacak)
  kap.ipucuAyarla = (fn) => {
    kap.ipucuIstegi = fn;
    ipucu.setVisible(!!fn);
  };
  // Yeni adimda eski konusmalar ekranda kalmasin
  kap.sustur = () => {
    okumaDurdur();
    kap.elifMesgul = 0;
    kap.argeMesgul = 0;
    for (const y of [argeYazi, elifYazi]) {
      if (y.daktilo) y.daktilo.remove(false);
      y.setText('');
    }
  };
  kap.guncelle = (zaman) => arge.guncelle(zaman);
  return kap;
}
