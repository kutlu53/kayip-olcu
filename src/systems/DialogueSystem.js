import { aktifOyuncu } from './SaveSystem.js';

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
    if (!siradan) this.durdur();
    const m = sablonDoldur(metin);
    if (kim === 'ARGE') this.panel.argeSoyle(m);
    else this.panel.elifSoyle(m);
  }

  oynat(replikler = []) {
    this.durdur();
    let t = 0;
    for (const r of replikler) {
      const sure = t;
      this.zamanlayicilar.push(this.sahne.time.delayedCall(sure, () => this.soyle(r.kim, r.metin, true)));
      t += r.bekle !== undefined ? r.bekle : 900 + r.metin.length * 30;
    }
    return t;
  }

  durdur() {
    for (const z of this.zamanlayicilar) z.remove(false);
    this.zamanlayicilar = [];
  }
}
