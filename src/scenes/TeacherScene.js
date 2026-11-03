import Phaser from 'phaser';
import { yildizDokusu } from '../art/Starfield.js';
import { dugme } from '../ui/Dugme.js';
import { cip } from '../ui/Cip.js';
import { modalAc } from '../ui/Panel.js';
import { defterAc } from '../ui/Defter.js';
import { YAZI, MONO, aralikli } from '../ui/tipografi.js';
import { tumu, oyuncuKaydet } from '../systems/SaveSystem.js';
import { muzikDurdur } from '../systems/Ses.js';
import { csvIndir, csvMetni, dosyaIndir, bugun, olaylariEkle } from '../systems/Telemetry.js';
import { BOLUMLER, isiHaritasi, yanilgiSiralamasi, ogrenciOzeti, csvAyristir, siniflar, sinifKodu, takmaAd, defterSatirlari, DEFTER_ALANLARI } from '../systems/Rapor.js';

// Ogretmen panosu (CLAUDE.md §9): sinif x ogrenme ciktisi isi haritasi, en yaygin 3 yanilgi,
// defter onayi, CSV disa/ice aktarim. Veriler yalnizca bu cihazdadir; baska cihazlarin CSV'si yuklenebilir.

const PIN_ANAHTARI = 'kayipOlcu.ogretmenPin';
// Istemci tarafinda gercek guvenlik yoktur; PIN ogrencilerin panoya kazara girmesini onler
const pinOzeti = (pin) => {
  let h = 0x811c9dc5;
  for (const c of `kayipOlcu:${pin}`) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
  return h.toString(16);
};
const pinOku = () => {
  try {
    return localStorage.getItem(PIN_ANAHTARI);
  } catch (e) {
    return null;
  }
};

const SEKMELER = [
  { id: 'harita', ad: 'Isı haritası' },
  { id: 'yanilgi', ad: 'Yanılgılar' },
  { id: 'defter', ad: 'Defter onayı' },
  { id: 'veri', ad: 'Veri' }
];

const METRIKLER = [
  { id: 'dogruluk', ad: 'Doğru cevap', aciklama: 'Doğru cevap oranı. Keşif tahminleri de dahildir; keşifte yanılmak beklenen bir şeydir.' },
  { id: 'tamamlama', ad: 'Bitiren', aciklama: 'Bölümü bitiren öğrenci oranı.' },
  { id: 'ipucu', ad: 'İpucu', aciklama: 'Öğrenci başına istenen ipucu sayısı. İpucu puanı düşürmez; gereken desteği gösterir.' }
];

const TUR_ADI = { kural: 'kural', tanim: 'tanım', karsilastirma: 'karşılaştırma' };
const SATIR_SAYISI = 7;
const KART_SAYISI = 4;

// Kirmizi -> amber -> camgobegi (istasyon sagligi cubuguyla ayni olcek; vektor renkleri kullanilmaz)
function olcekRengi(t) {
  const ara = (a, b, u) => {
    const k = (s) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
    const [x, y] = [k(a), k(b)];
    return x.reduce((r, v, i) => (r << 8) | Math.round(v + (y[i] - v) * u), 0);
  };
  const u = Phaser.Math.Clamp(t, 0, 1);
  return u < 0.5 ? ara(0xd64545, 0xe3b341, u * 2) : ara(0xe3b341, 0x5fe3e8, (u - 0.5) * 2);
}
const yuzde = (v) => `%${Math.round(v * 100)}`;
const tarih = (z) => (z ? new Date(z).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
const kisalt = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const dakika = (sn) => (sn === null || sn === undefined ? '' : `${Math.max(1, Math.round(sn / 60))} dk`);

export default class TeacherScene extends Phaser.Scene {
  constructor() {
    super('TeacherScene');
  }

  create() {
    this.nesneler = [];
    this.sekme = 'harita';
    this.metrik = 'dogruluk';
    this.sinif = null;
    this.sayfa = 0;
    this.defterFiltre = 'bekleyen';
    this.mesaj = '';
    this.sekmeKabi = null;
    this.mesajYazi = null;
    muzikDurdur();

    this.add.image(640, 360, yildizDokusu(this, { katman: 'uzak' }));
    this.add.rectangle(640, 360, 1280, 720, 0x05070d, 0.6);
    const g = this.add.graphics();
    g.fillStyle(0x05070d, 0.9).fillRect(0, 0, 1280, 64);
    g.lineStyle(1.5, 0x5fe3e8, 0.35).lineBetween(0, 64, 1280, 64);
    this.add.text(28, 32, aralikli('ÖĞRETMEN PANOSU'), { fontFamily: YAZI, fontSize: '20px', fontStyle: 'bold', color: '#5FE3E8' }).setOrigin(0, 0.5);
    dugme(this, 1210, 32, 'Menü', () => this.git('MenuScene'), { genislik: 104, yukseklik: 48, boyut: 17 });

    if (pinOku()) this.pinGoster('gir');
    else this.pinGoster('belirle');
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  ekle(n) {
    this.nesneler.push(n);
    return n;
  }

  temizle() {
    for (const n of this.nesneler) if (n && n.destroy) n.destroy();
    this.nesneler = [];
  }

  yazi(x, y, metin, stil = {}) {
    return this.ekle(this.add.text(x, y, metin, { fontFamily: YAZI, fontSize: '17px', color: '#D8F6FF', ...stil }));
  }

  // ---------------- PIN ----------------
  pinGoster(kip) {
    this.temizle();
    if (this.sekmeKabi) this.sekmeKabi.setVisible(false);
    const belirle = kip !== 'gir';
    const baslik = { gir: 'Panoya girmek için PIN', belirle: 'Bu cihaz için öğretmen PIN’i belirleyin', degistir: 'Yeni PIN' }[kip];
    this.yazi(640, 150, baslik, { fontSize: '24px' }).setOrigin(0.5);
    const html = `
<form class="giris" autocomplete="off">
  <label for="pin">${belirle ? 'YENİ PIN (4–8 rakam)' : 'PIN'}</label>
  <input id="pin" type="password" inputmode="numeric" maxlength="8">
  ${belirle ? '<label for="pin2">PIN’İ TEKRAR YAZIN</label><input id="pin2" type="password" inputmode="numeric" maxlength="8">' : ''}
  <div class="hata"></div>
  <button type="submit">${belirle ? 'PIN’İ KAYDET' : 'PANOYU AÇ'}</button>
  <div class="not">${belirle ? 'PIN yalnızca bu cihazda saklanır ve öğrencilerin panoya girmesini önler.' : 'Öğrenci verileri yalnızca bu cihazdadır.'}</div>
</form>`;
    const dom = this.ekle(this.add.dom(640, belirle ? 370 : 330).createFromHTML(html));
    const kok = dom.node;
    const hata = kok.querySelector('.hata');
    const pin = kok.querySelector('#pin');
    pin.focus();
    kok.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const deger = pin.value.trim();
      if (!belirle) {
        if (pinOzeti(deger) !== pinOku()) {
          pin.value = '';
          return (hata.textContent = 'PIN yanlış.');
        }
        return this.panoAc();
      }
      if (!/^\d{4,8}$/.test(deger)) return (hata.textContent = 'PIN 4–8 rakamdan oluşmalı.');
      if (deger !== kok.querySelector('#pin2').value.trim()) return (hata.textContent = 'İki PIN aynı değil.');
      try {
        localStorage.setItem(PIN_ANAHTARI, pinOzeti(deger));
      } catch (err) {
        return (hata.textContent = 'Bu tarayıcıda PIN kaydedilemiyor (gizli pencere olabilir).');
      }
      this.mesaj = kip === 'degistir' ? 'PIN değiştirildi.' : '';
      this.panoAc();
    });
    if (kip === 'degistir') this.ekle(dugme(this, 640, 640, 'Vazgeç', () => this.panoAc(), { genislik: 200, yukseklik: 52, boyut: 17 }));
  }

  // ---------------- PANO ----------------
  async panoAc() {
    await this.veriYukle();
    if (!this.sekmeKabi) this.sekmeleriKur();
    this.sekmeKabi.setVisible(true);
    this.ciz();
  }

  async veriYukle() {
    this.olaylar = await tumu('olaylar');
    this.oyuncular = await tumu('oyuncular');
    this.siniflar = siniflar(this.olaylar, this.oyuncular);
    if (this.sinif && !this.siniflar.includes(this.sinif)) this.sinif = null;
  }

  sekmeleriKur() {
    this.sekmeKabi = this.add.container(0, 0);
    this.sekmeCipleri = SEKMELER.map((s, i) => {
      const c = cip(this, 140 + i * 216, 104, s.ad, () => {
        this.sekme = s.id;
        this.sayfa = 0;
        this.mesaj = '';
        this.ciz();
      }, { genislik: 204, yukseklik: 52, boyut: 18 });
      c.sekme = s.id;
      return c;
    });
    this.sinifDugmesi = dugme(this, 1110, 104, '', () => this.sinifSec(), { genislik: 300, yukseklik: 52, boyut: 17 });
    this.sekmeKabi.add([...this.sekmeCipleri, this.sinifDugmesi]);
  }

  ciz() {
    this.temizle();
    for (const c of this.sekmeCipleri) c.durumAyarla(c.sekme === this.sekme ? 'secili' : 'normal');
    this.sinifDugmesi.setVisible(this.sekme !== 'veri');
    this.sinifDugmesi.yaziAyarla(`Sınıf: ${this.sinif || 'Tümü'}  ▾`);
    if (this.sekme === 'harita') this.haritaCiz();
    else if (this.sekme === 'yanilgi') this.yanilgiCiz();
    else if (this.sekme === 'defter') this.defterCiz();
    else this.veriCiz();
  }

  sinifSec() {
    const secenekler = [null, ...this.siniflar];
    const { kapan } = modalAc(this, 'SINIF SEÇ', (kap, alan) => {
      secenekler.forEach((s, i) => {
        const c = cip(this, alan.sol + 70 + (i % 6) * 136, alan.ust + 30 + Math.floor(i / 6) * 64, s || 'Tümü', () => {
          this.sinif = s;
          this.sayfa = 0;
          kapan();
          this.ciz();
        }, { genislik: 124, yukseklik: 52, boyut: 18 });
        if (s === this.sinif) c.durumAyarla('secili');
        kap.add(c);
      });
    }, { genislik: 880, yukseklik: Math.min(620, 200 + Math.ceil(secenekler.length / 6) * 64) });
  }

  sayfalama(toplam, boyut, y) {
    const sayfaSayisi = Math.max(1, Math.ceil(toplam / boyut));
    this.sayfa = Phaser.Math.Clamp(this.sayfa, 0, sayfaSayisi - 1);
    if (sayfaSayisi === 1) return;
    const git = (d) => () => {
      this.sayfa = Phaser.Math.Clamp(this.sayfa + d, 0, sayfaSayisi - 1);
      this.ciz();
    };
    this.ekle(dugme(this, 1000, y, '◂', git(-1), { genislik: 64, yukseklik: 48, boyut: 20 }));
    this.yazi(1080, y, `${this.sayfa + 1} / ${sayfaSayisi}`, { fontFamily: MONO, fontSize: '16px' }).setOrigin(0.5);
    this.ekle(dugme(this, 1160, y, '▸', git(1), { genislik: 64, yukseklik: 48, boyut: 20 }));
  }

  bosDurum(metin) {
    this.yazi(640, 380, metin, { fontSize: '20px', color: '#8A96A6', align: 'center', wordWrap: { width: 820 }, lineSpacing: 6 }).setOrigin(0.5);
  }

  // ---------------- ISI HARITASI ----------------
  haritaCiz() {
    const satirlar = isiHaritasi(this.olaylar, { sinif: this.sinif });
    const metrik = METRIKLER.find((m) => m.id === this.metrik);
    this.yazi(36, 158, this.sinif ? `${this.sinif} · öğrenci × öğrenme çıktısı` : 'Sınıf × öğrenme çıktısı', { fontSize: '19px', fontStyle: 'bold' });
    this.yazi(36, 184, this.sinif ? 'Ayrıntı için bir öğrenciye dokunun.' : 'Öğrencileri görmek için bir sınıfa dokunun.', { fontSize: '15px', color: '#8A96A6' });
    METRIKLER.forEach((m, i) => {
      const c = this.ekle(cip(this, 820 + i * 150, 176, m.ad, () => {
        this.metrik = m.id;
        this.ciz();
      }, { genislik: 140, yukseklik: 48, boyut: 16 }));
      if (m.id === this.metrik) c.durumAyarla('secili');
    });
    if (!satirlar.length) return this.bosDurum('Bu cihazda henüz kayıt yok.\nÖğrenciler oynadıkça ya da “Veri” sekmesinden başka cihazların CSV dosyaları yüklendikçe pano dolar.');

    const X0 = 270;
    const W = 136;
    const H = 50;
    const Y0 = 268;
    const g = this.ekle(this.add.graphics());
    BOLUMLER.forEach((b, i) => {
      const x = X0 + i * (W + 4) + W / 2;
      this.yazi(x, 244, b.ad, { fontSize: '14px', fontStyle: 'bold', align: 'center', wordWrap: { width: W - 8 } }).setOrigin(0.5, 1);
      this.yazi(x, 248, `B${b.bolum} · ${b.cikti}`, { fontFamily: MONO, fontSize: '12px', color: '#8A96A6' }).setOrigin(0.5, 0);
    });

    const gorunen = satirlar.slice(this.sayfa * SATIR_SAYISI, (this.sayfa + 1) * SATIR_SAYISI);
    gorunen.forEach((s, r) => {
      const y = Y0 + r * (H + 4);
      const etiket = this.sinif ? s.etiket : `${s.etiket}  ·  ${s.ogrenciSayisi} öğrenci`;
      this.ekle(dugme(this, 36 + 112, y + H / 2, etiket, () => (this.sinif ? this.ogrenciAyrinti(s.anahtar) : this.sinifAc(s.anahtar)), { genislik: 224, yukseklik: H, boyut: 16 }));
      s.hucreler.forEach((h, i) => {
        const x = X0 + i * (W + 4);
        const { deger, yazi, alt } = this.hucreDegeri(h, s);
        if (deger === null) {
          g.fillStyle(0x0b1426, 0.8).fillRoundedRect(x, y, W, H, 6);
          g.lineStyle(1, 0x3a4656, 0.8).strokeRoundedRect(x, y, W, H, 6);
        } else {
          g.fillStyle(olcekRengi(deger), 0.85).fillRoundedRect(x, y, W, H, 6);
        }
        const koyu = deger !== null;
        this.yazi(x + W / 2, y + (alt ? 15 : H / 2), yazi, { fontSize: '18px', fontStyle: 'bold', color: koyu ? '#05070D' : '#5d6878' }).setOrigin(0.5);
        if (alt) this.yazi(x + W / 2, y + 36, alt, { fontSize: '12px', color: koyu ? '#05070D' : '#5d6878' }).setOrigin(0.5);
      });
    });

    // Lejant: renk olcegi + metrigin anlami (renk korlugu icin degerler yazili)
    const ly = 652;
    for (let i = 0; i < 40; i++) g.fillStyle(olcekRengi(i / 39), 1).fillRect(36 + i * 4, ly, 4, 14);
    this.yazi(36, ly + 18, this.metrik === 'ipucu' ? 'çok ipucu      az ipucu' : 'düşük            yüksek', { fontSize: '12px', color: '#8A96A6' });
    this.yazi(210, ly - 4, metrik.aciklama, { fontSize: '14px', color: '#8A96A6', wordWrap: { width: 700 } });
    this.sayfalama(satirlar.length, SATIR_SAYISI, ly + 8);
  }

  hucreDegeri(h, satir) {
    if (h.bos) return { deger: null, yazi: '—' };
    if (this.metrik === 'dogruluk') {
      if (h.dogruluk === null) return { deger: null, yazi: '—', alt: 'cevap yok' };
      return { deger: h.dogruluk, yazi: yuzde(h.dogruluk), alt: `${h.cevap} cevap` };
    }
    if (this.metrik === 'tamamlama') {
      if (this.sinif) return { deger: h.tamamlama, yazi: h.bitiren ? '✓ bitti' : 'devam' };
      return { deger: h.tamamlama, yazi: yuzde(h.tamamlama), alt: `${h.bitiren} / ${satir.ogrenciSayisi}` };
    }
    // Ipucu: azi iyi; 4 ve uzeri ipucu olcegin kirmizi ucu
    return { deger: 1 - Math.min(h.ipucu / 4, 1), yazi: h.ipucu.toFixed(1).replace('.', ','), alt: 'öğrenci başına' };
  }

  sinifAc(sinif) {
    this.sinif = sinif;
    this.sayfa = 0;
    this.ciz();
  }

  ogrenciAyrinti(ogrenci) {
    const ozet = ogrenciOzeti(this.olaylar, ogrenci);
    const oyuncu = this.oyuncular.find((o) => o.id === ogrenci);
    const yanilgilar = yanilgiSiralamasi(this.olaylar, { ogrenci }).slice(0, 3);
    modalAc(this, `${takmaAd(ogrenci)} · ${sinifKodu(ogrenci)}`, (kap, alan) => {
      const satir = (y, sutunlar, stil = {}) =>
        sutunlar.forEach(([x, m]) => kap.add(this.add.text(alan.sol + x, y, m, { fontFamily: YAZI, fontSize: '16px', color: '#D8F6FF', ...stil })));
      satir(alan.ust, [[0, 'Bölüm'], [250, 'Durum'], [390, 'Cevap (doğru)'], [560, 'İpucu (en yüksek kademe)'], [800, 'Yıldız']], { color: '#5FE3E8', fontStyle: 'bold' });
      ozet.forEach((b, i) => {
        const k = oyuncu && oyuncu.bolumler[b.bolum];
        satir(alan.ust + 30 + i * 30, [
          [0, `B${b.bolum} · ${b.ad}`],
          [250, b.bitti ? `✓ ${dakika(b.sureSn)}` : b.basladi ? 'devam ediyor' : '—'],
          [390, b.cevap ? `${b.cevap} (${yuzde(b.dogru / b.cevap)})` : '—'],
          [560, b.ipucu ? `${b.ipucu} (${b.enYuksekIpucu}. kademe)` : '—'],
          [800, k && k.yildiz ? '★'.repeat(k.yildiz) : '—']
        ]);
      });
      const y2 = alan.ust + 260;
      kap.add(this.add.text(alan.sol, y2, 'En sık yanılgıları', { fontFamily: YAZI, fontSize: '16px', fontStyle: 'bold', color: '#5FE3E8' }));
      const yMetin = yanilgilar.length ? yanilgilar.map((y) => `• ${y.yanilgi}  (${y.adet} kez, B${y.bolum})`).join('\n') : 'Kayıtlı yanılgı yok.';
      kap.add(this.add.text(alan.sol, y2 + 26, yMetin, { fontFamily: YAZI, fontSize: '16px', color: '#D8F6FF', lineSpacing: 6, wordWrap: { width: alan.genislik } }));
      if (oyuncu) {
        const bekleyen = (oyuncu.defter || []).filter((d) => d.onay === 'beklemede').length;
        kap.add(this.add.text(alan.sol, alan.ust + alan.yukseklik - 24, `Defter: ${(oyuncu.defter || []).length} kayıt · ${bekleyen} onay bekliyor`, { fontFamily: YAZI, fontSize: '15px', color: '#8A96A6' }).setOrigin(0, 0.5));
        kap.add(dugme(this, alan.sol + alan.genislik - 110, alan.ust + alan.yukseklik - 24, 'Defterini aç', () => defterAc(this, oyuncu, { ogretmen: true }), { genislik: 220, yukseklik: 50, boyut: 17 }));
      } else {
        kap.add(this.add.text(alan.sol, alan.ust + alan.yukseklik - 24, 'Bu öğrenci başka bir cihazda oynamış; defteri bu cihazda yok.', { fontFamily: YAZI, fontSize: '15px', color: '#8A96A6' }).setOrigin(0, 0.5));
      }
    }, { genislik: 1000, yukseklik: 560 });
  }

  // ---------------- YANILGILAR ----------------
  yanilgiCiz() {
    const liste = yanilgiSiralamasi(this.olaylar, { sinif: this.sinif });
    this.yazi(36, 158, `En yaygın 3 yanılgı · ${this.sinif || 'tüm sınıflar'}`, { fontSize: '19px', fontStyle: 'bold' });
    this.yazi(36, 184, 'Kaç farklı öğrencide görüldüğüne göre sıralıdır. Her yanlış seçenek bir yanılgı koduna bağlıdır.', { fontSize: '15px', color: '#8A96A6' });
    if (!liste.length) return this.bosDurum('Henüz kayıtlı yanılgı yok.');

    const g = this.ekle(this.add.graphics());
    liste.slice(0, 3).forEach((y, i) => {
      const ky = 214 + i * 116;
      g.fillStyle(0x0b1426, 0.85).fillRoundedRect(36, ky, 1208, 104, 12);
      g.lineStyle(2, i === 0 ? 0xe3b341 : 0x5fe3e8, i === 0 ? 0.9 : 0.4).strokeRoundedRect(36, ky, 1208, 104, 12);
      this.yazi(76, ky + 52, String(i + 1), { fontSize: '44px', fontStyle: 'bold', color: i === 0 ? '#E3B341' : '#5FE3E8' }).setOrigin(0.5);
      this.yazi(118, ky + 14, y.yanilgi, { fontSize: '20px', fontStyle: 'bold', wordWrap: { width: 850 } });
      this.yazi(118, ky + 46, `Doğrusu: ${y.dogrusu}`, { fontSize: '16px', color: '#9FE9EC', wordWrap: { width: 850 } });
      this.yazi(118, ky + 78, y.kod, { fontFamily: MONO, fontSize: '12px', color: '#8A96A6' });
      this.yazi(1220, ky + 52, `${y.ogrenciSayisi} öğrenci\n${y.adet} kez\nBölüm ${y.bolum}`, { fontSize: '16px', align: 'right', lineSpacing: 2 }).setOrigin(1, 0.5);
    });

    const digerleri = liste.slice(3, 11);
    if (digerleri.length) {
      this.yazi(36, 568, 'Diğer yanılgılar', { fontSize: '15px', fontStyle: 'bold', color: '#5FE3E8' });
      digerleri.forEach((y, i) => {
        const x = 36 + (i % 2) * 610;
        const yy = 594 + Math.floor(i / 2) * 26;
        this.yazi(x, yy, `${i + 4}. ${kisalt(y.yanilgi, 58)} — ${y.ogrenciSayisi} öğr.`, { fontSize: '15px', color: '#D8F6FF' });
      });
    }
  }

  // ---------------- DEFTER ONAYI ----------------
  defterKayitlari() {
    const kayitlar = [];
    for (const o of this.oyuncular) {
      if (this.sinif && o.sinifKodu !== this.sinif) continue;
      for (const k of o.defter || []) {
        if (k.onay === 'otomatik' || !k.onay) continue;
        const bekliyor = k.onay === 'beklemede';
        if ((this.defterFiltre === 'bekleyen') === bekliyor) kayitlar.push({ oyuncu: o, kayit: k });
      }
    }
    return kayitlar.sort((a, b) => String(a.kayit.zaman).localeCompare(String(b.kayit.zaman)));
  }

  defterCiz() {
    const kayitlar = this.defterKayitlari();
    this.yazi(36, 158, this.defterFiltre === 'bekleyen' ? `Onay bekleyen serbest metinler · ${kayitlar.length}` : `Değerlendirilenler · ${kayitlar.length}`, { fontSize: '19px', fontStyle: 'bold' });
    this.yazi(36, 184, 'Öğrencinin kendi cümlesi anahtar sözcüklerle kabul edildi; bilimsel doğruluğunu siz onaylarsınız.', { fontSize: '15px', color: '#8A96A6' });
    [['bekleyen', 'Bekleyenler'], ['degerlendirilen', 'Değerlendirilenler']].forEach(([id, ad], i) => {
      const c = this.ekle(cip(this, 920 + i * 190, 176, ad, () => {
        this.defterFiltre = id;
        this.sayfa = 0;
        this.ciz();
      }, { genislik: 180, yukseklik: 48, boyut: 16 }));
      if (id === this.defterFiltre) c.durumAyarla('secili');
    });
    if (!kayitlar.length) {
      return this.bosDurum(this.defterFiltre === 'bekleyen' ? 'Onay bekleyen kayıt yok.\n(Yalnızca bu cihazda oynayan öğrencilerin defterleri görünür.)' : 'Henüz değerlendirilen kayıt yok.');
    }
    const g = this.ekle(this.add.graphics());
    this.sayfalama(kayitlar.length, KART_SAYISI, 672);
    kayitlar.slice(this.sayfa * KART_SAYISI, (this.sayfa + 1) * KART_SAYISI).forEach(({ oyuncu, kayit }, i) => {
      const ky = 212 + i * 108;
      g.fillStyle(0x0b1426, 0.85).fillRoundedRect(36, ky, 1208, 98, 12);
      g.lineStyle(1.5, 0x5fe3e8, 0.35).strokeRoundedRect(36, ky, 1208, 98, 12);
      const b = BOLUMLER.find((x) => x.bolum === kayit.bolum);
      this.yazi(56, ky + 10, `${oyuncu.takmaAd} · ${oyuncu.sinifKodu} · Bölüm ${kayit.bolum}${b ? ` ${b.ad}` : ''} · ${TUR_ADI[kayit.tur] || kayit.tur} · ${tarih(kayit.zaman)}`, { fontSize: '14px', color: '#8A96A6' });
      this.yazi(56, ky + 32, `“${kayit.metin}”`, { fontSize: '19px', color: '#FFFFFF', wordWrap: { width: 820 } });
      const kaydet = async (onay, not = '') => {
        kayit.onay = onay;
        if (not) kayit.ogretmenNotu = not;
        else delete kayit.ogretmenNotu;
        await oyuncuKaydet(oyuncu);
        this.ciz();
      };
      if (this.defterFiltre === 'bekleyen') {
        this.ekle(dugme(this, 1000, ky + 49, '✓ Onayla', () => kaydet('onaylandi'), { genislik: 150, yukseklik: 52, birincil: true, boyut: 17 }));
        this.ekle(dugme(this, 1158, ky + 49, '↺ Düzeltsin', () => this.duzeltmeIste((not) => kaydet('duzeltilmeli', not)), { genislik: 150, yukseklik: 52, boyut: 17 }));
      } else {
        const durum = kayit.onay === 'onaylandi' ? '✓ onaylandı' : `↺ düzeltme istendi${kayit.ogretmenNotu ? `: ${kayit.ogretmenNotu}` : ''}`;
        this.yazi(56, ky + 74, kisalt(durum, 110), { fontSize: '14px', color: kayit.onay === 'onaylandi' ? '#5FE3E8' : '#E3B341' });
        this.ekle(dugme(this, 1140, ky + 49, 'Geri al', () => kaydet('beklemede'), { genislik: 150, yukseklik: 52, boyut: 17 }));
      }
    });
  }

  duzeltmeIste(gonder) {
    const { kap, kapan } = modalAc(this, 'ÖĞRENCİYE NOT', (k, alan) => {
      k.add(this.add.text(alan.sol, alan.ust, 'İsteğe bağlı kısa bir not yazın. Öğrenci notu Gözlem Defteri’nde görür.', { fontFamily: YAZI, fontSize: '16px', color: '#8A96A6', wordWrap: { width: alan.genislik } }));
    }, { genislik: 640, yukseklik: 360 });
    const html = '<form class="giris" style="width:560px"><textarea rows="3" maxlength="160" style="box-sizing:border-box;width:100%;font-size:19px;padding:10px;color:#EEF3F7;background:rgba(11,20,38,.95);border:2px solid #5FE3E8;border-radius:10px;font-family:inherit"></textarea><button type="submit">Düzeltme iste</button></form>';
    const dom = this.add.dom(640, 400).createFromHTML(html).setDepth(1001);
    kap.once('destroy', () => dom.destroy());
    const alan = dom.node.querySelector('textarea');
    alan.focus();
    dom.node.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      gonder(alan.value.trim());
      kapan();
    });
  }

  // ---------------- VERI ----------------
  veriCiz() {
    const defter = defterSatirlari(this.oyuncular);
    const bekleyen = defter.filter((d) => d.onay === 'beklemede').length;
    const ogrenciler = new Set([...this.olaylar.map((o) => o.ogrenci), ...this.oyuncular.map((o) => o.id)]);
    this.yazi(36, 158, 'Bu cihazdaki veriler', { fontSize: '19px', fontStyle: 'bold' });
    this.yazi(36, 186, `${ogrenciler.size} öğrenci · ${this.siniflar.length} sınıf · ${this.olaylar.length} olay · ${defter.length} defter kaydı (${bekleyen} onay bekliyor)`, { fontSize: '16px', color: '#8A96A6' });

    const satirlar = [
      ['⬇  Olay verilerini indir (CSV)', async () => this.bildir(`${await csvIndir()} olay indirildi.`), 'Her cevap, ipucu ve bölüm başlangıcı/bitişi bir satır. Excel’de doğrudan açılır (; ayırıcı).'],
      ['⬇  Defterleri indir (CSV)', () => {
        dosyaIndir(`kayip-olcu-defterler-${bugun()}.csv`, csvMetni(DEFTER_ALANLARI, defter));
        this.bildir(`${defter.length} defter kaydı indirildi.`);
      }, 'Öğrencilerin kurduğu kurallar ve tanımlar, onay durumu ve notlarınızla.'],
      ['⬆  Başka cihazdan olay CSV’si yükle', () => this.csvYukle(), 'Diğer bilgisayar ve tabletlerden indirilen olay dosyalarını birleştirir. Aynı dosyayı iki kez yüklemek veriyi çoğaltmaz.'],
      ['PIN’i değiştir', () => this.pinGoster('degistir'), 'Panonun PIN’i yalnızca bu cihazda geçerlidir.']
    ];
    satirlar.forEach(([etiket, fn, aciklama], i) => {
      const y = 260 + i * 92;
      this.ekle(dugme(this, 36 + 220, y, etiket, fn, { genislik: 440, yukseklik: 60, boyut: 18, birincil: i < 2 }));
      this.yazi(510, y, aciklama, { fontSize: '16px', color: '#D8F6FF', wordWrap: { width: 720 } }).setOrigin(0, 0.5);
    });
    this.mesajYazi = this.yazi(640, 650, this.mesaj, { fontSize: '17px', color: '#5FE3E8' }).setOrigin(0.5);
  }

  bildir(metin) {
    this.mesaj = metin;
    if (this.mesajYazi && this.mesajYazi.active) this.mesajYazi.setText(metin);
  }

  csvYukle() {
    const girdi = document.createElement('input');
    girdi.type = 'file';
    girdi.accept = '.csv,text/csv';
    girdi.addEventListener('change', () => {
      const dosya = girdi.files && girdi.files[0];
      if (!dosya) return;
      // FileReader: eski Chromium surumlerinde File.text() yok
      const okuyucu = new FileReader();
      okuyucu.onload = async () => {
        try {
          const { eklenen, tekrar } = await olaylariEkle(csvAyristir(String(okuyucu.result)));
          await this.veriYukle();
          this.mesaj = `${dosya.name}: ${eklenen} yeni olay eklendi${tekrar ? `, ${tekrar} olay zaten vardı` : ''}.`;
        } catch (e) {
          this.mesaj = e.message || 'Dosya okunamadı.';
        }
        this.ciz();
      };
      okuyucu.readAsText(dosya, 'utf-8');
    });
    girdi.click();
  }

  git(sahne) {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(sahne));
  }
}
