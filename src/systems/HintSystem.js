import { olayKaydet } from './Telemetry.js';
import { durdur as okumaDurdur } from './SesliOkuma.js';

// Komutan Elif'in 3 kademeli ipucu (CLAUDE.md §5):
// (1) yonlendirici soru -> (2) benzer bir ornek -> (3) cozumun ilk adimi.
// Ipucu kullanimi ogretmene raporlanir ama puan dusurmez. Iki ardisik hatadan sonra Elif ilk ipucunu kendisi onerir.
export class IpucuSistemi {
  constructor(panel, { bolum, cikti }) {
    this.panel = panel;
    this.bolum = bolum;
    this.cikti = cikti;
    this.adimAyarla(null, []);
  }

  adimAyarla(adim, ipuclari) {
    this.surum = (this.surum || 0) + 1;
    this.adim = adim;
    this.ipuclari = ipuclari || [];
    this.kademe = 0;
    this.ardisikHata = 0;
    this.panel.ipucuAyarla(this.ipuclari.length ? () => this.ver() : null);
  }

  ver() {
    if (!this.ipuclari.length) return;
    this.kademe = Math.min(this.kademe + 1, this.ipuclari.length);
    okumaDurdur();
    this.panel.elifSoyle(this.ipuclari[this.kademe - 1]);
    olayKaydet('ipucu', { bolum: this.bolum, cikti: this.cikti, ipucuKademesi: this.kademe, ayrinti: this.adim });
  }

  // Oneri, bolumun bu cevaba verdigi tepkiden (ARGE/Elif) sonra gelir; yoksa tepki onu hemen ezer ve okunmaz
  hata() {
    this.ardisikHata += 1;
    if (this.ardisikHata === 2 && this.kademe === 0 && this.ipuclari.length) {
      const surum = this.surum;
      const sahne = this.panel.scene;
      // Konusmalar susunca soyler; bu arada yeni bir cumle baslamissa yeniden bekler
      const dene = () => {
        // Arada dogru cevap verildiyse (ardisikHata sifirlanir) ya da ipucu istendiyse oneri gereksiz
        if (this.surum !== surum || this.kademe !== 0 || this.ardisikHata < 2) return;
        const bekle = Math.max((this.panel.elifMesgul || 0) - sahne.time.now, (this.panel.argeMesgul || 0) - sahne.time.now);
        if (bekle > 50) sahne.time.delayedCall(bekle, dene);
        else this.panel.elifSoyle('Zorlanıyor musun? İstersen sana bir ipucu vereyim: "İpucu iste" düğmesine dokun.');
      };
      sahne.time.delayedCall(0, dene);
    }
  }

  dogru() {
    this.ardisikHata = 0;
  }
}
