import { aktifOyuncu } from './SaveSystem.js';
import { durdur as okumaDurdur, okumaSuresi } from './SesliOkuma.js';

// Metin sablonlari: {ad} oyuncunun takma adi, {kuralN} oyuncunun N. bolumde deftere yazdigi kural.
// ARGE kurali oyuncunun kendi cumlesiyle tekrar eder: ogreterek ogrenme (CLAUDE.md §4)
export function sablonDoldur(metin) {
  const oyuncu = aktifOyuncu();
  return metin
    .replace(/\{ad\}/g, oyuncu ? oyuncu.takmaAd : 'stajyer')
    .replace(/\{kural(\d)\}/g, (_, n) => {
      const kayit = oyuncu && (oyuncu.defter || []).filter((k) => k.bolum === Number(n) && k.tur === 'kural').pop();
      return kayit ? kayit.metin : '…';
    });
}

// Sirali replikler: [{ kim: 'ARGE' | 'Elif', metin, bekle }]. Yeni bir dizi oncekini iptal eder
export class Diyalog {
  constructor(sahne, panel) {
    this.sahne = sahne;
    this.panel = panel;
    this.zamanlayicilar = [];
  }

  // Dogrudan konusma, siradaki (oynat ile kurulmus) replikleri iptal eder: oyuncuya verilen yanit ezilmesin
  soyle(kim, metin, siradan = false) {
    if (!siradan) {
      this.durdur();
      okumaDurdur();
    }
    const m = sablonDoldur(metin);
    if (kim === 'ARGE') this.panel.argeSoyle(m);
    else this.panel.elifSoyle(m);
  }

  // Sesli okuma aciksa sonraki replik oncekinin okunmasi bitmeden gelmez (yazi sesin onune gecmesin)
  oynat(replikler = []) {
    this.durdur();
    let t = 0;
    for (const r of replikler) {
      const sure = t;
      this.zamanlayicilar.push(this.sahne.time.delayedCall(sure, () => this.soyle(r.kim, r.metin, true)));
      const yazma = r.bekle !== undefined ? r.bekle : 900 + r.metin.length * 30;
      const okuma = okumaSuresi(r.kim, sablonDoldur(r.metin));
      t += Math.max(yazma, okuma ? okuma + 400 : 0);
    }
    return t;
  }

  // Gecikmeli replik: ayni konusanin onceki cumlesi okunup bitince gelir; adim degisince (durdur) iptal edilir.
  // Dondurdugu sure (ms) replik gelene kadar gecen zamandir
  sonra(ms, kim, metin) {
    const mesgul = (kim === 'ARGE' ? this.panel.argeMesgul : this.panel.elifMesgul) || 0;
    ms = Math.max(ms, mesgul - this.sahne.time.now);
    const z = this.sahne.time.delayedCall(ms, () => {
      this.zamanlayicilar = this.zamanlayicilar.filter((x) => x !== z);
      this.soyle(kim, metin, true);
    });
    this.zamanlayicilar.push(z);
    return ms;
  }

  durdur() {
    for (const z of this.zamanlayicilar) z.remove(false);
    this.zamanlayicilar = [];
  }
}
