import Phaser from 'phaser';
import BolumTemel from './BolumTemel.js';
import veri from '../../data/bolum4.json';
import { Izgara, okCiz, izgaradaOk, STILLER, SuruklenebilirVektor } from '../../systems/VectorDraw.js';
import { topla, buyukluk, esitMi, aci, aciFarki, skalerCarpim, olcekle, yaz } from '../../systems/VectorMath.js';
import { secenekler } from '../../ui/Secenekler.js';
import { cumleKurucu } from '../../ui/CumleKurucu.js';
import { dugme } from '../../ui/Dugme.js';
import { YAZI, MONO, aralikli } from '../../ui/tipografi.js';
import { ayarlar } from '../../config/settings.js';
import { dunyaDokusu } from '../../art/Earth.js';
import { karistir } from '../../art/Rastgele.js';
import { tibbiKapsulDokusu, istasyonPortuOlustur, sizintiYayici, SIZINTI_NOKTASI, KAPSUL_BURUN, PORT_YUZU } from '../../art/Port.js';

const CSS = { vektor: '#F28C28', bileske: '#4A90E8', bilesen: '#3BB273', skaler: '#E6E8EB' };
const birim = ([x, y]) => {
  const b = Math.hypot(x, y) || 1;
  return [x / b, y / b];
};
const kisitla = (deger, en, enCok) => Math.max(en, Math.min(enCok, deger));

// Bolum 4 · Kenetlenme (FİZ.9.2.4): uc uca ekleme -> paralelkenar -> genelleme -> bilesenlere ayirma ve kenetlenme.
// Tanim kesiften once verilmez; yanlis cevabin sonucu deneyde gorulur (CLAUDE.md §1, §5, §6)
export default class Level4Kenetlenme extends BolumTemel {
  constructor() {
    super('Level4Kenetlenme', 4, 4);
  }

  arkaPlan() {
    this.add.image(470, 520, dunyaDokusu(this, { ufukY: 660, safak: 'sol' })).setAlpha(0.45);
  }

  // adim: ?bolum=4&adim=kesif2 gibi dogrudan baslatma (test ve sunum)
  basla(adim) {
    this.tablo = [];
    this.gorevHata = 0;
    if (adim === 'kesif2') this.kesif2();
    else if (adim === 'genelleme' || adim === 'gorev') {
      // Ornek tablo: Kesif 1 atlandiysa genelleme yine dolu tabloyla calissin
      this.tablo = veri.kesif1.ornekler.map((o) => ({ A: buyukluk(o.A), B: buyukluk(o.B), toplam: buyukluk(o.A) + buyukluk(o.B), bileske: buyukluk(topla(o.A, o.B)) }));
      if (adim === 'genelleme') this.genelleme();
      else this.gorev();
    } else {
      this.kesif1(0);
      this.diyalog.oynat(veri.giris);
    }
  }

  vektor(izgara, secenek) {
    const v = new SuruklenebilirVektor(this, izgara, secenek);
    this.ekle(v);
    return v;
  }

  // ---------------- KESIF 1: uc uca ekleme ----------------
  kesif1(i) {
    const k = veri.kesif1;
    const ornek = k.ornekler[i];
    this.adimBaslat({ no: 0, baslik: `${k.baslik} (${i + 1}/${k.ornekler.length})`, ipuclari: k.ipuclari, ad: `kesif1.${i + 1}` });
    this.yonerge(k.yonerge);

    const iz = new Izgara({ x: 110, y: 520, birim: 46, sol: -1, sag: 9, alt: -1, ust: 5 });
    const g = this.ekle(this.add.graphics());
    iz.ciz(g);
    const [ox, oy] = iz.ekran([0, 0]);
    g.fillStyle(0xffffff, 1).fillCircle(ox, oy, 5);
    this.yazi(ox, oy + 12, 'BAŞLANGIÇ', { fontFamily: MONO, fontSize: '11px', color: '#8A96A6' }).setOrigin(0.5, 0);
    const iz2 = this.ekle(this.add.graphics());
    const kapsul = this.ekle(this.add.image(ox, oy, tibbiKapsulDokusu(this)).setScale(0.2));

    this.vektor(iz, { kuyruk: [0, 0], v: ornek.A, etiket: 'A' }).kilitle();
    const B = this.vektor(iz, {
      kuyruk: ornek.park,
      v: ornek.B,
      kip: 'tasi',
      etiket: 'B',
      // Ok izgaranin icinde kalir
      kisit: ([x, y]) => [kisitla(x, Math.max(iz.sol, iz.sol - ornek.B[0]), Math.min(iz.sag, iz.sag - ornek.B[0])), kisitla(y, Math.max(iz.alt, iz.alt - ornek.B[1]), Math.min(iz.ust, iz.ust - ornek.B[1]))],
      birakildi: () => {
        if (!esitMi(B.kuyruk, ornek.A)) return;
        B.kilitle();
        this.kesif1Calistir(iz, ornek, i, kapsul, iz2);
      }
    });
    this.tabloCiz(560, 140);
    this.tahmin = null;
    if (ornek.tahmin) {
      B.kilitle();
      this.ekle(
        secenekler(this, 560, 280, ornek.tahmin.soru, ornek.tahmin.secenekler, (s) => {
          this.tahmin = s;
          this.cevap({ dogru: s.dogru, yanilgi: s.yanilgi, ayrinti: `kesif1.${i + 1} tahmin: ${s.metin}` });
          B.kilitle(false);
          this.diyalog.soyle('Elif', 'Şimdi deneyelim: B rotasını sürükle.');
        }, { genislik: 350, yukseklik: 54 })
      );
    }
  }

  kesif1Calistir(iz, ornek, i, kapsul, iz2) {
    const k = veri.kesif1;
    const A = ornek.A;
    const R = topla(ornek.A, ornek.B);
    // Kapsul once A, sonra B rotasini izler; arkasinda gri iz (alinan yol, skaler)
    this.tweens.addCounter({
      from: 0,
      to: 2,
      duration: 1800,
      ease: 'Sine.easeInOut',
      onUpdate: (tw) => {
        const u = tw.getValue();
        const p = u <= 1 ? olcekle(A, u) : topla(A, olcekle(ornek.B, u - 1));
        const [x, y] = iz.ekran(p);
        kapsul.setPosition(x, y);
        iz2.fillStyle(0xe6e8eb, 0.5).fillCircle(x, y, 2);
      },
      onComplete: () => {
        const r = this.ekle(this.add.graphics());
        this.tweens.addCounter({
          from: 0.05,
          to: 1,
          duration: 700,
          onUpdate: (tw) => {
            r.clear();
            izgaradaOk(r, iz, [0, 0], olcekle(R, tw.getValue()), STILLER.bileske);
          }
        });
        const yol = buyukluk(ornek.A) + buyukluk(ornek.B);
        this.yazi(110, 576, `Alınan yol: ${yaz(buyukluk(ornek.A))} m + ${yaz(buyukluk(ornek.B))} m = ${yaz(yol)} m`, { color: CSS.skaler });
        this.yazi(110, 604, `Mavi ok · bileşke: kapsül başlangıçtan ${yaz(buyukluk(R))} m uzakta`, { color: CSS.bileske, fontStyle: 'bold' });
        this.tablo[i] = { A: buyukluk(ornek.A), B: buyukluk(ornek.B), toplam: yol, bileske: buyukluk(R) };
        this.tabloCiz(560, 140);
        const s = ornek.sonuc;
        this.diyalog.soyle('ARGE', this.tahmin && !this.tahmin.dogru ? s.yanlis : s.dogru);
        if (i + 1 < k.ornekler.length) this.devam('Sonraki örnek  ▸', () => this.kesif1(i + 1));
        else {
          this.diyalog.sonra(3200, 'ARGE', k.kapanis);
          this.devam('Keşif 2  ▸', () => this.kesif2());
        }
      }
    });
  }

  tabloCiz(x, y) {
    if (this.tabloNesneleri) this.tabloNesneleri.forEach((n) => n.destroy());
    const g = this.add.graphics();
    const satirlar = this.tablo.filter(Boolean);
    const sutunlar = [['Örnek', 70, CSS.skaler], ['|A|', 60, CSS.vektor], ['|B|', 60, CSS.vektor], ['|A|+|B|', 90, CSS.skaler], ['Mavi ok', 80, CSS.bileske]];
    const genislik = sutunlar.reduce((t, s) => t + s[1], 0);
    g.fillStyle(0x05070d, 0.8).fillRoundedRect(x, y, genislik, 54 + Math.max(1, this.tablo.length) * 26, 8);
    g.lineStyle(1, 0x5fe3e8, 0.4).strokeRoundedRect(x, y, genislik, 54 + Math.max(1, this.tablo.length) * 26, 8);
    const nesneler = [g, this.add.text(x + 10, y + 6, aralikli('VERİ TABLOSU'), { fontFamily: MONO, fontSize: '12px', color: '#5FE3E8' })];
    let sx = x;
    for (const [ad, w, renk] of sutunlar) {
      nesneler.push(this.add.text(sx + w / 2, y + 26, ad, { fontFamily: YAZI, fontSize: '14px', fontStyle: 'bold', color: renk }).setOrigin(0.5, 0));
      sx += w;
    }
    this.tablo.forEach((s, j) => {
      if (!s) return;
      const degerler = [`${j + 1}`, `${yaz(s.A)} m`, `${yaz(s.B)} m`, `${yaz(s.toplam)} m`, `${yaz(s.bileske)} m`];
      let cx = x;
      sutunlar.forEach(([, w, renk], c) => {
        nesneler.push(this.add.text(cx + w / 2, y + 50 + j * 26, degerler[c], { fontFamily: YAZI, fontSize: '15px', color: renk }).setOrigin(0.5, 0));
        cx += w;
      });
    });
    this.tabloNesneleri = nesneler;
    this.ekle(...nesneler);
  }

  // ---------------- KESIF 2: iki itici, paralelkenar ----------------
  kesif2() {
    const k = veri.kesif2;
    this.adimBaslat({ no: 1, baslik: k.baslik, ad: 'kesif2.tahmin' });
    this.tahmin = null;
    this.yonerge(k.yonergeTahmin);
    const iz = new Izgara({ x: 150, y: 540, birim: 40, sol: -2, sag: 9, alt: -1, ust: 8 });
    const g = this.ekle(this.add.graphics());
    iz.ciz(g);
    const [ox, oy] = iz.ekran([0, 0]);
    const canli = this.ekle(this.add.graphics());
    const iz2 = this.ekle(this.add.graphics());
    const kapsul = this.ekle(this.add.image(ox, oy, tibbiKapsulDokusu(this)).setScale(0.2));
    const d1 = birim([4, 1]);
    const d2 = birim([1, 3]);
    const hedef = [7, 5.6];
    const HEDEF_YARICAP = 0.7;
    // Iticiler sabit dogrultuda; yalnizca guc (buyukluk) ayarlanir
    const dogrultuda = (d) => (v) => olcekle(d, kisitla(skalerCarpim(v, d), 0.5, 7));
    const okuma = this.yazi(560, 150, '', { fontSize: '19px', lineSpacing: 10 });
    const okumaR = this.yazi(560, 236, '', { fontSize: '19px', color: CSS.bileske, fontStyle: 'bold' });
    const hg = this.ekle(this.add.graphics());
    const hedefYazi = this.yazi(...iz.ekran([hedef[0], hedef[1] + 0.9]), 'HEDEF', { fontFamily: MONO, fontSize: '13px', color: '#FFFFFF' }).setOrigin(0.5).setVisible(false);

    const ciz = () => {
      canli.clear();
      const R = topla(F1.v, F2.v);
      izgaradaOk(canli, iz, F1.v, F2.v, STILLER.kopya);
      izgaradaOk(canli, iz, F2.v, F1.v, STILLER.kopya);
      izgaradaOk(canli, iz, [0, 0], R, STILLER.bileske);
      okuma.setText(`|F₁| = ${yaz(buyukluk(F1.v))} N     |F₂| = ${yaz(buyukluk(F2.v))} N\n|F₁| + |F₂| = ${yaz(buyukluk(F1.v) + buyukluk(F2.v))} N`);
      okumaR.setText(`Bileşke |R| = ${yaz(buyukluk(R))} N`);
    };
    const F1 = this.vektor(iz, { v: olcekle(d1, 4.12), etiket: 'F₁', birimAdi: 'N', adim: 0, kisit: dogrultuda(d1), degisti: ciz });
    const F2 = this.vektor(iz, { v: olcekle(d2, 1.58), etiket: 'F₂', birimAdi: 'N', adim: 0, kisit: dogrultuda(d2), degisti: ciz });
    F1.kilitle();
    F2.kilitle();
    ciz();

    let ucuyor = false;
    const atesle = (degerlendir) => {
      if (ucuyor) return;
      ucuyor = true;
      F1.kilitle();
      F2.kilitle();
      iz2.clear();
      const R = topla(F1.v, F2.v);
      const yon = birim(R);
      // Durgun kapsul sabit bileske kuvvetle bileske yonunde hizlanir: s = 1/2 a t^2
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1800,
        ease: (t) => t * t,
        onUpdate: (tw) => {
          const [x, y] = iz.ekran(olcekle(yon, 10 * tw.getValue()));
          kapsul.setPosition(x, y);
          iz2.fillStyle(0xe6e8eb, 0.45).fillCircle(x, y, 2);
        },
        onComplete: () => {
          kapsul.setPosition(ox, oy);
          ucuyor = false;
          if (!degerlendir) return sonrakiAsama();
          const fark = aciFarki(R, hedef);
          const isabet = buyukluk(hedef) * Math.sin((fark * Math.PI) / 180) <= HEDEF_YARICAP;
          this.cevap({ dogru: isabet, ayrinti: `kesif2.hedef aci farki ${Math.round(fark)}°, F1=${yaz(buyukluk(F1.v))} F2=${yaz(buyukluk(F2.v))}` });
          if (isabet) {
            this.diyalog.soyle('ARGE', k.isabet);
            this.devam('Kuralını yaz  ▸', () => this.genelleme());
          } else {
            this.diyalog.soyle('ARGE', aci(R) < aci(hedef) ? k.iskaAlt : k.iskaUst);
            F1.kilitle(false);
            F2.kilitle(false);
          }
        }
      });
    };

    const sonrakiAsama = () => {
      this.diyalog.soyle('ARGE', this.tahmin && !this.tahmin.dogru ? k.sonuc.yanlis : k.sonuc.dogru);
      this.ipucu.adimAyarla('kesif2.hedef', k.ipuclari);
      this.yonerge(k.yonergeGorev);
      hg.lineStyle(3, 0xffffff, 0.9).strokeCircle(...iz.ekran(hedef), HEDEF_YARICAP * iz.birim);
      hg.lineStyle(1, 0xffffff, 0.5).strokeCircle(...iz.ekran(hedef), HEDEF_YARICAP * iz.birim * 0.4);
      hedefYazi.setVisible(true);
      F1.kilitle(false);
      F2.kilitle(false);
      this.ekle(dugme(this, 700, 520, 'ATEŞLE  ▸', () => atesle(true), { genislik: 220, yukseklik: 60, birincil: true, boyut: 20 }));
    };

    this.ekle(
      secenekler(this, 560, 300, 'Tahminin:', k.secenekler, (s) => {
        this.tahmin = s;
        this.cevap({ dogru: s.dogru, yanilgi: s.yanilgi, ayrinti: `kesif2 tahmin: ${s.metin}` });
        this.time.delayedCall(500, () => atesle(false));
      }, { genislik: 350, yukseklik: 54 })
    );
  }

  // ---------------- GENELLEME: Gozlem Defteri ----------------
  genelleme() {
    const k = veri.genelleme;
    this.adimBaslat({ no: 2, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'genelleme' });
    this.yonerge(k.yonerge);
    this.tabloCiz(120, 170);
    this.kurucu = this.ekle(
      cumleKurucu(this, { x: 120, y: 300, genislik: 800, parcalar: karistir([...k.parcalar, ...k.celdiriciler]), kontrol: (c) => this.genellemeKontrol(c) })
    );
  }

  genellemeKontrol(c) {
    const k = veri.genelleme;
    if (c.tur === 'parca') {
      const kabul = k.kabul.some((dizi) => dizi.length === c.parcalar.length && dizi.every((p, i) => p === c.parcalar[i]));
      if (kabul) return this.kuralKabul(c.metin, 'otomatik');
      const toplamYanilgisi = c.parcalar.includes('eşittir,') || (c.parcalar.includes('her zaman') && !c.parcalar.includes('değildir,'));
      this.cevap({ dogru: false, yanilgi: toplamYanilgisi ? 'M_BILESKE_TOPLAM' : null, ayrinti: `kural: ${c.metin}` });
      this.diyalog.soyle('ARGE', toplamYanilgisi ? k.toplamYanilgisi : k.eksik);
      return;
    }
    const m = c.metin.toLocaleLowerCase('tr');
    if (k.serbestAnahtarlar.every((grup) => grup.some((a) => m.includes(a)))) return this.kuralKabul(c.metin, 'beklemede');
    this.cevap({ dogru: false, ayrinti: `serbest kural: ${c.metin}` });
    this.diyalog.soyle('Elif', k.serbestEksik);
  }

  // Serbest metin anahtar sozcukle kabul edilir, ogretmen onayi bekler (CLAUDE.md §9)
  kuralKabul(metin, onay) {
    const k = veri.genelleme;
    this.cevap({ dogru: true, ayrinti: `kural (${onay}): ${metin}` });
    const tablo = this.tablo.map((s, j) => `${j + 1}) |A|=${yaz(s.A)} m, |B|=${yaz(s.B)} m, |A|+|B|=${yaz(s.toplam)} m, bileşke=${yaz(s.bileske)} m`).join('; ');
    this.defterYaz({ tur: 'tablo', metin: `Rota parçaları: ${tablo}` });
    this.defterYaz({ tur: 'kural', metin, onay });
    if (this.kurucu) this.kurucu.destroy();
    this.yazi(120, 330, `“${metin}”`, { fontSize: '24px', color: '#FFFFFF', fontStyle: 'italic', wordWrap: { width: 800 } });
    this.yazi(120, 400, onay === 'beklemede' ? 'Deftere yazıldı · öğretmen onayı bekliyor' : 'Deftere yazıldı', { fontSize: '15px', color: '#8A96A6' });
    this.diyalog.soyle('ARGE', k.kabulMesaji);
    this.devam('Göreve geç  ▸', () => this.gorev());
  }

  // ---------------- GOREV: bilesenlere ayir, iticileri ayarla, kenetlen ----------------
  gorev() {
    const k = veri.gorev;
    const zor = ayarlar.zorMod;
    this.adimBaslat({ no: 3, baslik: k.baslik, ipuclari: zor ? k.ipuclariBilesenZor : k.ipuclariBilesen, ad: 'gorev.bilesen' });
    this.yonerge(zor ? k.yonergeBilesenZor : k.yonergeBilesen);

    const EKSEN_Y = 380;
    const PORT_YUZ_X = 900;
    this.kapsulX0 = 330;
    this.ekle(istasyonPortuOlustur(this).setPosition(PORT_YUZ_X - PORT_YUZU, EKSEN_Y));
    const kor = this.ekle(this.add.graphics());
    kor.lineStyle(1.5, 0xffffff, 0.35);
    for (let x = this.kapsulX0; x < PORT_YUZ_X; x += 18) kor.lineBetween(x, EKSEN_Y, x + 9, EKSEN_Y);
    this.yazi(620, EKSEN_Y + 8, 'YANAŞMA EKSENİ', { fontFamily: MONO, fontSize: '11px', color: '#8A96A6' });

    const iz = new Izgara({ x: this.kapsulX0, y: EKSEN_Y, birim: 38, sol: -5, sag: 6, alt: -5, ust: 4 });
    this.gorevIzgara = iz;
    this.izgaraG = this.ekle(this.add.graphics());
    iz.ciz(this.izgaraG, { alfa: zor ? 0.3 : 1 });
    // Kapsul izgaranin ustunde, vektorlerin altinda
    this.kapsul = this.ekle(this.add.container(this.kapsulX0, EKSEN_Y).setScale(0.55));
    this.kapsul.add([this.add.image(0, 0, tibbiKapsulDokusu(this)), sizintiYayici(this, ...SIZINTI_NOKTASI)]);
    const L = k.sizinti;
    this.L = this.vektor(iz, { v: L, etiket: 'Sızıntı', birimAdi: 'N', etiketYonu: -1 });
    this.L.kilitle();
    if (zor) {
      const aciG = this.ekle(this.add.graphics());
      aciG.lineStyle(2, 0xe6e8eb, 0.8).beginPath();
      aciG.arc(iz.x, iz.y, 46, 0, (k.zorMod.aci * Math.PI) / 180, false).strokePath();
      this.yazi(iz.x + 52, iz.y + 12, `${k.zorMod.aci}°`, { fontSize: '16px', color: CSS.skaler });
    }
    this.kontrolG = this.ekle(this.add.graphics());
    const temizleKontrol = () => this.kontrolG.clear();
    this.Fx = this.vektor(iz, { v: [2, 0], etiket: 'Fx', birimAdi: 'N', stil: STILLER.bilesen, kisit: ([x]) => [kisitla(x, -5, 6), 0], degisti: temizleKontrol });
    this.Fy = this.vektor(iz, { v: [0, 2], etiket: 'Fy', birimAdi: 'N', stil: STILLER.bilesen, kisit: ([, y]) => [0, kisitla(y, -5, 4)], degisti: temizleKontrol });
    this.gorevDugme = this.ekle(dugme(this, 300, 640, 'KONTROL ET', () => this.bilesenKontrol(), { genislik: 220, yukseklik: 56, birincil: true, boyut: 18 }));
  }

  bilesenKontrol() {
    const k = veri.gorev;
    const [L1, L2] = k.sizinti;
    const fx = this.Fx.v[0];
    const fy = this.Fy.v[1];
    const dogru = fx === L1 && fy === L2;
    let yanilgi = null;
    let ayrinti = `bilesen Fx=${fx}, Fy=${fy}`;
    if (!dogru) {
      this.gorevHata += 1;
      if (Math.abs(fx) + Math.abs(fy) === buyukluk(k.sizinti)) yanilgi = 'M_BILESKE_TOPLAM';
      else if (Math.abs(fx) === Math.abs(L2) && Math.abs(fy) === Math.abs(L1)) ayrinti += ' (eksen karisikligi)';
      else if (Math.abs(fx) === Math.abs(L1) && Math.abs(fy) === Math.abs(L2)) ayrinti += ' (yon hatasi)';
    }
    this.cevap({ dogru, yanilgi, ayrinti });
    // Sonuc: bilesenler uc uca eklenir, ulasilan nokta mavi okla gosterilir
    const g = this.kontrolG;
    g.clear();
    izgaradaOk(g, this.gorevIzgara, [fx, 0], [0, fy], { ...STILLER.bilesen, kalinlik: 3 });
    izgaradaOk(g, this.gorevIzgara, [0, 0], [fx, fy], { ...STILLER.bileske, kalinlik: 5 });
    if (!dogru) {
      this.diyalog.soyle('ARGE', k.bilesenYanlis);
      return;
    }
    this.Fx.kilitle();
    this.Fy.kilitle();
    this.gorevDugme.destroy();
    this.diyalog.soyle('ARGE', k.bilesenDogru);
    this.time.delayedCall(1800, () => this.iticiAsamasi());
  }

  iticiAsamasi() {
    const k = veri.gorev;
    this.ipucu.adimAyarla('gorev.itici', k.ipuclariItici);
    this.yonerge(k.yonergeItici);
    this.kontrolG.clear();
    for (const v of [this.Fx, this.Fy]) for (const n of v.nesneler()) n.setAlpha(0.4);
    const iz = this.gorevIzgara;
    this.Tx = this.vektor(iz, { v: [2, 0], etiket: 'Yatay itici', birimAdi: 'N', kisit: ([x]) => [kisitla(x, -5, 6), 0] });
    this.Ty = this.vektor(iz, { v: [0, 2], etiket: 'Dikey itici', birimAdi: 'N', kisit: ([, y]) => [0, kisitla(y, -5, 4)] });
    this.kenetDugme = this.ekle(dugme(this, 300, 640, 'KENETLEN  ▸', () => this.kenetlen(), { genislik: 220, yukseklik: 56, birincil: true, boyut: 18 }));
  }

  vektorleriGoster(gorunur) {
    const alfa = gorunur ? 1 : 0;
    const hedefler = [this.izgaraG, this.kontrolG, ...[this.L, this.Fx, this.Fy, this.Tx, this.Ty].flatMap((v) => v.nesneler())];
    this.tweens.add({ targets: hedefler, alpha: (h) => (gorunur && [this.Fx, this.Fy].some((v) => v.nesneler().includes(h)) ? 0.4 : alfa), duration: 300 });
    for (const v of [this.Tx, this.Ty]) v.kilitle(!gorunur);
    this.kenetDugme.setVisible(gorunur);
  }

  kenetlen() {
    const k = veri.gorev;
    const net = topla(this.L.v, this.Tx.v, this.Ty.v);
    this.vektorleriGoster(false);
    const EKSEN_Y = 380;
    const V0 = 100;
    const IVME = 6; // 1 N net kuvvet -> 6 px/s^2
    const dokX = 900 - KAPSUL_BURUN * 0.55;
    const s = { x: this.kapsulX0, y: EKSEN_Y, vx: V0, vy: 0, t: 0 };
    const netOk = this.ekle(this.add.graphics());
    let bitti = false;

    const sonuc = (tur) => {
      bitti = true;
      this.guncelleyiciler = this.guncelleyiciler.filter((f) => f !== adim);
      const basari = tur === 'basari';
      if (!basari) this.gorevHata += 1;
      this.cevap({ dogru: basari, ayrinti: `kenetlenme ${tur}: Tx=${this.Tx.v[0]}, Ty=${this.Ty.v[1]}, net=(${yaz(net[0])}, ${yaz(net[1])})` });
      if (basari) return this.kenetlendi();
      this.diyalog.soyle('ARGE', { sapmaUst: k.sapmaUst, sapmaAlt: k.sapmaAlt, hizli: k.hizli, yavas: k.yavas }[tur]);
      this.time.delayedCall(2600, () => {
        netOk.destroy();
        this.kapsul.setPosition(this.kapsulX0, EKSEN_Y).setAlpha(1).setRotation(0);
        this.vektorleriGoster(true);
      });
    };

    // Sabit net kuvvet -> sabit ivme. Net kuvvet sifirsa kapsul sabit hizla duz gider
    const adim = (zaman, delta) => {
      if (bitti) return;
      const dt = Math.min(delta, 50) / 1000;
      s.t += dt;
      s.vx += IVME * net[0] * dt;
      s.vy += -IVME * net[1] * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      this.kapsul.setPosition(s.x, s.y);
      netOk.clear();
      if (buyukluk(net) > 0.01) okCiz(netOk, s.x, s.y, s.x + net[0] * 22, s.y - net[1] * 22, { ...STILLER.bileske, kalinlik: 5 });
      const sapma = s.y - EKSEN_Y;
      if (s.x >= dokX) {
        if (Math.abs(sapma) > 5) {
          this.tweens.add({ targets: this.kapsul, x: s.x + s.vx * 1.2, y: s.y + s.vy * 1.2, alpha: 0.3, duration: 1200 });
          return sonuc(sapma < 0 ? 'sapmaUst' : 'sapmaAlt');
        }
        if (s.vx > V0 + 12) {
          // Sert carpma: kapsul geri seker
          this.tweens.add({ targets: this.kapsul, x: dokX - 60, rotation: 0.15, duration: 900, ease: 'Quad.easeOut' });
          return sonuc('hizli');
        }
        if (s.vx < V0 - 12) return sonuc('yavas');
        return sonuc('basari');
      }
      if (Math.abs(sapma) > 220) return sonuc(sapma < 0 ? 'sapmaUst' : 'sapmaAlt');
      if (s.vx <= 0 || s.t > 15) return sonuc('yavas');
    };
    this.guncelleyiciler.push(adim);
  }

  kenetlendi() {
    const k = veri.gorev;
    this.kapsul.setPosition(900 - KAPSUL_BURUN * 0.55, 380);
    // Kilitler sirayla yanar
    const kilit = this.ekle(this.add.graphics());
    [-14, -5, 5, 14].forEach((dy, i) =>
      this.time.delayedCall(250 + i * 300, () => kilit.fillStyle(0xd8f6ff, 1).fillCircle(896, 380 + dy, 3.5))
    );
    this.diyalog.soyle('ARGE', k.basari);
    const yildiz = this.gorevHata === 0 ? 3 : this.gorevHata <= 2 ? 2 : 1;
    this.time.delayedCall(1600, () => {
      this.yazi(470, 470, '★'.repeat(yildiz) + '☆'.repeat(3 - yildiz), { fontSize: '54px', color: '#FFD79A' }).setOrigin(0.5);
      this.yazi(470, 520, 'KENETLENME SİSTEMİ ÇEVRİMİÇİ', { fontFamily: MONO, fontSize: '16px', color: '#5FE3E8' }).setOrigin(0.5);
    });
    this.time.delayedCall(4200, () => this.bitir(yildiz));
  }
}
