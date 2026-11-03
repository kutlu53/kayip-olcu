import Phaser from 'phaser';
import BolumTemel from './BolumTemel.js';
import veri from '../../data/bolum6.json';
import { Izgara, izgaradaOk, STILLER } from '../../systems/VectorDraw.js';
import { topla, buyukluk, yaz } from '../../systems/VectorMath.js';
import { secenekler } from '../../ui/Secenekler.js';
import { cumleKurucu } from '../../ui/CumleKurucu.js';
import { cip } from '../../ui/Cip.js';
import { dugme } from '../../ui/Dugme.js';
import { YAZI, MONO } from '../../ui/tipografi.js';
import { halkaCiz, dunyaSimgesi, nokta, zemineDondur, kargoRobotuDokusu } from '../../art/Halka.js';
import { dunyaDokusu } from '../../art/Earth.js';
import { karistir } from '../../art/Rastgele.js';
import { PEDAGOJIK } from '../../config/colors.js';

const doldur = (s, d) => s.replace(/\{(\w+)\}/g, (_, k) => (k in d ? d[k] : `{${k}}`));
const SKALER = '#E6E8EB';
const VEKTOR = '#F28C28';
const IZGARA_M = 2; // bir izgara karesi 2 m

// Bolum 6 · Kim Hareket Ediyor? (FİZ.9.2.6): yol / yer degistirme / surat / hiz olcumleri -> referans noktasi ->
// alti tanim (en az 5 kabul) -> gizem: firtina uyarisi donen cerceveye cevrilmemis (CLAUDE.md §3, §7)
export default class Level6KimHareketEdiyor extends BolumTemel {
  constructor() {
    super('Level6KimHareketEdiyor', 6, 4);
  }

  arkaPlan() {
    this.add.image(470, 520, dunyaDokusu(this, { ufukY: 660, safak: 'sol' })).setAlpha(0.35);
  }

  basla(adim) {
    this.gorevHata = 0;
    this.tablo = [];
    kargoRobotuDokusu(this);
    if (adim === 'kesif2') this.kesif2();
    else if (adim === 'genelleme' || adim === 'gorev') {
      this.tablo = veri.kesif1.rotalar.map((r) => this.rotaOlc(r));
      if (adim === 'genelleme') this.genelleme();
      else this.gorev();
    } else {
      this.kesif1();
      this.diyalog.oynat(veri.giris);
    }
  }

  // Alt adim temizligi (Bolum 3 ile ayni yaklasim)
  adimBaslat(secenek) {
    super.adimBaslat(secenek);
    this.altAdimDizini = undefined;
    this.tabloNesneleri = null;
  }

  altAdimBaslat() {
    if (this.altAdimDizini !== undefined && this.altAdimDizini <= this.adimNesneleri.length) {
      for (const n of this.adimNesneleri.splice(this.altAdimDizini)) if (n && n.destroy) n.destroy();
    }
    this.altAdimDizini = this.adimNesneleri.length;
  }

  rotaOlc(r) {
    const yol = r.parcalar.reduce((t, p) => t + buyukluk(p), 0);
    const yd = topla(...r.parcalar);
    const sure = yol / veri.kesif1.hiz;
    const ydBuyukluk = buyukluk(yd);
    return { ad: r.ad, yol, yd, ydBuyukluk, sure, yonAdi: r.yonAdi, surat: yol / sure, hiz: ydBuyukluk / sure };
  }

  // ---------------- KESIF 1: kargo robotu ----------------
  kesif1() {
    const k = veri.kesif1;
    this.adimBaslat({ no: 0, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'kesif1' });
    this.yonerge(k.yonerge);
    this.tablo = [];
    this.oranlarAcik = false;
    this.rota(0);
  }

  rota(i) {
    const k = veri.kesif1;
    const r = k.rotalar[i];
    this.altAdimBaslat();
    this.tabloCiz();
    this.yazi(40, 152, `ROTA ${r.ad} · ${i + 1}/${k.rotalar.length}`, { fontFamily: MONO, fontSize: '13px', color: '#5FE3E8' });
    if (r.kerem) this.yazi(40, 172, r.kerem, { fontSize: '16px', color: '#FFD59A', wordWrap: { width: 460 } });
    const saat = this.yazi(40, 222, 'Saat: 0 s', { fontFamily: MONO, fontSize: '15px', color: '#D8F6FF' });
    const sayac = this.yazi(200, 222, 'Yol sayacı: 0 m', { fontFamily: MONO, fontSize: '15px', color: SKALER });

    const iz = new Izgara({ x: 86, y: 420, birim: 26, sol: -1, sag: 16, alt: -1, ust: 6 });
    const g = this.ekle(this.add.graphics());
    iz.ciz(g);
    const [ox, oy] = iz.ekran([0, 0]);
    g.fillStyle(0xffffff, 1).fillCircle(ox, oy, 5);
    this.yazi(ox, oy + 8, 'BAŞLANGIÇ', { fontFamily: MONO, fontSize: '10px', color: '#8A96A6' }).setOrigin(0.5, 0);
    this.yazi(iz.ekran([15.6, 5.6])[0], iz.ekran([15.6, 5.6])[1], 'K ↑', { fontFamily: YAZI, fontSize: '14px', fontStyle: 'bold', color: '#D8F6FF' }).setOrigin(1, 0);
    this.yazi(iz.ekran([16, -1])[0], iz.ekran([16, -1])[1] + 4, '1 kare = 2 m', { fontFamily: MONO, fontSize: '11px', color: '#8A96A6' }).setOrigin(1, 0);
    const iz2 = this.ekle(this.add.graphics());
    const okG = this.ekle(this.add.graphics());
    const robot = this.ekle(this.add.image(ox, oy, 'kargo_robotu').setScale(0.9));

    const calistir = () => {
      const olc = this.rotaOlc(r);
      // Parca uc noktalari (izgara biriminde)
      const noktalar = [[0, 0]];
      for (const p of r.parcalar) {
        const [px, py] = noktalar[noktalar.length - 1];
        noktalar.push([px + p[0] / IZGARA_M, py + p[1] / IZGARA_M]);
      }
      this.tweens.addCounter({
        from: 0,
        to: olc.yol,
        duration: Math.max(1600, olc.sure * 220),
        onUpdate: (tw) => {
          // Robot rota boyunca sabit suratle ilerler; iz alinan yolu (skaler) gosterir
          let kalan = tw.getValue();
          let konum = noktalar[0];
          for (let j = 0; j < r.parcalar.length; j++) {
            const uzun = buyukluk(r.parcalar[j]);
            const u = Math.min(1, kalan / uzun);
            const [ax, ay] = noktalar[j];
            const [bx, by] = noktalar[j + 1];
            konum = [ax + (bx - ax) * u, ay + (by - ay) * u];
            kalan -= uzun;
            if (kalan <= 0) break;
          }
          const [sx, sy] = iz.ekran(konum);
          robot.setPosition(sx, sy);
          iz2.fillStyle(0xe6e8eb, 0.55).fillCircle(sx, sy, 2);
          sayac.setText(`Yol sayacı: ${Math.round(tw.getValue())} m`);
          saat.setText(`Saat: ${Math.round(tw.getValue() / k.hiz)} s`);
        },
        onComplete: () => {
          // Yer degistirme: baslangictan son konuma yonlu ok
          if (olc.ydBuyukluk > 0.01) izgaradaOk(okG, iz, [0, 0], [olc.yd[0] / IZGARA_M, olc.yd[1] / IZGARA_M], STILLER.vektor);
          else okG.lineStyle(3, PEDAGOJIK.vektor, 1).strokeCircle(ox, oy, 12);
          this.yazi(40, 470, `Başlangıçtan son konuma ok: ${this.ydMetin(olc)}`, { fontSize: '17px', fontStyle: 'bold', color: VEKTOR });
          this.tablo[i] = olc;
          this.tabloCiz();
          this.diyalog.soyle('ARGE', r.sonuc);
          if (i + 1 < k.rotalar.length) this.devam('Sonraki rota  ▸', () => this.rota(i + 1));
          else {
            this.time.delayedCall(2500, () => {
              this.oranlarAcik = true;
              this.tabloCiz();
              this.diyalog.soyle('ARGE', k.oranlar);
            });
            this.devam('Keşif 2  ▸', () => this.kesif2());
          }
        }
      });
    };

    if (r.tahmin) {
      this.ekle(
        secenekler(this, 540, 340, r.tahmin.soru, r.tahmin.secenekler, (s) => {
          this.cevap({ dogru: s.dogru, yanilgi: s.yanilgi, ayrinti: `rota ${r.ad} tahmin: ${s.metin}` });
          calistir();
        }, { genislik: 370, yukseklik: 46 })
      );
    } else {
      const basla = this.ekle(dugme(this, 725, 380, 'Rotayı başlat  ▸', () => {
        basla.setVisible(false);
        calistir();
      }, { genislik: 240, yukseklik: 56, birincil: true, boyut: 18 }));
    }
  }

  ydMetin(o) {
    return o.ydBuyukluk < 0.01 ? '0 m' : `${yaz(o.ydBuyukluk)} m ${o.yonAdi}`;
  }

  tabloCiz(x = 530, y = 150) {
    if (this.tabloNesneleri) this.tabloNesneleri.forEach((n) => n.destroy());
    const sutunlar = [
      ['Rota', 40, SKALER],
      ['Süre', 48, SKALER],
      ['Alınan\nyol', 54, SKALER],
      ['Yer\ndeğiştirme', 98, VEKTOR],
      ['Yol ÷\nsüre', 66, SKALER],
      ['Yer değ.\n÷ süre', 82, VEKTOR]
    ];
    const W = sutunlar.reduce((t, s) => t + s[1], 0);
    const g = this.add.graphics();
    g.fillStyle(0x05070d, 0.85).fillRoundedRect(x, y, W, 70 + Math.max(1, this.tablo.length) * 26, 8);
    g.lineStyle(1, 0x5fe3e8, 0.4).strokeRoundedRect(x, y, W, 70 + Math.max(1, this.tablo.length) * 26, 8);
    const n = [g, this.add.text(x + 10, y + 6, 'VERİ TABLOSU', { fontFamily: MONO, fontSize: '12px', color: '#5FE3E8' })];
    let sx = x;
    for (const [ad, w, renk] of sutunlar) {
      n.push(this.add.text(sx + w / 2, y + 24, ad, { fontFamily: YAZI, fontSize: '12px', fontStyle: 'bold', color: renk, align: 'center' }).setOrigin(0.5, 0));
      sx += w;
    }
    this.tablo.forEach((o, j) => {
      if (!o) return;
      const yon = o.ydBuyukluk < 0.01 ? '' : ` ${o.yonAdi === 'kuzeydoğu' ? 'KD' : o.yonAdi}`;
      const degerler = [
        o.ad,
        `${o.sure} s`,
        `${o.yol} m`,
        o.ydBuyukluk < 0.01 ? '0 m' : `${yaz(o.ydBuyukluk)} m${yon}`,
        this.oranlarAcik ? `${yaz(o.surat)} m/s` : '',
        this.oranlarAcik ? (o.hiz < 0.01 ? '0' : `≈${yaz(o.hiz)} m/s${yon}`) : ''
      ];
      let cx = x;
      sutunlar.forEach(([, w, renk], c) => {
        n.push(this.add.text(cx + w / 2, y + 62 + j * 26, degerler[c], { fontFamily: YAZI, fontSize: '13px', color: renk }).setOrigin(0.5, 0));
        cx += w;
      });
    });
    this.tabloNesneleri = n;
    this.ekle(...n);
  }

  // ---------------- KESIF 2: uc gozlemci ----------------
  kesif2() {
    const k = veri.kesif2;
    this.adimBaslat({ no: 1, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'kesif2' });
    this.yonerge(k.yonerge);
    const PANELLER = [40, 336, 632];
    const PY = 150;
    const PW = 280;
    const PH = 270;
    const g = this.ekle(this.add.graphics());
    PANELLER.forEach((x, i) => {
      g.fillStyle(0x04080d, 0.9).fillRoundedRect(x, PY, PW, PH, 10);
      g.lineStyle(1.5, 0x5fe3e8, 0.4).strokeRoundedRect(x, PY, PW, PH, 10);
      this.yazi(x + PW / 2, PY + 10, k.gozlemciler[i].ad, { fontFamily: MONO, fontSize: '12px', color: '#5FE3E8' }).setOrigin(0.5, 0);
    });
    const saat = this.yazi(912, 128, '', { fontFamily: MONO, fontSize: '15px', color: '#D8F6FF' }).setOrigin(1, 0.5);
    const cizim = this.ekle(this.add.graphics());
    const robotlar = [0, 1].map(() => this.ekle(this.add.image(0, 0, 'kargo_robotu').setScale(0.7)));
    const R = 82;
    const merkez = (i) => [PANELLER[i] + PW / 2, PY + 150];
    const durum = { t: 0 };

    const ciz = () => {
      const t = durum.t;
      const aci = (360 * t) / 30;
      cizim.clear();
      // 1) Halkadaki gozlemci: halka durgun; merkez modul ve yildizlar ters yonde doner
      const [c1x, c1y] = merkez(0);
      cizim.fillStyle(0xd8f6ff, 0.6);
      for (let s = 0; s < 14; s++) {
        const [sx, sy] = nokta(c1x, c1y, 104 + (s % 3) * 8, s * 26 - aci);
        cizim.fillCircle(sx, sy, 1.3);
      }
      halkaCiz(cizim, c1x, c1y, R, 0, { kalinlik: 12, merkezAci: -aci });
      const [r1x, r1y] = nokta(c1x, c1y, R - 14, 270);
      robotlar[0].setPosition(r1x, r1y).setRotation(zemineDondur(270));
      // 2) Merkez modul: halka doner, robot halkayla daire cizer
      const [c2x, c2y] = merkez(1);
      halkaCiz(cizim, c2x, c2y, R, aci, { kalinlik: 12, merkezAci: 0 });
      if (aci > 1) {
        cizim.lineStyle(2, 0xe6e8eb, 0.7).beginPath();
        cizim.arc(c2x, c2y, R - 14, (-270 * Math.PI) / 180, (-(270 + aci) * Math.PI) / 180, true);
        cizim.strokePath();
      }
      const [r2x, r2y] = nokta(c2x, c2y, R - 14, 270 + aci);
      robotlar[1].setPosition(r2x, r2y).setRotation(zemineDondur(270 + aci));
      // 3) Dunya: istasyon yorungede ilerler (30 s'de ~230 km)
      const x3 = PANELLER[2];
      const dcx = x3 + PW / 2;
      const dcy = PY + PH + 420;
      const kavis = [];
      for (let px = x3 + 2; px <= x3 + PW - 2; px += 8) kavis.push({ x: px, y: dcy - Math.sqrt(470 * 470 - (px - dcx) * (px - dcx)) });
      cizim.fillStyle(0x16305a, 1).fillPoints([...kavis, { x: x3 + PW - 2, y: PY + PH - 2 }, { x: x3 + 2, y: PY + PH - 2 }], true);
      cizim.lineStyle(2, 0x6fa8e8, 0.7).strokePoints(kavis);
      const ilk = x3 + 40;
      const son = x3 + PW - 40;
      const ix = ilk + ((son - ilk) * t) / 30;
      cizim.lineStyle(2, 0xe6e8eb, 0.6).lineBetween(ilk, PY + 150, ix, PY + 150);
      cizim.fillStyle(0xffffff, 1).fillCircle(ilk, PY + 150, 3);
      halkaCiz(cizim, ix, PY + 150, 9, aci, { kalinlik: 3 });
      saat.setText(t > 0 ? `t = ${Math.round(t)} s` : '');
    };
    ciz();
    this.guncelleyiciler.push(() => ciz());

    const kartlar = this.ekle(
      secenekler(this, 140, 440, k.tahmin.soru, k.tahmin.secenekler, (s) => {
        this.cevap({ dogru: s.dogru, yanilgi: s.yanilgi, ayrinti: `kesif2 tahmin: ${s.metin}` });
        this.tweens.add({
          targets: durum, t: 30, duration: 6000, delay: 400,
          onComplete: () => {
            kartlar.setVisible(false);
            PANELLER.forEach((x, i) => {
              const o = k.gozlemciler[i];
              this.yazi(x + 8, PY + PH + 10, `${o.konum}\n${o.yol}\n${o.yd}`, { fontSize: '15px', color: '#D8F6FF', lineSpacing: 4 });
            });
            this.yazi(40, 512, k.not, { fontSize: '13px', color: '#8A96A6' });
            this.k2Ozet = k.gozlemciler.map((o) => `${o.ad}: ${o.yol}, ${o.yd}`).join(' · ');
            this.diyalog.soyle('ARGE', s.dogru ? k.dogru : k.yanlis);
            this.devam('Tanımları kur  ▸', () => this.genelleme());
          }
        });
      }, { genislik: 560, yukseklik: 44 })
    );
  }

  // ---------------- GENELLEME: alti tanim ----------------
  genelleme() {
    const k = veri.genelleme;
    this.adimBaslat({ no: 2, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'genelleme' });
    this.yonerge(k.yonerge);
    this.tanimDurum = k.tanimlar.map(() => null); // null | 'kabul' | 'gecildi'
    this.tanimDenemesi = k.tanimlar.map(() => 0);
    this.ozet = this.tablo.map((o) => `${o.ad}: ${o.sure} s, yol ${o.yol} m, yer değiştirme ${this.ydMetin(o)}`).join(' · ');
    this.tanimGoster(0);
  }

  tanimGoster(i) {
    const k = veri.genelleme;
    const t = k.tanimlar[i];
    this.altAdimBaslat();
    this.tanimNo = i;
    // Ilerleme: alti nokta
    const g = this.ekle(this.add.graphics());
    k.tanimlar.forEach((_, j) => {
      const d = this.tanimDurum[j];
      const x = 690 + j * 34;
      g.lineStyle(2, d === 'kabul' ? 0x5fe3e8 : d === 'gecildi' ? 0xd64545 : 0x8a96a6, 1).strokeCircle(x, 156, 11);
      if (d === 'kabul') g.fillStyle(0x5fe3e8, 0.9).fillCircle(x, 156, 6);
      if (j === i) g.lineStyle(2, 0xffffff, 1).strokeCircle(x, 156, 15);
    });
    this.yazi(40, 142, `TANIM ${i + 1}/6 · ${t.terim.toLocaleUpperCase('tr')}`, { fontSize: '22px', fontStyle: 'bold', color: '#FFFFFF' });
    const parcalar = karistir([...t.parcalar, ...t.celdiriciler.map((c) => c.metin)]);
    this.ekle(cumleKurucu(this, { x: 120, y: 190, genislik: 800, parcalar, kontrol: (c) => this.tanimKontrol(c), bosMetin: 'Parçalara dokunarak tanımı kur…' }));
  }

  tanimKontrol(c) {
    const k = veri.genelleme;
    const i = this.tanimNo;
    // Kabul edilen tanim ARGE tekrar ederken yeniden gonderilemez
    if (this.tanimDurum[i] !== null) return;
    const t = k.tanimlar[i];
    let kabul = false;
    let yanilgi = null;
    let mesaj = k.eksik;
    if (c.tur === 'parca') {
      kabul = c.parcalar.length === t.parcalar.length && t.parcalar.every((p, j) => p === c.parcalar[j]);
      const celdirici = t.celdiriciler.find((d) => c.parcalar.includes(d.metin));
      if (celdirici) {
        yanilgi = celdirici.yanilgi;
        mesaj = celdirici.mesaj;
      }
    } else {
      const m = c.metin.toLocaleLowerCase('tr');
      kabul = t.anahtarlar.every((grup) => grup.some((a) => m.includes(a))) && !(t.yasak || []).some((y) => m.includes(y));
      mesaj = doldur(k.serbestEksik, { anahtar: t.anahtarlar.map((grup) => `"${grup[0]}"`).join(', ') });
    }
    const onay = c.tur === 'parca' ? 'otomatik' : 'beklemede';
    this.cevap({ dogru: kabul, yanilgi: kabul ? null : yanilgi, ayrinti: `tanim ${t.terim}${kabul ? ` (${onay})` : ''}: ${c.metin}` });
    if (!kabul) {
      this.tanimDenemesi[i] += 1;
      this.diyalog.soyle('ARGE', mesaj);
      if (this.tanimDenemesi[i] === 2) this.gecDugmesi = this.devam('Bu tanımı geç  ▸', () => this.tanimBitti(i, 'gecildi'), { x: 800, y: 664 });
      return;
    }
    this.defterYaz({ tur: 'tanim', metin: c.metin, onay });
    // Referans noktasi tanimi bolumun kurali: ARGE 6K'da bunu tekrar eder
    if (t.terim === 'Referans noktası') this.defterYaz({ tur: 'kural', metin: c.metin, onay });
    if (this.gecDugmesi) this.gecDugmesi.destroy();
    this.gecDugmesi = null;
    this.diyalog.soyle('ARGE', `${k.kabul} "${c.metin}"`);
    // ARGE ogrencinin cumlesini tekrar ederken sonraki tanim acilip onu kesmesin
    this.tanimBitti(i, 'kabul', Math.max(1600, this.panel.argeMesgul - this.time.now));
  }

  tanimBitti(i, durum, bekle = 0) {
    const k = veri.genelleme;
    this.tanimDurum[i] = durum;
    this.time.delayedCall(bekle, () => {
      const sonraki = this.tanimDurum.findIndex((d, j) => d === null && j > i);
      if (sonraki >= 0) return this.tanimGoster(sonraki);
      const kabulSayisi = this.tanimDurum.filter((d) => d === 'kabul').length;
      if (kabulSayisi >= k.enAz) {
        this.tablo.length && this.defterYaz({ tur: 'tablo', metin: `Kargo robotu: ${this.ozet}` });
        // Referans noktasi gecildiyse ilk kabul edilen tanim kural olarak yazilir
        if (this.tanimDurum[0] !== 'kabul') {
          const ilk = (this.oyuncu.defter || []).filter((d) => d.bolum === 6 && d.tur === 'tanim').pop();
          if (ilk) this.defterYaz({ tur: 'kural', metin: ilk.metin, onay: ilk.onay });
        }
        this.altAdimBaslat();
        this.yazi(120, 220, doldur(k.tamam, { n: kabulSayisi }), { fontSize: '22px', color: '#FFFFFF', wordWrap: { width: 780 } });
        this.diyalog.soyle('ARGE', doldur(k.tamam, { n: kabulSayisi }));
        return this.devam('Gizemi çöz  ▸', () => this.gorev());
      }
      // Yeterli degil: gecilen tanimlara donulur (deneme sayaci sifirlanir)
      this.diyalog.soyle('ARGE', doldur(k.yetersiz, { n: kabulSayisi }));
      this.tanimDurum = this.tanimDurum.map((d) => (d === 'gecildi' ? null : d));
      this.tanimDenemesi = this.tanimDenemesi.map(() => 0);
      this.time.delayedCall(1800, () => this.tanimGoster(this.tanimDurum.findIndex((d) => d === null)));
    });
  }

  // ---------------- GOREV: gizem ----------------
  gorev() {
    const k = veri.gorev;
    this.adimBaslat({ no: 3, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'gorev' });
    this.yonerge(k.yonerge);
    this.senaryo(0);
  }

  senaryo(i) {
    const k = veri.gorev;
    const s = k.senaryolar[i];
    this.altAdimBaslat();
    this.yazi(40, 150, `SENARYO ${s.ad}`, { fontFamily: MONO, fontSize: '13px', color: '#5FE3E8' });
    this.yazi(40, 168, s.aciklama, { fontSize: '16px', color: '#D8F6FF' });
    const SOL = { x: 40, merkez: [250, 340], baslik: 'MERKEZ MODÜLE GÖRE' };
    const SAG = { x: 490, merkez: [700, 340], baslik: 'HALKAYA GÖRE (antenin gördüğü)' };
    const g = this.ekle(this.add.graphics());
    for (const p of [SOL, SAG]) {
      g.fillStyle(0x04080d, 0.9).fillRoundedRect(p.x, 196, 420, 300, 10);
      g.lineStyle(1.5, 0x5fe3e8, 0.4).strokeRoundedRect(p.x, 196, 420, 300, 10);
      this.yazi(p.x + 12, 204, p.baslik, { fontFamily: MONO, fontSize: '12px', color: '#5FE3E8' });
    }
    this.yazi(SOL.x + 12, 474, `halka ${s.halka}° dönmüş`, { fontFamily: MONO, fontSize: '12px', color: '#8A96A6' });
    const cizim = this.ekle(this.add.graphics());
    const R = 76;
    const DUNYA_UZ = 116;
    const durum = { anten: 270, isin: 0, isinAci: null, isabet: false };
    const aciYazi = this.yazi(476, 560, '', { fontSize: '18px', fontStyle: 'bold', color: VEKTOR }).setOrigin(0.5);
    const dunyaYazilari = [SOL, SAG].map((p) => this.yazi(0, 0, 'DÜNYA', { fontFamily: MONO, fontSize: '11px', color: '#D8F6FF' }).setOrigin(0.5));

    const ciz = () => {
      cizim.clear();
      // Sol: merkez modul cercevesi. Dunya 270°'de, halka s.halka kadar donmus
      // Sag: halka cercevesi. Halka duz; Dunya 270 - s.halka yonunde gorunur
      [[SOL, s.halka, k.hedef], [SAG, 0, k.hedef - s.halka]].forEach(([p, halkaAci, dunyaAci], j) => {
        const [cx, cy] = p.merkez;
        const [dx, dy] = nokta(cx, cy, DUNYA_UZ, dunyaAci);
        dunyaSimgesi(cizim, dx, dy, 22);
        dunyaYazilari[j].setPosition(dx, dy);
        halkaCiz(cizim, cx, cy, R, halkaAci, { kalinlik: 10, merkezAci: j === 0 ? 0 : -s.halka });
        const antenDunya = durum.anten + halkaAci;
        const [ax, ay] = nokta(cx, cy, R + 6, antenDunya);
        const [bx, by] = nokta(cx, cy, R + 18, antenDunya);
        cizim.lineStyle(5, 0xe6e8eb, 1).lineBetween(ax, ay, bx, by);
        cizim.fillStyle(0xe6e8eb, 1).fillCircle(bx, by, 5);
        if (durum.isinAci !== null && durum.isin > 0) {
          const isinYerel = durum.isinAci - s.halka + halkaAci;
          const [ex, ey] = nokta(cx, cy, R + 18 + durum.isin, isinYerel);
          cizim.lineStyle(4, PEDAGOJIK.vektor, 0.95).lineBetween(bx, by, ex, ey);
        }
        if (durum.isabet) cizim.lineStyle(3, 0x5fe3e8, 1).strokeCircle(dx, dy, 28);
      });
      aciYazi.setText(`Anten: ${durum.anten}°  (halkaya göre)`);
    };
    ciz();
    this.guncelleyiciler.push(ciz);

    let mesgul = false;
    const dondur = (adim) => {
      if (mesgul) return;
      durum.isinAci = null;
      durum.isabet = false;
      durum.anten = (durum.anten + adim + 360) % 360;
    };
    this.ekle(cip(this, 230, 560, '⟲  30°', () => dondur(30), { genislik: 120, boyut: 18 }));
    this.ekle(cip(this, 722, 560, '30°  ⟳', () => dondur(-30), { genislik: 120, boyut: 18 }));
    const gonder = this.ekle(dugme(this, 476, 628, 'GÖNDER  ▸', () => ates(), { genislik: 220, yukseklik: 56, birincil: true, boyut: 19 }));

    const ates = () => {
      if (mesgul) return;
      mesgul = true;
      const dunyaAci = (durum.anten + s.halka) % 360;
      const fark = Math.min(Math.abs(dunyaAci - k.hedef), 360 - Math.abs(dunyaAci - k.hedef));
      const isabet = fark <= 15;
      const mutlak = durum.anten === k.hedef;
      const ters = durum.anten === (k.hedef + s.halka) % 360;
      this.cevap({
        dogru: isabet,
        yanilgi: !isabet && mutlak ? 'M_HAREKET_MUTLAK' : null,
        ayrinti: `senaryo ${i + 1}: halka ${s.halka}°, anten ${durum.anten}° → merkeze göre ${dunyaAci}°${ters ? ' (ters dönüş)' : ''}`
      });
      durum.isinAci = dunyaAci;
      durum.isin = 0;
      this.tweens.add({
        targets: durum, isin: isabet ? DUNYA_UZ - R - 40 : 105, duration: 900, ease: 'Quad.easeIn',
        onComplete: () => {
          mesgul = false;
          if (isabet) {
            durum.isabet = true;
            gonder.setVisible(false);
            this.diyalog.soyle('ARGE', i === 0 ? k.basari1 : k.basari2);
            if (i + 1 < k.senaryolar.length) this.devam('Sonraki  ▸', () => this.senaryo(i + 1), { x: 800, y: 664 });
            else this.time.delayedCall(1600, () => this.gorevBitti());
            return;
          }
          this.gorevHata += 1;
          this.diyalog.soyle('ARGE', mutlak ? k.mutlak : ters ? k.ters : k.iska);
        }
      });
    };

    // Ilk senaryoda once kayit oynatilir: anten 270° ile ates, isin uzaya gider
    if (i === 0) {
      mesgul = true;
      const sure = this.diyalog.oynat(k.kayit);
      this.time.delayedCall(4600, () => {
        durum.isinAci = (270 + s.halka) % 360;
        this.tweens.add({ targets: durum, isin: 105, duration: 1000, ease: 'Quad.easeIn' });
      });
      this.time.delayedCall(sure, () => {
        durum.isinAci = null;
        mesgul = false;
      });
    }
  }

  gorevBitti() {
    this.defterYaz({ tur: 'gizem', metin: 'Fırtına uyarısının yönü merkez modüle göre hesaplanmış ama dönen halkadaki anten bu açıyı kendi referans çerçevesine çevirmemişti.' });
    const yildiz = this.gorevHata === 0 ? 3 : this.gorevHata <= 2 ? 2 : 1;
    this.yazi(476, 540, '★'.repeat(yildiz) + '☆'.repeat(3 - yildiz), { fontSize: '40px', color: '#FFD79A' }).setOrigin(0.5).setDepth(10);
    this.time.delayedCall(3600, () => this.bitir(yildiz));
  }
}
