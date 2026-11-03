import Phaser from 'phaser';
import BolumTemel from './BolumTemel.js';
import veri from '../../data/bolum3.json';
import { okCiz, STILLER } from '../../systems/VectorDraw.js';
import { secenekler } from '../../ui/Secenekler.js';
import { cumleKurucu } from '../../ui/CumleKurucu.js';
import { cip } from '../../ui/Cip.js';
import { dugme } from '../../ui/Dugme.js';
import { YAZI, MONO } from '../../ui/tipografi.js';
import { gunesPaneliDokusu, dronDokusu } from '../../art/Panel.js';
import { dunyaDokusu } from '../../art/Earth.js';
import { karistir } from '../../art/Rastgele.js';

const doldur = (s, d) => s.replace(/\{(\w+)\}/g, (_, k) => (k in d ? d[k] : `{${k}}`));
const VEKTOR = '#F28C28';
const BILESKE = '#4A90E8';
const PX_N = 22; // ok uzunlugu: 1 N = 22 px
const HARFLER = ['A', 'B', 'C'];
export const yonMetni = (f) => (f > 0 ? `${f} N sağa` : f < 0 ? `${-f} N sola` : '0 N (hareket etmez)');

// Bolum 3 · Romorkor (FİZ.9.2.3): ayni dogrultudaki kuvvetlerin bileskesi.
// Panel durgunken bileske kuvvet onu bileske yonunde hizlandirir; bileske sifirsa durur (CLAUDE.md §7)
export default class Level3Romorkor extends BolumTemel {
  constructor() {
    super('Level3Romorkor', 3, 3);
  }

  arkaPlan() {
    this.add.image(470, 520, dunyaDokusu(this, { ufukY: 660, safak: 'sol' })).setAlpha(0.4);
  }

  basla(adim) {
    this.gorevHata = 0;
    this.tablo = [];
    if (adim === 'genelleme' || adim === 'gorev') {
      this.tablo = veri.kesif.deneyler.map((d) => ({ dronlar: d.dronlar, bileske: d.dronlar.reduce((a, b) => a + b, 0) }));
      if (adim === 'genelleme') this.genelleme();
      else this.gorev();
    } else {
      this.kesif();
      this.diyalog.oynat(veri.giris);
    }
  }

  // Panel + dronlar + kuvvet oklari tek kapsayicida: panel hareket edince hepsi birlikte gider.
  // kuvvetler: isaretli N degerleri (+ saga, - sola)
  panelKur(x, y, kuvvetler, harfler = HARFLER) {
    gunesPaneliDokusu(this);
    dronDokusu(this);
    const kap = this.ekle(this.add.container(x, y));
    const oklar = this.add.graphics();
    kap.add(this.add.image(10, 0, 'gunes_paneli').setScale(0.8));
    kap.add(oklar);
    const etiketler = [];
    const dronlar = [];
    const tarafSayac = { sol: 0, sag: 0 };
    kap.kuvvetler = [...kuvvetler];
    kap.ciz = () => {
      oklar.clear();
      dronlar.forEach((d) => d.destroy());
      etiketler.forEach((e) => e.destroy());
      dronlar.length = 0;
      etiketler.length = 0;
      tarafSayac.sol = tarafSayac.sag = 0;
      kap.kuvvetler.forEach((f, i) => {
        // Saga iten dron panelin solunda durur, gazi sola puskurur (ve tersi)
        const taraf = f >= 0 ? 'sol' : 'sag';
        const sira = tarafSayac[taraf]++;
        const dx = taraf === 'sol' ? -88 : 88;
        const dy = (sira - 0.5) * 30 + (kap.kuvvetler.filter((k) => (k >= 0 ? 'sol' : 'sag') === taraf).length === 1 ? 15 : 0);
        if (f !== 0) {
          const gaz = this.add.image(dx + (taraf === 'sol' ? -26 : 26), dy, 'p_nokta').setScale(0.6 + Math.abs(f) * 0.08).setBlendMode(Phaser.BlendModes.ADD).setTint(0xbfe6ff);
          dronlar.push(gaz);
        }
        dronlar.push(this.add.image(dx, dy, 'tamir_dronu').setScale(0.8));
        const oy = -62 - i * 24;
        if (f !== 0) okCiz(oklar, 0, oy, f * PX_N, oy, STILLER.vektor);
        etiketler.push(
          this.add.text(f * PX_N + (f >= 0 ? 8 : -8), oy, `${harfler[i]} = ${Math.abs(f)} N`, { fontFamily: YAZI, fontSize: '15px', fontStyle: 'bold', color: VEKTOR }).setOrigin(f >= 0 ? 0 : 1, 0.5)
        );
      });
      kap.add([...dronlar, ...etiketler]);
    };
    kap.bileskeGoster = (F) => {
      const oy = 70;
      if (F !== 0) okCiz(oklar, 0, oy, F * PX_N, oy, STILLER.bileske);
      const e = this.add
        .text(F === 0 ? 0 : F * PX_N + (F > 0 ? 8 : -8), oy + (F === 0 ? 0 : 0), `Bileşke = ${yonMetni(F)}`, { fontFamily: YAZI, fontSize: '16px', fontStyle: 'bold', color: BILESKE })
        .setOrigin(F === 0 ? 0.5 : F > 0 ? 0 : 1, 0.5);
      kap.add(e);
      etiketler.push(e);
    };
    kap.ciz();
    return kap;
  }

  // Deney/senaryo degisiminde, o alt-adimda eklenen her sey (sonradan gelen dugmeler dahil) silinir
  altAdimBaslat() {
    if (this.altAdimDizini !== undefined && this.altAdimDizini <= this.adimNesneleri.length) {
      for (const n of this.adimNesneleri.splice(this.altAdimDizini)) if (n && n.destroy) n.destroy();
    }
    this.altAdimDizini = this.adimNesneleri.length;
  }

  cetvel(x1, x2, y) {
    const g = this.ekle(this.add.graphics());
    g.lineStyle(1.5, 0x8a96a6, 0.5).lineBetween(x1, y, x2, y);
    for (let x = x1; x <= x2; x += 40) g.lineBetween(x, y - 5, x, y + 5);
    return g;
  }

  adimBaslat(secenek) {
    super.adimBaslat(secenek);
    this.altAdimDizini = undefined;
  }

  // ---------------- KESIF: dron deneyleri ----------------
  kesif() {
    const k = veri.kesif;
    this.adimBaslat({ no: 0, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'kesif' });
    this.yonerge(k.yonerge);
    this.tablo = [];
    this.deney(0);
  }

  deney(i) {
    const k = veri.kesif;
    const d = k.deneyler[i];
    this.altAdimBaslat();
    this.yazi(40, 156, `DENEY ${i + 1}/${k.deneyler.length}`, { fontFamily: MONO, fontSize: '13px', color: '#5FE3E8' });
    this.cetvel(80, 600, 420);
    const panel = this.panelKur(330, 330, d.dronlar);
    this.tabloCiz(650, 150);
    const F = d.dronlar.reduce((a, b) => a + b, 0);
    this.ekle(secenekler(this, 160, 470, i === 0 ? k.soruIlk : k.soru, d.secenekler, (s) => {
      this.cevap({ dogru: s.dogru, yanilgi: s.yanilgi, ayrinti: `deney ${i + 1} (${d.dronlar.join(', ')}): ${s.metin}` });
      // Durgun panel bileske yonunde sabit ivmeyle hizlanir: x = 1/2 a t^2
      this.tweens.addCounter({
        from: 0, to: 1, duration: 2200,
        onUpdate: (tw) => panel.setX(330 + 0.5 * 12 * F * (2.2 * tw.getValue()) ** 2),
        onComplete: () => {
          panel.bileskeGoster(F);
          this.diyalog.soyle('ARGE', d.sonuc);
          this.tablo[i] = { dronlar: d.dronlar, bileske: F };
          this.tabloCiz(650, 150);
          if (i + 1 < k.deneyler.length) this.devam('Sonraki deney  ▸', () => this.deney(i + 1));
          else {
            this.diyalog.sonra(2800, 'ARGE', k.kapanis);
            this.devam('Kuralını yaz  ▸', () => this.genelleme());
          }
        }
      });
    }, { genislik: 460, yukseklik: 52 }));
  }

  tabloCiz(x, y) {
    if (this.tabloNesneleri) this.tabloNesneleri.forEach((n) => n.destroy());
    const g = this.add.graphics();
    g.fillStyle(0x05070d, 0.8).fillRoundedRect(x, y, 270, 46 + Math.max(1, this.tablo.length) * 28, 8);
    g.lineStyle(1, 0x5fe3e8, 0.4).strokeRoundedRect(x, y, 270, 46 + Math.max(1, this.tablo.length) * 28, 8);
    const n = [g, this.add.text(x + 10, y + 6, 'VERİ TABLOSU', { fontFamily: MONO, fontSize: '12px', color: '#5FE3E8' })];
    n.push(this.add.text(x + 10, y + 24, 'Dronlar', { fontFamily: YAZI, fontSize: '13px', fontStyle: 'bold', color: VEKTOR }));
    n.push(this.add.text(x + 170, y + 24, 'Sonuç', { fontFamily: YAZI, fontSize: '13px', fontStyle: 'bold', color: BILESKE }));
    this.tablo.forEach((s, j) => {
      if (!s) return;
      const ok = (f) => (f > 0 ? `${f}→` : `←${-f}`);
      n.push(this.add.text(x + 10, y + 46 + j * 28, s.dronlar.map(ok).join('  '), { fontFamily: YAZI, fontSize: '16px', color: VEKTOR }));
      n.push(this.add.text(x + 170, y + 46 + j * 28, s.bileske === 0 ? '0' : ok(s.bileske), { fontFamily: YAZI, fontSize: '16px', fontStyle: 'bold', color: BILESKE }));
    });
    this.tabloNesneleri = n;
    this.ekle(...n);
  }

  // ---------------- GENELLEME ----------------
  genelleme() {
    const k = veri.genelleme;
    this.adimBaslat({ no: 1, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'genelleme' });
    this.yonerge(k.yonerge);
    this.ozet = this.tablo.map((s, j) => `${j + 1}) ${s.dronlar.map((f) => yonMetni(f)).join(' + ')} → ${yonMetni(s.bileske)}`).join('; ');
    this.tabloCiz(120, 140);
    this.kurucu = this.ekle(
      cumleKurucu(this, { x: 420, y: 140, genislik: 500, parcalar: karistir([...k.parcalar, ...k.celdiriciler]), kontrol: (c) => this.genellemeKontrol(c) })
    );
  }

  genellemeKontrol(c) {
    const k = veri.genelleme;
    if (c.tur === 'parca') {
      if (k.kabul.some((d) => d.length === c.parcalar.length && d.every((p, i) => p === c.parcalar[i]))) return this.kuralKabul(c.metin, 'otomatik');
      const sifir = c.parcalar.includes('her zaman sıfırdır.');
      const kucuk = c.parcalar.includes('küçük olanın yönündedir.');
      this.cevap({ dogru: false, yanilgi: sifir ? 'M_ZIT_HEP_SIFIR' : null, ayrinti: `kural: ${c.metin}` });
      this.diyalog.soyle('ARGE', sifir ? k.zitSifir : kucuk ? k.kucukYon : k.eksik);
      return;
    }
    const m = c.metin.toLocaleLowerCase('tr');
    if (k.serbestAnahtarlar.every((grup) => grup.some((a) => m.includes(a)))) return this.kuralKabul(c.metin, 'beklemede');
    this.cevap({ dogru: false, ayrinti: `serbest kural: ${c.metin}` });
    this.diyalog.soyle('Elif', k.serbestEksik);
  }

  kuralKabul(metin, onay) {
    this.cevap({ dogru: true, ayrinti: `kural (${onay}): ${metin}` });
    this.defterYaz({ tur: 'tablo', metin: `Dron deneyleri: ${this.ozet}` });
    this.defterYaz({ tur: 'kural', metin, onay });
    if (this.kurucu) this.kurucu.destroy();
    this.yazi(420, 160, `“${metin}”`, { fontSize: '22px', color: '#FFFFFF', fontStyle: 'italic', wordWrap: { width: 500 } });
    this.yazi(420, 300, onay === 'beklemede' ? 'Deftere yazıldı · öğretmen onayı bekliyor' : 'Deftere yazıldı', { fontSize: '15px', color: '#8A96A6' });
    this.diyalog.soyle('ARGE', veri.genelleme.kabulMesaji);
    this.devam('Göreve geç  ▸', () => this.gorev());
  }

  // ---------------- GOREV: paneli yuvasina tasi ----------------
  gorev() {
    const k = veri.gorev;
    this.adimBaslat({ no: 2, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'gorev' });
    this.yonerge(k.yonerge);
    this.senaryo(0);
  }

  senaryo(i) {
    const k = veri.gorev;
    const s = k.senaryolar[i];
    this.altAdimBaslat();
    const X0 = 230;
    const Y = 345;
    const T = 2.5;
    const IVME = 19.2; // 1 N -> 19,2 px/s^2; 5 N ile 2,5 s'de 300 px
    const yuvaX = X0 + (s.gerekli === 0 ? 0 : 0.5 * IVME * s.gerekli * T * T);
    const ayarHarf = HARFLER[s.sabit.length];
    this.yazi(40, 164, `SENARYO ${s.ad}`, { fontFamily: MONO, fontSize: '13px', color: '#5FE3E8' });
    this.yazi(40, 182, s.aciklama, { fontSize: '16px', color: '#D8F6FF', wordWrap: { width: 880 } });

    // Yuva kiskaclari ve istasyon govdesi (yuvanin hemen arkasinda)
    const g = this.ekle(this.add.graphics());
    // Panelin sag kenari (merkez + 78 px) yuvadayken govdenin 40 px onunde kalir
    const govdeX = yuvaX + 118;
    g.fillStyle(0x1a2330, 1).fillRect(govdeX, Y - 120, 40, 240);
    g.lineStyle(2, 0x8a96a6, 0.6).strokeRect(govdeX, Y - 120, 40, 240);
    g.lineStyle(3, 0xd8f6ff, 0.8);
    for (const sy of [-1, 1]) g.lineBetween(yuvaX - 30, Y + sy * 52, yuvaX + 50, Y + sy * 52);
    g.lineStyle(2, 0xd8f6ff, 0.5).lineBetween(yuvaX + 10, Y - 60, yuvaX + 10, Y + 60);
    this.yazi(yuvaX + 10, Y + 70, 'YUVA', { fontFamily: MONO, fontSize: '12px', color: '#D8F6FF' }).setOrigin(0.5, 0);
    this.cetvel(80, 900, Y + 104);

    const ayar = { yon: 1, deger: 1 };
    const tahmin = { yon: null, deger: 0 };
    const kuvvetler = () => [...s.sabit, ayar.yon * ayar.deger];
    const panel = this.panelKur(X0, Y, kuvvetler());

    // Dron ayari
    const ax = 150;
    this.yazi(ax + 30, 452, `DRON ${ayarHarf}`, { fontFamily: MONO, fontSize: '13px', color: VEKTOR }).setOrigin(0.5, 0);
    const ayarYazi = this.yazi(ax + 95, 578, '', { fontSize: '22px', fontStyle: 'bold', color: VEKTOR }).setOrigin(0.5);
    const yonCipleri = [[-1, '◀ SOLA', ax + 30], [1, 'SAĞA ▶', ax + 160]].map(([y, m, x]) =>
      this.ekle(cip(this, x, 512, m, () => ((ayar.yon = y), yenileAyar()), { genislik: 120, boyut: 17 }))
    );
    this.ekle(cip(this, ax + 30, 578, '−', () => ((ayar.deger = Math.max(0, ayar.deger - 1)), yenileAyar()), { genislik: 56, boyut: 24 }));
    this.ekle(cip(this, ax + 160, 578, '+', () => ((ayar.deger = Math.min(8, ayar.deger + 1)), yenileAyar()), { genislik: 56, boyut: 24 }));
    const yenileAyar = () => {
      yonCipleri.forEach((c, j) => c.durumAyarla((j === 0 ? -1 : 1) === ayar.yon ? 'secili' : 'normal'));
      ayarYazi.setText(`${ayar.deger} N`);
      panel.kuvvetler = kuvvetler();
      panel.ciz();
    };
    yenileAyar();

    // Bileske tahmini
    const tx = 500;
    this.yazi(tx + 110, 452, 'BİLEŞKE TAHMİNİN', { fontFamily: MONO, fontSize: '13px', color: BILESKE }).setOrigin(0.5, 0);
    const tYazi = this.yazi(tx + 110, 578, '', { fontSize: '22px', fontStyle: 'bold', color: BILESKE }).setOrigin(0.5);
    const tYon = [[-1, '◀', tx + 20], [0, '0', tx + 110], [1, '▶', tx + 200]].map(([y, m, x]) =>
      this.ekle(cip(this, x, 512, m, () => ((tahmin.yon = y), y === 0 && (tahmin.deger = 0), yenileTahmin()), { genislik: 80, boyut: 22 }))
    );
    this.ekle(cip(this, tx + 20, 578, '−', () => ((tahmin.deger = Math.max(0, tahmin.deger - 1)), yenileTahmin()), { genislik: 56, boyut: 24 }));
    this.ekle(cip(this, tx + 200, 578, '+', () => ((tahmin.deger = Math.min(12, tahmin.deger + 1)), tahmin.yon === 0 && (tahmin.yon = null), yenileTahmin()), { genislik: 56, boyut: 24 }));
    const yenileTahmin = () => {
      tYon.forEach((c, j) => c.durumAyarla([-1, 0, 1][j] === tahmin.yon ? 'secili' : 'normal'));
      const tf = tahmin.yon * tahmin.deger;
      tYazi.setText(tahmin.yon === null ? `${tahmin.deger} N ?` : tf === 0 ? '0 N' : yonMetni(tf));
    };
    yenileTahmin();

    const test = this.ekle(dugme(this, 830, 545, 'TEST ET  ▸', () => calistir(), { genislik: 160, yukseklik: 64, birincil: true, boyut: 18 }));
    let calisiyor = false;

    const calistir = () => {
      if (calisiyor) return;
      if (tahmin.yon === null || (tahmin.yon !== 0 && tahmin.deger === 0)) return this.diyalog.soyle('Elif', 'Önce bileşkeyi tahmin et: yön ve büyüklük.');
      calisiyor = true;
      test.setVisible(false);
      const F = kuvvetler().reduce((a, b) => a + b, 0);
      const tahminF = tahmin.yon * tahmin.deger;
      const tahminDogru = tahminF === F;
      const gorevDogru = F === s.gerekli;
      const zitVar = kuvvetler().some((f) => f > 0) && kuvvetler().some((f) => f < 0);
      const buyuklukToplami = kuvvetler().reduce((a, b) => a + Math.abs(b), 0);
      let yanilgi = null;
      if (!tahminDogru) {
        if (zitVar && Math.abs(tahminF) === buyuklukToplami) yanilgi = 'M_BILESKE_TOPLAM';
        else if (zitVar && tahminF === 0 && F !== 0) yanilgi = 'M_ZIT_HEP_SIFIR';
        else if (Math.abs(tahminF) === Math.abs(F) && Math.sign(tahminF) === -Math.sign(F)) yanilgi = 'M_YON_ONEMSIZ';
      }
      this.cevap({
        dogru: tahminDogru && gorevDogru,
        yanilgi,
        ayrinti: `senaryo ${s.ad}: dronlar ${kuvvetler().join(', ')} → ${F} N, tahmin ${tahminF} N, gereken ${s.gerekli} N`
      });
      // Panel durgun; bileske kuvvetle sabit ivme. Govdeye carpinca durur
      const govdeyeKadar = govdeX - 78 - X0;
      let carpti = false;
      this.tweens.addCounter({
        from: 0, to: 1, duration: T * 1000,
        onUpdate: (tw) => {
          if (carpti) return;
          let dx = 0.5 * IVME * F * (T * tw.getValue()) ** 2;
          if (dx > govdeyeKadar) {
            dx = govdeyeKadar;
            carpti = true;
            this.cameras.main.shake(250, 0.006);
          }
          panel.setX(X0 + dx);
        },
        onComplete: () => {
          panel.bileskeGoster(F);
          const sonuc = yonMetni(F);
          let mesaj;
          if (!tahminDogru) mesaj = doldur(k.tahminUyumsuz, { tahmin: yonMetni(tahminF), sonuc });
          else if (gorevDogru) mesaj = doldur(k.basari, { sonuc });
          else if (s.gerekli === 0) mesaj = doldur(k.kaydi, { sonuc });
          else if (Math.sign(F) !== Math.sign(s.gerekli)) mesaj = doldur(k.ters, { sonuc });
          else mesaj = doldur(Math.abs(F) > Math.abs(s.gerekli) ? k.fazla : k.az, { sonuc });
          this.diyalog.soyle('ARGE', mesaj);
          if (tahminDogru && gorevDogru) {
            g.fillStyle(0x5fe3e8, 1);
            for (const sy of [-1, 1]) g.fillCircle(yuvaX + 10, Y + sy * 52, 6);
            if (i + 1 < k.senaryolar.length) this.devam('Sonraki senaryo  ▸', () => this.senaryo(i + 1), { x: 800, y: 664 });
            else this.time.delayedCall(1600, () => this.gorevBitti());
            return;
          }
          this.gorevHata += 1;
          this.time.delayedCall(2600, () => {
            panel.setX(X0);
            panel.ciz();
            test.setVisible(true);
            calisiyor = false;
          });
        }
      });
    };
  }

  gorevBitti() {
    const yildiz = this.gorevHata === 0 ? 3 : this.gorevHata <= 2 ? 2 : 1;
    this.yazi(480, 640, '★'.repeat(yildiz) + '☆'.repeat(3 - yildiz), { fontSize: '40px', color: '#FFD79A' }).setOrigin(0.5);
    this.diyalog.soyle('ARGE', 'Üç senaryoda da tahmin ve sonuç uyumlu. Panel yuvasında!', true);
    this.time.delayedCall(3600, () => this.bitir(yildiz));
  }
}
