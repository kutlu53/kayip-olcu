import Phaser from 'phaser';
import BolumTemel from './BolumTemel.js';
import veri from '../../data/bolum5.json';
import { secenekler } from '../../ui/Secenekler.js';
import { cumleKurucu } from '../../ui/CumleKurucu.js';
import { cip } from '../../ui/Cip.js';
import { dugme } from '../../ui/Dugme.js';
import { YAZI, MONO } from '../../ui/tipografi.js';
import { reaktorDokusu } from '../../art/Reaktor.js';
import { kivilcimYayici } from '../../fx/Particles.js';
import { karistir } from '../../art/Rastgele.js';

const K = veri.kuvvetler;
const SIRA = ['kutle', 'em', 'guclu', 'zayif'];
const doldur = (s, d) => s.replace(/\{(\w+)\}/g, (_, k) => (k in d ? d[k] : `{${k}}`));
const renkSayi = (css) => parseInt(css.slice(1), 16);
const kuvvetAdi = (id) => (id === 'surtunme' ? veri.kesif1.surtunme.ad : K[id].ad);
const kisaMenzil = (id) => K[id].menzilUs < 0;

// Bolum 5 · Dort Kuvvet (FİZ.9.2.5): olay-kuvvet eslestirme -> menzil ve siddet olcumu -> genelleme -> kuvvet panosu.
// Gameplay'de turuncu, doygun mavi ve yesil kullanilmaz (vektor renkleri, CLAUDE.md §10.5)
export default class Level5DortKuvvet extends BolumTemel {
  constructor() {
    super('Level5DortKuvvet', 5, 4);
  }

  arkaPlan() {
    this.add.image(470, 410, reaktorDokusu(this)).setAlpha(0.14);
  }

  basla(adim) {
    this.gorevHata = 0;
    this.olcumler = {};
    if (adim === 'kesif2') this.kesif2();
    else if (adim === 'genelleme' || adim === 'gorev') {
      if (adim === 'genelleme') this.genelleme();
      else this.gorev();
    } else {
      this.kesif1();
      this.diyalog.oynat(veri.giris);
    }
  }

  ikonCiz(g, tur, x, y, kap) {
    const harf = (hx, hy, m, stil) => kap.add(this.add.text(hx, hy, m, { fontFamily: YAZI, ...stil }).setOrigin(0.5));
    const dunyaKavsi = () => {
      g.fillStyle(0x16305a, 1).beginPath();
      g.arc(x, y + 75, 63, (216 * Math.PI) / 180, (324 * Math.PI) / 180, false);
      g.closePath().fillPath();
      g.lineStyle(1.5, 0x6fa8e8, 0.6).beginPath();
      g.arc(x, y + 75, 63, (216 * Math.PI) / 180, (324 * Math.PI) / 180, false);
      g.strokePath();
    };
    if (tur === 'yorunge') {
      dunyaKavsi();
      g.lineStyle(1.5, 0x8a96a6, 0.7);
      for (let a = 200; a < 340; a += 12) {
        const r1 = (a * Math.PI) / 180;
        const r2 = ((a + 6) * Math.PI) / 180;
        g.lineBetween(x + Math.cos(r1) * 86, y + 75 + Math.sin(r1) * 86, x + Math.cos(r2) * 86, y + 75 + Math.sin(r2) * 86);
      }
      g.fillStyle(0xffffff, 1).fillRect(x + 38, y - 5, 10, 6);
      g.lineStyle(2, 0xffffff, 0.9).lineBetween(x + 41, y + 3, x + 30, y + 22);
      g.fillStyle(0xffffff, 0.9).fillTriangle(x + 26, y + 28, x + 26, y + 17, x + 35, y + 22);
    } else if (tur === 'isik') {
      dunyaKavsi();
      for (let i = 0; i < 14; i++) {
        const xx = x - 48 + i * 7.4;
        const taban = y + 75 - Math.sqrt(Math.max(0, 63 * 63 - (xx - x) * (xx - x))) + 4;
        const h = 22 + 12 * Math.sin(i * 0.9);
        g.lineStyle(3, 0x6fbf9a, 0.55).lineBetween(xx, taban, xx, taban - h);
        g.lineStyle(2, 0xb07aa0, 0.35).lineBetween(xx, taban - h, xx, taban - h - 8);
      }
    } else if (tur === 'fisyon') {
      const parcalar = [[-8, -8, 1], [8, -6, 0], [0, 6, 1], [-12, 8, 0], [12, 8, 1], [-2, -18, 0], [16, -16, 1]];
      for (const [dx, dy, p] of parcalar) {
        g.fillStyle(p ? 0xc86060 : 0x8a96a6, 1).fillCircle(x + dx, y + dy, 8);
        g.lineStyle(1, 0x000000, 0.4).strokeCircle(x + dx, y + dy, 8);
      }
      g.lineStyle(2, 0xffffff, 0.8);
      for (const a of [0.5, 2.6, 4.4]) {
        const ux = Math.cos(a);
        const uy = Math.sin(a);
        g.lineBetween(x + ux * 30, y + uy * 30, x + ux * 44, y + uy * 44);
        g.fillStyle(0xffffff, 0.8).fillTriangle(x + ux * 48, y + uy * 48, x + ux * 40 - uy * 5, y + uy * 40 + ux * 5, x + ux * 40 + uy * 5, y + uy * 40 - ux * 5);
      }
    } else if (tur === 'bozunma') {
      g.fillStyle(0x8a96a6, 1).fillCircle(x - 44, y, 12);
      g.lineStyle(2, 0xffffff, 0.8).lineBetween(x - 26, y, x - 6, y);
      g.fillStyle(0xffffff, 0.8).fillTriangle(x - 2, y, x - 9, y - 5, x - 9, y + 5);
      g.fillStyle(0xc86060, 1).fillCircle(x + 16, y, 12);
      g.fillStyle(0xd8f6ff, 1).fillCircle(x + 46, y - 18, 5);
      g.lineStyle(1.5, 0xd8f6ff, 0.7).lineBetween(x + 26, y - 6, x + 40, y - 15);
      harf(x - 44, y, 'n', { fontSize: '13px', fontStyle: 'bold', color: '#05070D' });
      harf(x + 16, y, 'p', { fontSize: '13px', fontStyle: 'bold', color: '#05070D' });
      harf(x + 60, y - 22, 'e⁻', { fontSize: '12px', color: '#D8F6FF' });
    }
  }

  // ---------------- KESIF 1: dort alarm ----------------
  kesif1() {
    const k = veri.kesif1;
    this.adimBaslat({ no: 0, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'kesif1' });
    this.yonerge(k.yonerge);
    let secOlay = null;
    let secKart = null;
    let kalan = k.olaylar.length;
    this.eslesmeler = {};

    const kartlar = k.olaylar.map((o, i) => {
      const x = 40 + i * 222;
      const y = 150;
      const kap = this.ekle(this.add.container(x + 105, y + 134));
      const ic = this.add.container(-105, -134);
      kap.add(ic);
      const g = this.add.graphics();
      const ikon = this.add.graphics();
      ic.add([g, ikon]);
      const baslik = this.add.text(12, 10, `▲ ${o.ad}`, { fontFamily: MONO, fontSize: '13px', fontStyle: 'bold', color: '#FF6B6B' });
      const veriler = this.add.text(12, 116, o.veriler.join('\n'), { fontFamily: YAZI, fontSize: '13px', color: '#D8F6FF', wordWrap: { width: 186 }, lineSpacing: 2 });
      const sonuc = this.add.text(105, 246, '', { fontFamily: YAZI, fontSize: '15px', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
      ic.add([baslik, veriler, sonuc]);
      kap.ciz = (d) => {
        const kenar = { bos: [0x3a4656, 1], secili: [0xffffff, 1], tamam: [renkSayi(K[o.dogru].renk), 1], yanlis: [0xd64545, 1] }[d];
        g.clear();
        g.fillStyle(0x05070d, 0.92).fillRoundedRect(0, 0, 210, 268, 10);
        g.lineStyle(d === 'secili' ? 3 : 2, kenar[0], kenar[1]).strokeRoundedRect(0, 0, 210, 268, 10);
      };
      kap.durum = 'bos';
      kap.ciz('bos');
      // ikon kapsayicinin yerel koordinatlarinda
      this.ikonCiz(ikon, o.ikon, 105, 70, ic);
      kap.sonuc = sonuc;
      kap.baslik = baslik;
      kap.setSize(210, 268).setInteractive({ useHandCursor: true });
      kap.on('pointerup', () => {
        if (kap.durum === 'tamam') return;
        secOlay = i;
        kartlar.forEach((c, j) => c.durum !== 'tamam' && c.ciz(j === i ? 'secili' : c.durum));
        if (secKart) ata(i, secKart);
      });
      return kap;
    });
    const kuvvetCipleri = k.kartlar.map((id, j) =>
      this.ekle(
        cip(this, 125 + j * 172, 470, kuvvetAdi(id).replace(' kuvvet', ''), (c) => {
          if (secOlay !== null) return ata(secOlay, id);
          secKart = id;
          kuvvetCipleri.forEach((d) => d.durum !== 'pasif' && d.durumAyarla(d === c ? 'secili' : 'normal'));
        }, { genislik: 164, boyut: 15 })
      )
    );

    const ata = (i, id) => {
      const o = k.olaylar[i];
      const kart = kartlar[i];
      secOlay = null;
      secKart = null;
      kuvvetCipleri.forEach((d) => d.durum === 'secili' && d.durumAyarla('normal'));
      if (id === o.dogru) {
        kart.durum = 'tamam';
        kart.ciz('tamam');
        kart.baslik.setText(`● ${o.ad}`).setColor('#5FE3E8');
        kart.sonuc.setText(K[id].ad).setColor(K[id].renk);
        kart.disableInteractive();
        this.eslesmeler[o.id] = id;
        this.cevap({ dogru: true, ayrinti: `alarm ${o.id}: ${id}` });
        this.diyalog.soyle('ARGE', o.dogruMesaj);
        kalan -= 1;
        if (kalan === 0) this.time.delayedCall(1800, keremSorusu);
        return;
      }
      kart.durum = 'yanlis';
      kart.ciz('yanlis');
      const surtunme = id === 'surtunme';
      this.cevap({ dogru: false, yanilgi: surtunme ? 'M_SURTUNME_TEMEL' : null, ayrinti: `alarm ${o.id}: ${id}` });
      const mesaj = (o.ozel && o.ozel[id]) || (surtunme ? k.surtunme.mesaj : doldur(k.yanlisSablon, { kuvvet: kuvvetAdi(id), ipucu: o.ipucu }));
      this.diyalog.soyle('ARGE', mesaj);
    };

    const keremSorusu = () => {
      const s = k.kerem;
      kuvvetCipleri.forEach((c) => c.setVisible(false));
      this.ekle(
        secenekler(this, 140, 438, s.soru, s.secenekler, (sec) => {
          this.cevap({ dogru: sec.dogru, yanilgi: sec.yanilgi, ayrinti: `kerem yercekimi: ${sec.metin}` });
          this.diyalog.soyle('ARGE', sec.dogru ? s.dogru : s.yanlis);
          this.devam('Keşif 2  ▸', () => this.kesif2());
        }, { genislik: 600, yukseklik: 50 })
      );
    };
  }

  // ---------------- KESIF 2: menzil ve siddet ----------------
  kesif2() {
    const k = veri.kesif2;
    this.adimBaslat({ no: 1, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'kesif2' });
    this.yonerge(k.yonerge);
    const ziyaret = new Set();
    const SOL = 300;
    const SAG = 880;
    const satirY = (i) => 290 + i * 56;

    // Iki proton ve aradaki uzaklik
    const pg = this.ekle(this.add.graphics());
    const uzYazi = this.yazi(560, 228, 'bir uzaklık seç', { fontFamily: MONO, fontSize: '14px', color: '#D8F6FF' }).setOrigin(0.5);
    const cizProton = () => {
      pg.clear();
      pg.fillStyle(0xc86060, 1).fillCircle(470, 252, 10).fillCircle(650, 252, 10);
      pg.lineStyle(1.5, 0xd8f6ff, 0.6).lineBetween(484, 252, 636, 252);
    };
    cizProton();

    const cubuklar = SIRA.map((id, i) => {
      this.yazi(40, satirY(i) - 10, K[id].ad, { fontSize: '16px', fontStyle: 'bold', color: K[id].renk });
      const g = this.ekle(this.add.graphics());
      const durum = this.yazi(SAG + 8, satirY(i) - 9, '', { fontFamily: MONO, fontSize: '13px', color: '#8A96A6' });
      g.fillStyle(0x1a2330, 1).fillRoundedRect(SOL, satirY(i) - 10, SAG - SOL, 20, 6);
      return { id, g, durum, dolu: 0 };
    });
    const cubukCiz = (us) => {
      for (const c of cubuklar) {
        const etkili = us <= K[c.id].menzilUs;
        this.tweens.add({
          targets: c, dolu: etkili ? 1 : 0, duration: 400,
          onUpdate: () => {
            const y = satirY(cubuklar.indexOf(c)) - 10;
            c.g.clear().fillStyle(0x1a2330, 1).fillRoundedRect(SOL, y, SAG - SOL, 20, 6);
            if (c.dolu > 0.03) c.g.fillStyle(renkSayi(K[c.id].renk), 0.85).fillRoundedRect(SOL, y, (SAG - SOL) * c.dolu, 20, 6);
          }
        });
        c.durum.setText(etkili ? 'etkili' : 'yok').setColor(etkili ? K[c.id].renk : '#5d6878');
      }
    };

    const ciplar = k.uzakliklar.map((u, j) =>
      this.ekle(
        cip(this, 124 + j * 172, 172, `${u.etiket}\n${u.aciklama}`, (c) => {
          ziyaret.add(u.etiket);
          ciplar.forEach((d) => d.durumAyarla(ziyaret.has(d.u) ? 'dogru' : 'normal'));
          c.durumAyarla('secili');
          uzYazi.setText(`uzaklık: ${u.etiket}`);
          cubukCiz(u.us);
          this.olcumler[u.etiket] = SIRA.filter((id) => u.us <= K[id].menzilUs).map((id) => K[id].kisa);
          if (ziyaret.size === k.uzakliklar.length && !this.menzilBitti) {
            this.menzilBitti = true;
            this.diyalog.soyle('ARGE', k.menzilSonuc);
            this.time.delayedCall(2200, () => this.siddetOlcumu());
          }
        }, { genislik: 164, yukseklik: 56, boyut: 14 })
      )
    );
    ciplar.forEach((c, j) => (c.u = k.uzakliklar[j].etiket));
    this.menzilBitti = false;
    this.k2 = { cubuklar, ciplar, uzYazi, satirY, SOL, SAG };
  }

  siddetOlcumu() {
    const s = veri.kesif2.siddet;
    this.ekle(
      secenekler(this, 160, 520, s.soru, s.secenekler, (sec) => {
        this.cevap({ dogru: sec.dogru, yanilgi: sec.yanilgi, ayrinti: `en guclu tahmini: ${sec.metin}` });
        // Olcum cekirdek icinde (10⁻¹⁵ m): menzil cubuklari yerine siddet cubuklari.
        // Logaritmik olcek: uzunluk = (38 + us) / 38; her 10 kat ayni adim
        const { cubuklar, ciplar, uzYazi, satirY, SOL, SAG } = this.k2;
        ciplar.forEach((c) => c.disableInteractive().setAlpha(0.45));
        uzYazi.setText('uzaklık: 10⁻¹⁵ m · ŞİDDET ÖLÇÜMÜ');
        const us = { guclu: 0, em: -2, zayif: -6, kutle: -38 };
        SIRA.forEach((id, i) => {
          const c = cubuklar[i];
          c.durum.setText(`≈ ${K[id].siddet}`).setColor(K[id].renk);
          const y = satirY(i) - 10;
          const hedef = Math.max(0.012, (38 + us[id]) / 38);
          const d = { u: 0 };
          this.tweens.add({
            targets: d, u: hedef, duration: 1200, delay: i * 150,
            onUpdate: () => {
              c.g.clear().fillStyle(0x1a2330, 1).fillRoundedRect(SOL, y, SAG - SOL, 20, 6);
              c.g.fillStyle(renkSayi(K[id].renk), 0.95).fillRect(SOL, y, Math.max(3, (SAG - SOL) * d.u), 20);
            }
          });
        });
        this.yazi(SOL, 478, `göreli şiddet, logaritmik ölçek · ${s.not}`, { fontSize: '12px', color: '#8A96A6' });
        this.diyalog.soyle('ARGE', sec.dogru ? s.dogru : s.yanlis);
        this.devam('Kuralını yaz  ▸', () => this.genelleme());
      }, { genislik: 500, yukseklik: 48 })
    );
  }

  // ---------------- GENELLEME ----------------
  genelleme() {
    const k = veri.genelleme;
    this.adimBaslat({ no: 2, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'genelleme' });
    this.yonerge(k.yonerge);
    const satirlar = SIRA.map((id) => `${K[id].kisa}: menzil ${K[id].menzil}, şiddet ${K[id].siddet}`);
    this.ozet = satirlar.join(' · ');
    this.yazi(120, 146, `${satirlar[0]}   ·   ${satirlar[1]}\n${satirlar[2]}   ·   ${satirlar[3]}`, { fontSize: '14px', color: '#D8F6FF', lineSpacing: 2 });
    this.kurucu = this.ekle(
      cumleKurucu(this, { x: 120, y: 194, genislik: 800, parcalar: karistir([...k.parcalar, ...k.celdiriciler]), kontrol: (c) => this.genellemeKontrol(c) })
    );
  }

  genellemeKontrol(c) {
    const k = veri.genelleme;
    if (c.tur === 'parca') {
      if (k.kabul.some((d) => d.length === c.parcalar.length && d.every((p, i) => p === c.parcalar[i]))) return this.kuralKabul(c.metin, 'otomatik');
      const kutle = c.parcalar.includes('En güçlüsü kütle çekimidir.');
      const surtunme = c.parcalar.includes('Sürtünme de temel bir kuvvettir.');
      this.cevap({ dogru: false, yanilgi: kutle ? 'M_KUTLE_CEKIMI_EN_GUCLU' : surtunme ? 'M_SURTUNME_TEMEL' : null, ayrinti: `kural: ${c.metin}` });
      this.diyalog.soyle('ARGE', kutle ? k.kutleGuclu : surtunme ? k.surtunme : k.eksik);
      return;
    }
    const m = c.metin.toLocaleLowerCase('tr');
    if (k.serbestAnahtarlar.every((grup) => grup.some((a) => m.includes(a)))) return this.kuralKabul(c.metin, 'beklemede');
    this.cevap({ dogru: false, ayrinti: `serbest kural: ${c.metin}` });
    this.diyalog.soyle('Elif', k.serbestEksik);
  }

  kuralKabul(metin, onay) {
    this.cevap({ dogru: true, ayrinti: `kural (${onay}): ${metin}` });
    this.defterYaz({ tur: 'tablo', metin: `Dört kuvvet: ${this.ozet}` });
    this.defterYaz({ tur: 'kural', metin, onay });
    if (this.kurucu) this.kurucu.destroy();
    this.yazi(120, 270, `“${metin}”`, { fontSize: '22px', color: '#FFFFFF', fontStyle: 'italic', wordWrap: { width: 800 } });
    this.yazi(120, 400, onay === 'beklemede' ? 'Deftere yazıldı · öğretmen onayı bekliyor' : 'Deftere yazıldı', { fontSize: '15px', color: '#8A96A6' });
    this.diyalog.soyle('ARGE', veri.genelleme.kabulMesaji);
    this.devam('Göreve geç  ▸', () => this.gorev());
  }

  // ---------------- GOREV: kuvvet panosu ----------------
  gorev() {
    const k = veri.gorev;
    this.adimBaslat({ no: 3, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'gorev.pano' });
    this.yonerge(k.yonerge);
    const PX = 250;
    const PY = 190;
    const SW = 210;
    const SH = 76;
    const g = this.ekle(this.add.graphics());
    k.sutunlar.forEach((s, c) => this.yazi(PX + c * SW + SW / 2, PY - 8, s, { fontFamily: MONO, fontSize: '12px', color: '#5FE3E8', align: 'center' }).setOrigin(0.5, 1));
    k.satirlar.forEach((s, r) => this.yazi(PX - 12, PY + r * SH + SH / 2, s, { fontFamily: MONO, fontSize: '12px', color: '#8A96A6' }).setOrigin(1, 0.5));
    this.hucreler = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 2; c++) {
        const x = PX + c * SW;
        const y = PY + r * SH;
        g.fillStyle(0x05070d, 0.85).fillRect(x + 3, y + 3, SW - 6, SH - 6);
        g.lineStyle(1.5, 0x3a4656, 1).strokeRect(x + 3, y + 3, SW - 6, SH - 6);
        const h = { r, c, x: x + SW / 2, y: y + SH / 2, kuvvet: null, yazi: null };
        const alan = this.ekle(this.add.zone(h.x, h.y, SW - 6, SH - 6).setInteractive({ useHandCursor: true }));
        alan.on('pointerup', () => this.hucreSec(h));
        this.hucreler.push(h);
      }
    }
    this.kivilcim = this.ekle(kivilcimYayici(this, 0, 0));
    this.secKuvvet = null;
    this.panoCipleri = karistir(SIRA).map((id, j) => {
      const c = cip(this, 780, 210 + j * 72, K[id].kisa, () => {
        this.secKuvvet = id;
        this.panoCipleri.forEach((d) => d.durum !== 'pasif' && d.durumAyarla(d === c ? 'secili' : 'normal'));
      }, { genislik: 200, boyut: 16 });
      c.id = id;
      return this.ekle(c);
    });
    this.panoDugme = this.ekle(dugme(this, 780, 520, 'PANOYU KUR', () => this.panoKontrol(), { genislik: 200, yukseklik: 56, birincil: true, boyut: 18 }));
  }

  hucreSec(h) {
    // Dolu hucreye dokunmak kuvveti geri alir
    if (h.kuvvet) {
      const id = h.kuvvet;
      h.kuvvet = null;
      h.yazi.destroy();
      h.yazi = null;
      this.panoCipleri.find((c) => c.id === id).durumAyarla('normal');
      return;
    }
    if (!this.secKuvvet) return this.diyalog.soyle('Elif', 'Önce sağdaki bir kuvvete dokun.');
    const id = this.secKuvvet;
    this.secKuvvet = null;
    h.kuvvet = id;
    h.yazi = this.ekle(this.add.text(h.x, h.y, K[id].kisa, { fontFamily: YAZI, fontSize: '16px', fontStyle: 'bold', color: K[id].renk }).setOrigin(0.5));
    this.panoCipleri.find((c) => c.id === id).durumAyarla('pasif');
  }

  panoKontrol() {
    const k = veri.gorev;
    const dolu = this.hucreler.filter((h) => h.kuvvet);
    if (dolu.length < 4) return this.diyalog.soyle('ARGE', doldur(k.eksik, { sayi: 4 - dolu.length }));
    const yanlis = dolu.filter((h) => h.r !== K[h.kuvvet].sira - 1 || h.c !== (kisaMenzil(h.kuvvet) ? 0 : 1));
    const kutleGuclu = dolu.some((h) => h.kuvvet === 'kutle' && h.r === 0);
    this.cevap({
      dogru: yanlis.length === 0,
      yanilgi: kutleGuclu ? 'M_KUTLE_CEKIMI_EN_GUCLU' : null,
      ayrinti: `pano: ${dolu.map((h) => `${h.kuvvet}→${h.r + 1}/${h.c ? 'sonsuz' : 'kisa'}`).join(', ')}`
    });
    if (yanlis.length) {
      this.gorevHata += 1;
      for (const h of yanlis) this.kivilcim.explode(10, h.x, h.y);
      this.cameras.main.shake(250, 0.004);
      this.diyalog.soyle('ARGE', kutleGuclu ? k.kutleGuclu : doldur(k.hatali, { liste: yanlis.map((h) => K[h.kuvvet].kisa).join(', ') }));
      return;
    }
    this.panoDugme.destroy();
    this.panoCipleri.forEach((c) => c.setVisible(false));
    this.hucreler.forEach((h) => h.kuvvet && this.ekle(this.add.rectangle(h.x, h.y, 200, 66).setStrokeStyle(2, renkSayi(K[h.kuvvet].renk), 0.9)));
    this.diyalog.soyle('ARGE', k.panoTamam);
    this.time.delayedCall(1500, () => this.karsilastirma());
  }

  karsilastirma() {
    const k = veri.gorev;
    this.ipucu.adimAyarla('gorev.karsilastirma', [k.ipuclari[0], k.ipuclari[1]]);
    this.yonerge(k.karsilastirmaYonerge);
    const S = { a: 0, b: 1, siddet: 0, menzil: 0 };
    const SIDDET = ['daha güçlüdür', 'daha zayıftır'];
    const MENZIL = ['menzili daha kısadır', 'menzili daha uzundur', 'menzilleri aynıdır (ikisi de sonsuz)'];
    const y = 540;
    const yazi = this.yazi(250, y + 52, '', { fontSize: '19px', color: '#FFFFFF', fontStyle: 'italic', wordWrap: { width: 620 } });
    const yenile = () => {
      a.yaziAyarla(K[SIRA[S.a]].kisa);
      b.yaziAyarla(K[SIRA[S.b]].ablatif);
      sd.yaziAyarla(SIDDET[S.siddet]);
      mz.yaziAyarla(MENZIL[S.menzil]);
      yazi.setText(`“${K[SIRA[S.a]].ad}, ${K[SIRA[S.b]].ablatif} ${SIDDET[S.siddet]}; ${MENZIL[S.menzil]}.”`);
    };
    const a = this.ekle(cip(this, 340, y, '', () => ((S.a = (S.a + 1) % 4), yenile()), { genislik: 180, boyut: 15 }));
    const b = this.ekle(cip(this, 540, y, '', () => ((S.b = (S.b + 1) % 4), yenile()), { genislik: 210, boyut: 14 }));
    const sd = this.ekle(cip(this, 740, y, '', () => ((S.siddet = (S.siddet + 1) % 2), yenile()), { genislik: 180, boyut: 15 }));
    const mz = this.ekle(cip(this, 460, y + 120, '', () => ((S.menzil = (S.menzil + 1) % 3), yenile()), { genislik: 340, boyut: 14 }));
    yenile();
    this.ekle(dugme(this, 800, y + 120, 'Deftere yaz  ▸', () => kontrol(), { genislik: 200, yukseklik: 56, birincil: true, boyut: 17 }));

    const kontrol = () => {
      const A = SIRA[S.a];
      const B = SIRA[S.b];
      if (A === B) return this.diyalog.soyle('ARGE', k.ayni);
      const siddetDogru = (K[A].sira < K[B].sira) === (S.siddet === 0);
      const ua = K[A].menzilUs;
      const ub = K[B].menzilUs;
      const menzilDogru = ua === ub ? S.menzil === 2 : ua < ub ? S.menzil === 0 : S.menzil === 1;
      const metin = yazi.text.replace(/[“”]/g, '');
      const dogru = siddetDogru && menzilDogru;
      const kutleGuclu = !siddetDogru && A === 'kutle' && S.siddet === 0;
      this.cevap({ dogru, yanilgi: kutleGuclu ? 'M_KUTLE_CEKIMI_EN_GUCLU' : null, ayrinti: `karsilastirma: ${metin}` });
      if (!dogru) {
        this.gorevHata += 1;
        this.diyalog.soyle(
          'ARGE',
          !siddetDogru
            ? doldur(k.siddetYanlis, { A: K[A].kisa, B: K[B].kisa, sa: K[A].sira, sb: K[B].sira })
            : doldur(k.menzilYanlis, { A: K[A].kisa, B: K[B].kisa, ma: K[A].menzil, mb: K[B].menzil })
        );
        return;
      }
      this.defterYaz({ tur: 'karsilastirma', metin });
      this.diyalog.soyle('ARGE', k.basari);
      const yildiz = this.gorevHata === 0 ? 3 : this.gorevHata <= 2 ? 2 : 1;
      this.yazi(780, 380, '★'.repeat(yildiz) + '☆'.repeat(3 - yildiz), { fontSize: '40px', color: '#FFD79A' }).setOrigin(0.5);
      this.time.delayedCall(3800, () => this.bitir(yildiz));
    };
  }
}
