import Phaser from 'phaser';
import BolumTemel from './BolumTemel.js';
import veri from '../../data/bolum2.json';
import { okCiz, STILLER } from '../../systems/VectorDraw.js';
import { secenekler } from '../../ui/Secenekler.js';
import { cumleKurucu } from '../../ui/CumleKurucu.js';
import { dugme } from '../../ui/Dugme.js';
import { YAZI, MONO } from '../../ui/tipografi.js';
import { navKoprusuDokusu } from '../../art/Navigasyon.js';
import { keremVideoOlustur } from '../../art/Characters.js';
import { tibbiKapsulDokusu } from '../../art/Port.js';
import { karistir } from '../../art/Rastgele.js';
import { PEDAGOJIK } from '../../config/colors.js';

const doldur = (s, d) => s.replace(/\{(\w+)\}/g, (_, k) => (k in d ? d[k] : `{${k}}`));
// Pusula acisi (kuzeyden saat yonunde) -> ekran yonu (y asagi)
const yonVektoru = (derece) => [Math.sin((derece * Math.PI) / 180), -Math.cos((derece * Math.PI) / 180)];
const SKALER = '#E6E8EB';
const VEKTOR = '#F28C28';

// Bolum 2 · Kor Pusula (FİZ.9.2.2): surat yetmez, yon gerekir -> yon ekle -> genelleme -> rota tarayicisi.
// "Skaler" ve "vektorel" adlari ancak iki keşiften sonra verilir (CLAUDE.md §1, §7)
export default class Level2KorPusula extends BolumTemel {
  constructor() {
    super('Level2KorPusula', 2, 4);
  }

  arkaPlan() {
    this.add.image(470, 400, navKoprusuDokusu(this)).setAlpha(0.16);
  }

  basla(adim) {
    this.gorevHata = 0;
    this.deneyTablosu = [];
    if (adim === 'kesif2') this.kesif2();
    else if (adim === 'genelleme' || adim === 'gorev') {
      this.deneyTablosu = veri.kesif2.deneyler.map((d) => ({ ad: d.ad, yonlu: d.tur === 'vektorel' }));
      if (adim === 'genelleme') this.genelleme();
      else this.gorev();
    } else {
      this.kesif1();
      this.diyalog.oynat(veri.giris);
    }
  }

  // Radar haritasi: merkez istasyon, halkalar 100 km'de bir, K-D-G-B
  radarKur(cx, cy, r, menzilKm) {
    const g = this.ekle(this.add.graphics());
    g.fillStyle(0x04080d, 0.85).fillCircle(cx, cy, r);
    g.lineStyle(1.5, 0x5fe3e8, 0.4);
    for (let km = 100; km <= menzilKm; km += 100) {
      g.strokeCircle(cx, cy, (r * km) / menzilKm);
      this.yazi(cx + 4, cy - (r * km) / menzilKm + 2, `${km} km`, { fontFamily: MONO, fontSize: '11px', color: '#5FE3E8' }).setAlpha(0.7);
    }
    g.lineStyle(1, 0x5fe3e8, 0.25).lineBetween(cx - r, cy, cx + r, cy).lineBetween(cx, cy - r, cx, cy + r);
    [['K', 0, -1], ['D', 1, 0], ['G', 0, 1], ['B', -1, 0]].forEach(([h, dx, dy]) =>
      this.yazi(cx + dx * (r + 16), cy + dy * (r + 16), h, { fontSize: '18px', fontStyle: 'bold', color: '#D8F6FF' }).setOrigin(0.5)
    );
    g.fillStyle(0xffffff, 1).fillRect(cx - 5, cy - 5, 10, 10);
    this.yazi(cx, cy + 10, 'GÖKTÜRK-7', { fontFamily: MONO, fontSize: '10px', color: '#8A96A6' }).setOrigin(0.5, 0);
    const tarama = this.ekle(this.add.graphics().setBlendMode(Phaser.BlendModes.ADD));
    this.guncelleyiciler.push((zaman) => {
      tarama.clear();
      const a = (zaman / 1000) * 1.2;
      for (let i = 0; i < 10; i++) {
        tarama.lineStyle(2, 0x5fe3e8, 0.3 - i * 0.03);
        tarama.lineBetween(cx, cy, cx + Math.cos(a - i * 0.05) * r, cy + Math.sin(a - i * 0.05) * r);
      }
    });
    return { cx, cy, r, olcek: r / menzilKm };
  }

  // ---------------- KESIF 1: Kerem'i bul ----------------
  kesif1() {
    const k = veri.kesif1;
    this.adimBaslat({ no: 0, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'kesif1' });
    this.yonerge(k.yonerge);
    const radar = this.radarKur(330, 430, 230, 300);
    const uzaklikKm = (k.surat * k.sureDk) / 60;
    const [ux, uy] = yonVektoru(k.yonDerece);
    const kerem = [radar.cx + ux * uzaklikKm * radar.olcek, radar.cy + uy * uzaklikKm * radar.olcek];

    const video = this.ekle(keremVideoOlustur(this).setPosition(762, 250).setScale(0.78));
    video.olay('ac');
    this.guncelleyiciler.push((z) => video.guncelle(z));
    const keremYazi = this.yazi(600, 380, `Kerem: "${k.kerem}"`, { fontSize: '17px', color: '#FFD59A', wordWrap: { width: 320 } });
    const ciz = this.ekle(this.add.graphics());
    const dronYazi = this.yazi(radar.cx + radar.r - 70, radar.cy + radar.r - 6, '', { fontFamily: MONO, fontSize: '14px', color: '#D8F6FF' });
    let asama = 'tahmin';
    let dron = 3;
    let mesgul = false;

    const alan = this.ekle(this.add.zone(radar.cx, radar.cy, radar.r * 2, radar.r * 2).setInteractive({ useHandCursor: true }));
    alan.on('pointerup', (p) => {
      if (mesgul || (asama !== 'kor' && asama !== 'yonlu')) return;
      if (Phaser.Math.Distance.Between(p.x, p.y, radar.cx, radar.cy) > radar.r) return;
      dronGonder(p.x, p.y);
    });

    const dronGonder = (x, y) => {
      mesgul = true;
      const d = this.ekle(this.add.triangle(radar.cx, radar.cy, 0, 10, 5, 0, 10, 10, 0xffffff));
      this.tweens.add({
        targets: d, x, y, duration: 800, ease: 'Sine.easeInOut',
        onComplete: () => {
          // Tarama alani: yaklasik 30 km
          const tarama = 30 * radar.olcek;
          ciz.lineStyle(2, 0xffffff, 0.6).strokeCircle(x, y, tarama);
          const bulundu = Phaser.Math.Distance.Between(x, y, ...kerem) <= 35 * radar.olcek;
          mesgul = false;
          if (asama === 'kor') {
            dron -= 1;
            dronYazi.setText(`Dron: ${dron}`);
            if (bulundu) return keremiGoster(true);
            this.diyalog.soyle('ARGE', doldur(k.bos, { no: 3 - dron }));
            if (dron === 0) this.time.delayedCall(1600, () => yonGelsin());
            return;
          }
          this.cevap({ dogru: bulundu, yanilgi: null, ayrinti: `yonlu arama ${Math.round(Phaser.Math.Distance.Between(x, y, ...kerem) / radar.olcek)} km sapma` });
          if (bulundu) keremiGoster(false);
          else this.diyalog.soyle('ARGE', k.iska);
        }
      });
    };

    const yonGelsin = () => {
      asama = 'yonlu';
      keremYazi.setText(`Kerem: "${k.yonGeldi}"`);
      this.yonerge(k.yonergeYonlu);
      okCiz(ciz, radar.cx, radar.cy, radar.cx + ux * 110, radar.cy + uy * 110, STILLER.vektor);
      this.yazi(radar.cx + ux * 60 + 14, radar.cy + uy * 60 + 4, `500 km/h · ${k.yonAdi}`, { fontSize: '14px', fontStyle: 'bold', color: VEKTOR, backgroundColor: 'rgba(5,7,13,0.8)', padding: { x: 4, y: 2 } });
      dronYazi.setText('Dron: hazır');
    };

    const keremiGoster = (sansli) => {
      asama = 'bitti';
      this.ekle(this.add.image(...kerem, tibbiKapsulDokusu(this)).setScale(0.18));
      ciz.lineStyle(3, 0xffffff, 1).strokeCircle(...kerem, 16);
      if (sansli) {
        this.diyalog.soyle('ARGE', k.sansli);
        this.time.delayedCall(2600, () => {
          okCiz(ciz, radar.cx, radar.cy, radar.cx + ux * 110, radar.cy + uy * 110, STILLER.vektor);
          this.diyalog.soyle('ARGE', k.bulundu);
        });
      } else this.diyalog.soyle('ARGE', k.bulundu);
      this.devam('Keşif 2  ▸', () => this.kesif2());
    };

    const kartlar = this.ekle(
      secenekler(this, 600, 470, k.tahmin.soru, k.tahmin.secenekler, (s) => {
        this.cevap({ dogru: s.dogru, yanilgi: s.yanilgi, ayrinti: `kesif1 tahmin: ${s.metin}` });
        // Kartlar yer acsin: arama ve sonraki dugme icin
        this.time.delayedCall(1500, () => this.tweens.add({ targets: kartlar, alpha: 0, duration: 400, onComplete: () => kartlar.destroy() }));
        asama = 'kor';
        ciz.lineStyle(2, 0xe6e8eb, 0.7);
        const rr = uzaklikKm * radar.olcek;
        for (let a = 0; a < 360; a += 6) {
          const r1 = (a * Math.PI) / 180;
          const r2 = ((a + 3) * Math.PI) / 180;
          ciz.lineBetween(radar.cx + Math.cos(r1) * rr, radar.cy + Math.sin(r1) * rr, radar.cx + Math.cos(r2) * rr, radar.cy + Math.sin(r2) * rr);
        }
        this.diyalog.soyle('ARGE', k.uzaklik);
        this.yonerge(k.yonergeArama);
        dronYazi.setText(`Dron: ${dron}`);
      }, { genislik: 320, yukseklik: 52 })
    );
  }

  // ---------------- KESIF 2: yon ekle ----------------
  kesif2() {
    const k = veri.kesif2;
    this.adimBaslat({ no: 1, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'kesif2' });
    this.yonerge(k.yonerge);
    this.deneyTablosu = [];
    this.deney(0);
  }

  deney(i) {
    const k = veri.kesif2;
    const d = k.deneyler[i];
    if (this.deneyNesneleri) this.deneyNesneleri.forEach((n) => n.destroy());
    const nesneler = [];
    const ekle = (n) => {
      nesneler.push(n);
      return this.ekle(n);
    };
    const g = ekle(this.add.graphics());
    g.fillStyle(0x04080d, 0.88).fillRoundedRect(40, 160, 520, 330, 10);
    g.lineStyle(1.5, 0x5fe3e8, 0.4).strokeRoundedRect(40, 160, 520, 330, 10).lineBetween(300, 175, 300, 475);
    ekle(this.add.text(170, 176, 'KUZEYE', { fontFamily: MONO, fontSize: '14px', color: '#5FE3E8' }).setOrigin(0.5, 0));
    ekle(this.add.text(430, 176, 'GÜNEYE', { fontFamily: MONO, fontSize: '14px', color: '#5FE3E8' }).setOrigin(0.5, 0));
    ekle(this.add.text(300, 440, `${d.ad}: ${d.deger}`, { fontFamily: YAZI, fontSize: '22px', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5));
    // Iki kapsul: biri kuzeye, biri guneye ayni olcum
    const kapsuller = [170, 430].map((x) => ekle(this.add.image(x, 320, tibbiKapsulDokusu(this)).setScale(0.32).setAngle(-90)));
    const etiketler = [-1, 1].map((yon, j) => {
      const x = j === 0 ? 170 : 430;
      if (d.canlandirma === 'yok') return ekle(this.add.text(x, 380, `${yon < 0 ? 'kuzeye' : 'güneye'} ${d.deger}?`, { fontFamily: YAZI, fontSize: '16px', color: SKALER }).setOrigin(0.5));
      const og = ekle(this.add.graphics());
      okCiz(og, x + 34, 320, x + 34, 320 + yon * 70, STILLER.vektor);
      return ekle(this.add.text(x + 44, 320 + yon * 40, d.deger, { fontFamily: YAZI, fontSize: '15px', fontStyle: 'bold', color: VEKTOR }));
    });

    const tabloYaz = () => {
      if (this.tabloYazisi) this.tabloYazisi.forEach((n) => n.destroy());
      const ust = 360;
      this.tabloYazisi = [this.add.text(590, ust, 'YÖN SONUCU DEĞİŞTİRDİ Mİ?', { fontFamily: MONO, fontSize: '12px', color: '#5FE3E8' })];
      this.deneyTablosu.forEach((s, j) =>
        this.tabloYazisi.push(this.add.text(590, ust + 24 + j * 28, `${s.ad}: ${s.yonlu ? 'Evet' : 'Hayır'}`, { fontFamily: YAZI, fontSize: '18px', color: s.yonlu ? VEKTOR : SKALER }))
      );
      this.ekle(...this.tabloYazisi);
    };
    tabloYaz();

    ekle(
      secenekler(this, 590, 170, 'Yönü değiştirince sonuç değişir mi?', d.secenekler, (s) => {
        this.cevap({ dogru: s.dogru, yanilgi: s.yanilgi, ayrinti: `kesif2 ${d.ad}: ${s.metin}` });
        if (d.canlandirma === 'yok') {
          // Hicbir sey olmaz: iki kapsul ayni
          ekle(this.add.text(300, 320, '=', { fontFamily: YAZI, fontSize: '48px', color: SKALER }).setOrigin(0.5));
        } else {
          kapsuller.forEach((kp, j) => this.tweens.add({ targets: kp, y: 320 + (j === 0 ? -1 : 1) * (d.canlandirma === 'git' ? 90 : 70), duration: 1200, ease: d.canlandirma === 'it' ? 'Quad.easeIn' : 'Sine.easeInOut' }));
          if (d.canlandirma === 'git') etiketler.forEach((e) => e.setVisible(true));
        }
        this.diyalog.soyle('ARGE', d.sonuc);
        this.deneyTablosu.push({ ad: d.ad, yonlu: d.tur === 'vektorel' });
        this.time.delayedCall(1300, tabloYaz);
        if (i + 1 < k.deneyler.length) ekle(this.devam('Sonraki  ▸', () => this.deney(i + 1)));
        else {
          this.time.delayedCall(3000, () => this.diyalog.soyle('ARGE', k.kapanis));
          ekle(this.devam('Kuralını yaz  ▸', () => this.genelleme()));
        }
      }, { genislik: 330, yukseklik: 52 })
    );
    this.deneyNesneleri = nesneler;
  }

  // ---------------- GENELLEME ----------------
  genelleme() {
    const k = veri.genelleme;
    this.adimBaslat({ no: 2, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'genelleme' });
    this.deneyNesneleri = null;
    this.yonerge(k.yonerge);
    const yonlu = this.deneyTablosu.filter((d) => d.yonlu).map((d) => d.ad);
    const yonsuz = this.deneyTablosu.filter((d) => !d.yonlu).map((d) => d.ad);
    this.ozet = `Yön sonucu değiştirdi: ${yonlu.join(', ')} · Yön anlamsızdı: ${yonsuz.join(', ')}`;
    this.yazi(120, 168, `Yön sonucu değiştirdi:  ${yonlu.join(', ')}`, { fontSize: '19px', color: VEKTOR });
    this.yazi(120, 200, `Yön anlamsızdı:  ${yonsuz.join(', ')}`, { fontSize: '19px', color: SKALER });
    this.kurucu = this.ekle(
      cumleKurucu(this, { x: 120, y: 240, genislik: 800, parcalar: karistir([...k.parcalar, ...k.celdiriciler]), kontrol: (c) => this.genellemeKontrol(c) })
    );
  }

  genellemeKontrol(c) {
    const k = veri.genelleme;
    if (c.tur === 'parca') {
      if (k.kabul.some((d) => d.length === c.parcalar.length && d.every((p, i) => p === c.parcalar[i]))) return this.kuralKabul(c.metin, 'otomatik');
      const kutle = c.parcalar.includes('kütle gibi');
      const deger = c.parcalar.includes('değeri büyük olan');
      this.cevap({ dogru: false, yanilgi: kutle ? 'M_KUTLE_YONLU' : null, ayrinti: `kural: ${c.metin}` });
      this.diyalog.soyle('ARGE', kutle ? k.kutleYonlu : deger ? k.degerBuyuk : k.eksik);
      return;
    }
    const m = c.metin.toLocaleLowerCase('tr');
    if (k.serbestAnahtarlar.every((grup) => grup.some((a) => m.includes(a)))) return this.kuralKabul(c.metin, 'beklemede');
    this.cevap({ dogru: false, ayrinti: `serbest kural: ${c.metin}` });
    this.diyalog.soyle('Elif', k.serbestEksik);
  }

  kuralKabul(metin, onay) {
    this.cevap({ dogru: true, ayrinti: `kural (${onay}): ${metin}` });
    this.defterYaz({ tur: 'tablo', metin: this.ozet });
    this.defterYaz({ tur: 'kural', metin, onay });
    if (this.kurucu) this.kurucu.destroy();
    this.yazi(120, 300, `“${metin}”`, { fontSize: '23px', color: '#FFFFFF', fontStyle: 'italic', wordWrap: { width: 800 } });
    this.yazi(120, 400, onay === 'beklemede' ? 'Deftere yazıldı · öğretmen onayı bekliyor' : 'Deftere yazıldı', { fontSize: '15px', color: '#8A96A6' });
    this.diyalog.soyle('ARGE', veri.genelleme.kabulMesaji);
    this.devam('Göreve geç  ▸', () => this.gorev());
  }

  // ---------------- GOREV: rota tarayicisi ----------------
  gorev() {
    const k = veri.gorev;
    this.adimBaslat({ no: 3, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'gorev.etiket' });
    this.yonerge(k.yonerge);
    this.radar = this.radarKur(690, 430, 215, 300);
    const [ux, uy] = yonVektoru(veri.kesif1.yonDerece);
    this.hedef = [this.radar.cx + ux * 250 * this.radar.olcek, this.radar.cy + uy * 250 * this.radar.olcek];
    this.ekle(this.add.image(...this.hedef, tibbiKapsulDokusu(this)).setScale(0.18));
    this.rotaG = this.ekle(this.add.graphics());
    this.kartlar = k.nicelikler.map((n, j) => this.etiketKarti(n, 125 + (j % 2) * 175, 200 + Math.floor(j / 2) * 64));
    this.cizDugme = this.ekle(dugme(this, 212, 548, 'ROTAYI ÇİZ  ▸', () => this.rotaCiz(), { genislik: 300, yukseklik: 56, birincil: true, boyut: 18 }));
  }

  etiketKarti(n, x, y) {
    const kap = this.ekle(this.add.container(x, y));
    const g = this.add.graphics();
    const ad = this.add.text(-72, 0, n.ad, { fontFamily: YAZI, fontSize: '16px', color: '#FFFFFF' }).setOrigin(0, 0.5);
    const rozet = this.add.text(78, 0, '?', { fontFamily: MONO, fontSize: '13px', fontStyle: 'bold', color: '#8A96A6' }).setOrigin(1, 0.5);
    const isaret = this.add.graphics();
    kap.add([g, ad, isaret, rozet]);
    kap.n = n;
    kap.etiket = null;
    kap.ciz = (vurgu) => {
      g.clear();
      isaret.clear();
      const renk = vurgu ? 0xd64545 : kap.etiket === 'vektorel' ? PEDAGOJIK.vektor : kap.etiket === 'skaler' ? PEDAGOJIK.skaler : 0x3a4656;
      g.fillStyle(0x0b1426, 0.95).fillRoundedRect(-82, -27, 164, 54, 10);
      g.lineStyle(vurgu ? 3 : 2, renk, kap.etiket || vurgu ? 1 : 0.7).strokeRoundedRect(-82, -27, 164, 54, 10);
      // Renk + desen: yonlu icin ok, yonsuz icin nokta (renk korlugu)
      if (kap.etiket === 'vektorel') {
        rozet.setText('YÖNLÜ').setColor(VEKTOR);
        okCiz(isaret, 4, 14, 30, 14, { renk: PEDAGOJIK.vektor, kalinlik: 3 });
      } else if (kap.etiket === 'skaler') {
        rozet.setText('YÖNSÜZ').setColor(SKALER);
        isaret.fillStyle(PEDAGOJIK.skaler, 1).fillCircle(16, 14, 4);
      } else rozet.setText('?').setColor('#8A96A6');
    };
    kap.ciz();
    kap.setSize(164, 54).setInteractive({ useHandCursor: true });
    kap.on('pointerup', () => {
      kap.etiket = kap.etiket === 'vektorel' ? 'skaler' : 'vektorel';
      kap.ciz();
      this.rotaG.clear();
    });
    return kap;
  }

  rotaCiz() {
    const k = veri.gorev;
    const eksik = this.kartlar.filter((c) => !c.etiket).length;
    if (eksik) return this.diyalog.soyle('ARGE', doldur(k.eksik, { sayi: eksik }));
    const yanlislar = this.kartlar.filter((c) => c.etiket !== c.n.tur);
    const dogru = yanlislar.length === 0;
    const oncelik = ['M_SURAT_HIZ_AYNI', 'M_KUTLE_YONLU', 'M_SKALER_YONLU', 'M_YON_ONEMSIZ'];
    const kodlar = yanlislar.map((c) => c.n.yanilgi);
    this.cevap({
      dogru,
      yanilgi: oncelik.find((o) => kodlar.includes(o)) || null,
      ayrinti: `rota: ${yanlislar.map((c) => `${c.n.ad}→${c.etiket}`).join(', ') || 'hatasiz'}`
    });
    // Her nicelik rotanin bir parcasi; yanlis etiketli parca 28° sapar
    const { cx, cy } = this.radar;
    const parca = Phaser.Math.Distance.Between(cx, cy, ...this.hedef) / this.kartlar.length;
    const noktalar = [[cx, cy]];
    let yanlisSira = 0;
    const isaretler = [];
    this.kartlar.forEach((c) => {
      const yanlis = c.etiket !== c.n.tur;
      const aci = veri.kesif1.yonDerece + (yanlis ? (yanlisSira++ % 2 === 0 ? 28 : -28) : 0);
      const [ux, uy] = yonVektoru(aci);
      const [px, py] = noktalar[noktalar.length - 1];
      noktalar.push([px + ux * parca, py + uy * parca]);
      if (yanlis) isaretler.push({ nokta: noktalar[noktalar.length - 1], ad: c.n.ad });
    });
    this.cizDugme.setVisible(false);
    const g = this.rotaG;
    this.tweens.addCounter({
      from: 0,
      to: noktalar.length - 1,
      duration: 1800,
      onUpdate: (tw) => {
        const u = tw.getValue();
        g.clear().lineStyle(3, 0x5fe3e8, 1).beginPath().moveTo(...noktalar[0]);
        for (let i = 1; i <= Math.floor(u); i++) g.lineTo(...noktalar[i]);
        const i = Math.floor(u);
        if (i < noktalar.length - 1) {
          const f = u - i;
          g.lineTo(noktalar[i][0] + (noktalar[i + 1][0] - noktalar[i][0]) * f, noktalar[i][1] + (noktalar[i + 1][1] - noktalar[i][1]) * f);
        }
        g.strokePath();
      },
      onComplete: () => {
        if (dogru) return this.keremSorusu();
        this.gorevHata += 1;
        for (const s of isaretler) {
          g.fillStyle(0xd64545, 1).fillCircle(...s.nokta, 6);
          const t = this.yazi(s.nokta[0] + 8, s.nokta[1] - 8, s.ad, { fontSize: '12px', color: '#FF8A8A', backgroundColor: 'rgba(5,7,13,0.8)', padding: { x: 3, y: 1 } });
          this.time.delayedCall(4500, () => t.destroy());
        }
        for (const c of yanlislar) c.ciz(true);
        this.time.delayedCall(2500, () => yanlislar.forEach((c) => c.ciz()));
        this.diyalog.soyle('ARGE', doldur(k.sapma, { sayi: yanlislar.length }));
        this.cizDugme.setVisible(true);
      }
    });
  }

  keremSorusu() {
    const k = veri.gorev;
    this.diyalog.soyle('ARGE', k.basari);
    this.ipucu.adimAyarla('gorev.kerem', [k.keremEksik]);
    for (const c of this.kartlar) c.setVisible(false);
    this.yonerge(k.keremYonerge);
    const video = this.ekle(keremVideoOlustur(this).setPosition(212, 290).setScale(0.82));
    video.olay('ac');
    this.guncelleyiciler.push((z) => video.guncelle(z));
    const keremYazi = this.yazi(40, 418, `Kerem: "${k.kerem}"`, { fontSize: '18px', color: '#FFD59A', wordWrap: { width: 350 } });
    const html = `<form class="giris" style="width:350px"><textarea name="metin" rows="3" maxlength="200" style="box-sizing:border-box;width:100%;font-size:19px;padding:10px;color:#EEF3F7;background:rgba(11,20,38,.95);border:2px solid #5FE3E8;border-radius:10px;font-family:inherit" placeholder="Sürat ile hız arasındaki fark…"></textarea><button type="submit">Kerem'e gönder</button></form>`;
    const form = this.ekle(this.add.dom(215, 548).createFromHTML(html));
    const alan = form.node.querySelector('textarea');
    form.node.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const metin = alan.value.trim();
      if (!metin) return;
      const m = metin.toLocaleLowerCase('tr');
      const tamam = k.keremAnahtarlar.every((grup) => grup.some((a) => m.includes(a)));
      this.cevap({ dogru: tamam, yanilgi: null, ayrinti: `kerem cevabi: ${metin}` });
      if (!tamam) {
        this.gorevHata += 1;
        return this.diyalog.soyle('Elif', k.keremEksik);
      }
      form.destroy();
      this.defterYaz({ tur: 'karsilastirma', metin, onay: 'beklemede' });
      keremYazi.setText(`Kerem: "${k.keremKabul}"`);
      video.olay('netles');
      const yildiz = this.gorevHata === 0 ? 3 : this.gorevHata <= 2 ? 2 : 1;
      this.yazi(212, 560, '★'.repeat(yildiz) + '☆'.repeat(3 - yildiz), { fontSize: '40px', color: '#FFD79A' }).setOrigin(0.5);
      this.time.delayedCall(4200, () => this.bitir(yildiz));
    });
  }
}
