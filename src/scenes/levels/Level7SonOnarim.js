import Phaser from 'phaser';
import BolumTemel from './BolumTemel.js';
import veri from '../../data/bolum7.json';
import { Izgara, izgaradaOk, STILLER, SuruklenebilirVektor } from '../../systems/VectorDraw.js';
import { topla, esitMi, yaz } from '../../systems/VectorMath.js';
import { secenekler } from '../../ui/Secenekler.js';
import { cumleKurucu } from '../../ui/CumleKurucu.js';
import { cip } from '../../ui/Cip.js';
import { dugme } from '../../ui/Dugme.js';
import { YAZI, MONO } from '../../ui/tipografi.js';
import { HAREKETLER, izCiz } from '../../art/SonOnarim.js';
import { istasyonDokusu } from '../../art/Station.js';
import { kivilcimYayici } from '../../fx/Particles.js';
import { karistir } from '../../art/Rastgele.js';
import { ayarlar } from '../../config/settings.js';
import { okumaSuresi } from '../../systems/SesliOkuma.js';

const doldur = (s, d) => s.replace(/\{(\w+)\}/g, (_, k) => (k in d ? d[k] : `{${k}}`));
const kisitla = (x, a, b) => Math.max(a, Math.min(b, x));

// Bolum 7 · Son Onarim (FİZ.9.2.7): hareket gozlemi -> genelleme -> onarim modulleri -> final manevrasi
// (onceki butun bolumleri kullanan kontrol listesi + bileske ayari). Kapanis: Final ara sahnesi (CLAUDE.md §7, §8)
export default class Level7SonOnarim extends BolumTemel {
  constructor() {
    super('Level7SonOnarim', 7, 4);
  }

  arkaPlan() {
    this.add.image(470, 330, istasyonDokusu(this, {})).setAlpha(0.1).setScale(1.1);
  }

  basla(adim) {
    this.gorevHata = 0;
    this.tablo = {};
    if (adim === 'genelleme') this.genelleme();
    else if (adim === 'gorev') this.gorev();
    else if (adim === 'final') this.final();
    else {
      this.kesif();
      this.diyalog.oynat(veri.giris);
    }
  }

  adimBaslat(secenek) {
    super.adimBaslat(secenek);
    this.altAdimDizini = undefined;
  }

  altAdimBaslat() {
    if (this.altAdimDizini !== undefined && this.altAdimDizini <= this.adimNesneleri.length) {
      for (const n of this.adimNesneleri.splice(this.altAdimDizini)) if (n && n.destroy) n.destroy();
    }
    this.altAdimDizini = this.adimNesneleri.length;
  }

  // Hareketli parca karosu: canli cizim + istege bagli iz
  karo(model, p, { baslik, iz = () => false, dur = () => false } = {}) {
    const g = this.ekle(this.add.graphics());
    const cizim = this.ekle(this.add.graphics());
    g.fillStyle(0x04080d, 0.9).fillRoundedRect(p.x, p.y, p.w, p.h, 10);
    if (baslik) this.yazi(p.x + 10, p.y + 6, baslik, { fontFamily: MONO, fontSize: '12px', color: '#5FE3E8' });
    let t0 = this.time.now;
    let donmus = null;
    this.guncelleyiciler.push((zaman) => {
      // Sabitlenen parca son konumunda donar
      if (dur()) {
        if (donmus === null) donmus = (zaman - t0) / 1000;
      } else donmus = null;
      const t = donmus !== null ? donmus : (zaman - t0) / 1000;
      cizim.clear();
      if (iz()) izCiz(cizim, model, t, p);
      model.ciz(cizim, model.durum(t, p), p);
    });
    return { g, kenar: (renk, kalinlik = 2, alfa = 0.5) => g.lineStyle(kalinlik, renk, alfa).strokeRoundedRect(p.x, p.y, p.w, p.h, 10) };
  }

  // ---------------- KESIF: govdedeki hareketler ----------------
  kesif() {
    const k = veri.kesif;
    this.adimBaslat({ no: 0, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'kesif' });
    this.yonerge(k.yonerge);
    this.izAcik = false;
    this.tablo = {};
    const KUTULAR = [[40, 150], [490, 150], [40, 320], [490, 320]];
    this.secili = null;
    this.karolar = k.parcalar.map((parca, i) => {
      const p = { x: KUTULAR[i][0], y: KUTULAR[i][1], w: 430, h: 160 };
      const karo = this.karo(HAREKETLER[parca.id], p, { baslik: parca.ad.toLocaleUpperCase('tr'), iz: () => this.izAcik });
      karo.kenar(0x5fe3e8);
      const alan = this.ekle(this.add.zone(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h).setInteractive({ useHandCursor: true }));
      alan.on('pointerup', () => this.parcaSec(i));
      return { ...karo, p, parca };
    });
    this.izDugme = this.ekle(cip(this, 110, 520, 'İZ: KAPALI', () => {
      this.izAcik = !this.izAcik;
      this.izDugme.yaziAyarla(this.izAcik ? 'İZ: AÇIK' : 'İZ: KAPALI').durumAyarla(this.izAcik ? 'secili' : 'normal');
    }, { genislik: 140, boyut: 16 }));
    this.soruAlani = [];
    this.yazi(200, 512, 'Bir parçaya dokun.', { fontSize: '16px', color: '#8A96A6' });
  }

  parcaSec(i) {
    const k = veri.kesif;
    const parca = k.parcalar[i];
    if (this.tablo[parca.id]) return;
    this.secili = i;
    this.karolar.forEach((kr, j) => kr.kenar(j === i ? 0xffffff : 0x5fe3e8, j === i ? 3 : 2, j === i ? 1 : 0.5));
    for (const n of this.soruAlani) n.destroy();
    this.soruAlani = [];
    const cevap = [null, null, null];
    const n = (o) => (this.soruAlani.push(this.ekle(o)), o);
    n(this.add.rectangle(560, 590, 760, 150, 0x05070d, 1));
    n(this.add.text(200, 500, parca.ad, { fontFamily: YAZI, fontSize: '17px', fontStyle: 'bold', color: '#FFFFFF' }));
    veri.sorular.forEach((soru, s) => {
      const y = 540 + s * 50;
      n(this.add.text(200, y - 10, soru, { fontFamily: YAZI, fontSize: '16px', color: '#D8F6FF' }));
      const ciplar = [true, false].map((deger, j) =>
        n(cip(this, 640 + j * 90, y, deger ? 'Evet' : 'Hayır', () => {
          cevap[s] = deger;
          ciplar.forEach((c, m) => c.durumAyarla(m === j ? 'secili' : 'normal'));
        }, { genislik: 82, yukseklik: 44, boyut: 15 }))
      );
    });
    n(dugme(this, 840, 590, 'Kaydet', () => this.kaydet(i, cevap), { genislik: 120, yukseklik: 52, birincil: true, boyut: 17 }));
    if (parca.kerem) this.diyalog.soyle('Elif', parca.kerem.replace('Kerem: ', 'Kerem diyor ki: '));
  }

  kaydet(i, cevap) {
    const k = veri.kesif;
    const parca = k.parcalar[i];
    if (cevap.some((c) => c === null)) return this.diyalog.soyle('Elif', 'Üç soruyu da yanıtla.');
    const yanlis = cevap.findIndex((c, s) => c !== parca.cevap[s]);
    const birlesik = parca.cevap.filter(Boolean).length > 1;
    const tekTur = birlesik && cevap.filter(Boolean).length === 1;
    this.cevap({ dogru: yanlis < 0, yanilgi: tekTur ? 'M_TEK_HAREKET_TURU' : null, ayrinti: `${parca.id}: ${cevap.map((c) => (c ? 'E' : 'H')).join('')}` });
    if (yanlis >= 0) {
      this.diyalog.soyle('ARGE', tekTur ? k.tekTur : doldur(k.yanlis, { ad: parca.ad, soru: veri.sorular[yanlis] }));
      if (!this.izAcik) this.diyalog.soyle('Elif', 'İzi açmak işine yarayabilir.', true);
      return;
    }
    this.tablo[parca.id] = parca.cevap;
    this.karolar[i].kenar(0x5fe3e8, 3, 1);
    this.yazi(this.karolar[i].p.x + 420, this.karolar[i].p.y + 8, `✓ ${parca.cevap.map((c) => (c ? 'E' : 'H')).join(' ')}`, { fontFamily: MONO, fontSize: '13px', color: '#5FE3E8' }).setOrigin(1, 0);
    for (const n of this.soruAlani) n.destroy();
    this.soruAlani = [];
    this.diyalog.soyle('ARGE', doldur(k.dogru, { ad: parca.ad }));
    if (Object.keys(this.tablo).length === k.parcalar.length) {
      // Hareket turlerinin adlari bu cumlede verilir: dugme cumle okunduktan sonra gelir
      const gecikme = this.diyalog.sonra(1200, 'ARGE', k.kapanis);
      this.time.delayedCall(gecikme + Math.max(1500, okumaSuresi('ARGE', k.kapanis)), () => this.devam('Kuralını yaz  ▸', () => this.genelleme()));
    }
  }

  // ---------------- GENELLEME ----------------
  genelleme() {
    const k = veri.genelleme;
    this.adimBaslat({ no: 1, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'genelleme' });
    this.yonerge(k.yonerge);
    const satirlar = veri.kesif.parcalar.map((p) => `${p.ad}: ${p.cevap.map((c, s) => `${['ilerliyor', 'dönüyor', 'gidip geliyor'][s]} ${c ? 'evet' : 'hayır'}`).join(', ')}`);
    this.ozet = satirlar.join(' · ');
    this.yazi(120, 146, satirlar.join('\n'), { fontSize: '13px', color: '#D8F6FF', lineSpacing: 1 });
    this.kurucu = this.ekle(cumleKurucu(this, { x: 120, y: 230, genislik: 800, parcalar: karistir([...k.parcalar, ...k.celdiriciler]), kontrol: (c) => this.genellemeKontrol(c) }));
  }

  genellemeKontrol(c) {
    const k = veri.genelleme;
    if (c.tur === 'parca') {
      if (k.kabul.some((d) => d.length === c.parcalar.length && d.every((p, i) => p === c.parcalar[i]))) return this.kuralKabul(c.metin, 'otomatik');
      const tek = c.parcalar.includes(k.celdiriciler[0]);
      const hizli = c.parcalar.includes(k.celdiriciler[1]);
      this.cevap({ dogru: false, yanilgi: tek ? 'M_TEK_HAREKET_TURU' : null, ayrinti: `kural: ${c.metin}` });
      this.diyalog.soyle('ARGE', tek ? k.tekTur : hizli ? k.hizli : k.eksik);
      return;
    }
    const m = c.metin.toLocaleLowerCase('tr');
    if (k.serbestAnahtarlar.every((grup) => grup.some((a) => m.includes(a)))) return this.kuralKabul(c.metin, 'beklemede');
    this.cevap({ dogru: false, ayrinti: `serbest kural: ${c.metin}` });
    this.diyalog.soyle('Elif', k.serbestEksik);
  }

  kuralKabul(metin, onay) {
    this.cevap({ dogru: true, ayrinti: `kural (${onay}): ${metin}` });
    this.defterYaz({ tur: 'tablo', metin: `Gövdedeki hareketler: ${this.ozet}` });
    this.defterYaz({ tur: 'kural', metin, onay });
    if (this.kurucu) this.kurucu.destroy();
    this.yazi(120, 260, `“${metin}”`, { fontSize: '22px', color: '#FFFFFF', fontStyle: 'italic', wordWrap: { width: 800 } });
    this.yazi(120, 400, onay === 'beklemede' ? 'Deftere yazıldı · öğretmen onayı bekliyor' : 'Deftere yazıldı', { fontSize: '15px', color: '#8A96A6' });
    this.diyalog.soyle('ARGE', veri.genelleme.kabulMesaji);
    this.devam('Göreve geç  ▸', () => this.gorev());
  }

  // ---------------- GOREV: onarim modulleri ----------------
  gorev() {
    const k = veri.gorev;
    this.adimBaslat({ no: 2, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'gorev' });
    this.yonerge(k.yonerge);
    this.kivilcim = this.ekle(kivilcimYayici(this, 0, 0));
    this.secimler = k.parcalar.map(() => new Set());
    this.sabit = k.parcalar.map(() => false);
    this.seciliParca = 0;
    this.gorevKarolari = k.parcalar.map((parca, i) => {
      const p = { x: 40 + (i % 3) * 296, y: 150 + Math.floor(i / 3) * 172, w: 284, h: 160 };
      const karo = this.karo(HAREKETLER[parca.id], p, { baslik: parca.ad.toLocaleUpperCase('tr'), dur: () => this.sabit[i] });
      const etiket = this.yazi(p.x + 10, p.y + p.h - 24, '', { fontFamily: MONO, fontSize: '12px', color: '#F2E6C8' });
      const alan = this.ekle(this.add.zone(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h).setInteractive({ useHandCursor: true }));
      alan.on('pointerup', () => this.gorevSec(i));
      return { ...karo, p, etiket };
    });
    this.turCipleri = k.turler.map((tur, j) =>
      this.ekle(cip(this, 140 + j * 200, 530, `${tur.ad}\n${tur.modul}`, () => this.turDegistir(tur.id), { genislik: 188, yukseklik: 62, boyut: 15 }))
    );
    this.takDugme = this.ekle(dugme(this, 800, 530, 'MODÜLLERİ TAK', () => this.modulKontrol(), { genislik: 200, yukseklik: 62, birincil: true, boyut: 17 }));
    this.gorevSec(0);
  }

  gorevSec(i) {
    if (this.sabit[i]) return;
    this.seciliParca = i;
    this.gorevKarolari.forEach((kr, j) => kr.kenar(j === i ? 0xffffff : this.sabit[j] ? 0x5fe3e8 : 0x3a4656, j === i ? 3 : 2, 1));
    this.turCipleri.forEach((c, j) => c.durumAyarla(this.secimler[i].has(veri.gorev.turler[j].id) ? 'secili' : 'normal'));
  }

  turDegistir(id) {
    const i = this.seciliParca;
    if (this.sabit[i]) return;
    const s = this.secimler[i];
    if (s.has(id)) s.delete(id);
    else s.add(id);
    this.gorevSec(i);
    const turler = veri.gorev.turler.filter((t) => s.has(t.id));
    this.gorevKarolari[i].etiket.setText(turler.map((t) => t.modul).join(' + '));
  }

  modulKontrol() {
    const k = veri.gorev;
    const eksik = this.secimler.filter((s, i) => !this.sabit[i] && s.size === 0).length;
    if (eksik) return this.diyalog.soyle('ARGE', doldur(k.eksik, { sayi: eksik }));
    const yanlis = [];
    k.parcalar.forEach((parca, i) => {
      if (this.sabit[i]) return;
      const s = this.secimler[i];
      const dogru = s.size === parca.tur.length && parca.tur.every((t) => s.has(t));
      if (dogru) {
        this.sabit[i] = true;
        this.gorevKarolari[i].kenar(0x5fe3e8, 3, 1);
        this.gorevKarolari[i].etiket.setColor('#5FE3E8').setText(`✓ ${this.gorevKarolari[i].etiket.text}`);
      } else yanlis.push(i);
    });
    const tekTur = yanlis.find((i) => k.parcalar[i].tur.length > 1 && this.secimler[i].size === 1);
    this.cevap({
      dogru: yanlis.length === 0,
      yanilgi: tekTur !== undefined ? 'M_TEK_HAREKET_TURU' : null,
      ayrinti: `moduller: ${k.parcalar.map((p, i) => `${p.id}=${[...this.secimler[i]].join('+')}`).join(', ')}`
    });
    if (yanlis.length) {
      this.gorevHata += 1;
      for (const i of yanlis) {
        const { p } = this.gorevKarolari[i];
        this.kivilcim.explode(12, p.x + p.w / 2, p.y + p.h / 2);
        this.gorevKarolari[i].kenar(0xd64545, 3, 1);
      }
      this.cameras.main.shake(250, 0.004);
      this.diyalog.soyle('ARGE', tekTur !== undefined ? doldur(k.tekTur, { ad: k.parcalar[tekTur].ad }) : doldur(k.hatali, { liste: yanlis.map((i) => k.parcalar[i].ad).join(', ') }));
      this.time.delayedCall(900, () => this.gorevSec(yanlis[0]));
      return;
    }
    this.takDugme.setVisible(false);
    this.turCipleri.forEach((c) => c.setVisible(false));
    this.diyalog.soyle('ARGE', k.basari);
    this.devam('Final manevrası  ▸', () => this.final());
  }

  // ---------------- FINAL: kontrol listesi + bileske ayari ----------------
  final() {
    const k = veri.final;
    this.adimBaslat({ no: 3, baslik: k.baslik, ipuclari: ayarlar.zorMod ? k.zorMod.ipuclari : k.ipuclari, ad: 'final' });
    this.yonerge(k.yonerge);
    this.kontrol(0);
  }

  kontrol(i) {
    const k = veri.final;
    const c = k.kontroller[i];
    this.altAdimBaslat();
    this.yazi(40, 160, `KONTROL ${i + 1}/${k.kontroller.length}`, { fontFamily: MONO, fontSize: '13px', color: '#5FE3E8' });
    this.ekle(
      secenekler(this, 120, 200, c.soru, c.secenekler, (s) => {
        this.cevap({ dogru: s.dogru, yanilgi: s.yanilgi, ayrinti: `final kontrol ${i + 1}: ${s.metin}` });
        if (!s.dogru) this.gorevHata += 1;
        this.diyalog.soyle('ARGE', s.dogru ? c.dogru : c.yanlis);
        if (i + 1 < k.kontroller.length) this.devam('Sonraki  ▸', () => this.kontrol(i + 1));
        else this.devam('İticilere geç  ▸', () => this.iticiler());
      }, { genislik: 700, yukseklik: 52 })
    );
  }

  iticiler() {
    const k = veri.final;
    // Zor mod (CLAUDE.md §5): hasarli itici buyukluk + aciyla verilir, izgara soluklasir; bilesenler sin/cos ile bulunur
    const zor = ayarlar.zorMod;
    this.altAdimBaslat();
    this.yonerge(zor ? k.zorMod.iticiYonerge : k.iticiYonerge);
    const iz = new Izgara({ x: 200, y: 360, birim: 34, sol: -2, sag: 10, alt: -4, ust: 4 });
    const g = this.ekle(this.add.graphics());
    iz.ciz(g, { alfa: zor ? 0.3 : 1 });
    this.yazi(iz.ekran([10, 0])[0] + 6, iz.ekran([10, 0])[1] - 8, 'İLERİ (yörünge yönü)', { fontFamily: MONO, fontSize: '11px', color: '#8A96A6' }).setOrigin(1, 1);
    // Hedef: kesikli hayalet ok
    izgaradaOk(g, iz, [0, 0], k.hedef, { renk: 0xffffff, kalinlik: 2, kesikli: true, alfa: 0.5 });
    this.yazi(iz.ekran(k.hedef)[0], iz.ekran(k.hedef)[1] + 12, 'HEDEF: 6 kN ileri', { fontFamily: MONO, fontSize: '12px', color: '#FFFFFF' }).setOrigin(0.5, 0);
    const canli = this.ekle(this.add.graphics());
    const okuma = this.yazi(600, 190, '', { fontSize: '18px', color: '#D8F6FF', lineSpacing: 8 });
    const D = k.hasarli;
    // Zor modda bileske ATESLE'ye kadar gizli: yoksa hasarli iticinin bilesenleri sin/cos gerekmeden okunurdu
    let bileskeAcik = !zor;
    const ciz = () => {
      canli.clear();
      // Uc uca ekleme (Bolum 4): hasarli -> ana -> dikey; bileske mavi
      izgaradaOk(canli, iz, D, A.v, STILLER.kopya);
      izgaradaOk(canli, iz, topla(D, A.v), Y.v, STILLER.kopya);
      const R = topla(D, A.v, Y.v);
      if (bileskeAcik) izgaradaOk(canli, iz, [0, 0], R, STILLER.bileske);
      const hasarliMetin = zor ? `${k.zorMod.buyukluk} kN, ileriyle ${k.zorMod.aci}° yukarı` : `${D[0]} kN ileri, ${D[1]} kN yukarı`;
      okuma.setText(`Hasarlı itici: ${hasarliMetin}\nAna itici: ${yaz(A.v[0])} kN ${A.v[0] >= 0 ? 'ileri' : 'geri'}\nDikey itici: ${yaz(Math.abs(Y.v[1]))} kN ${Y.v[1] >= 0 ? 'yukarı' : 'aşağı'}\nBileşke: ${bileskeAcik ? `(${yaz(R[0])} ; ${yaz(R[1])}) kN` : '? (ATEŞLE ile görülür)'}`);
    };
    const hasar = this.ekle(new SuruklenebilirVektor(this, iz, { v: D, etiket: 'Hasarlı', birimAdi: 'kN' }));
    hasar.kilitle();
    if (zor) {
      g.lineStyle(2, 0xe6e8eb, 0.8).beginPath();
      // Yay, baslangictaki kisa ana/dikey oklarin disinda kalsin
      g.arc(iz.x, iz.y, 62, 0, (-k.zorMod.aci * Math.PI) / 180, true).strokePath();
      this.yazi(iz.x + 88, iz.y - 34, `${k.zorMod.aci}°`, { fontSize: '16px', color: '#E6E8EB' });
    }
    const A = this.ekle(new SuruklenebilirVektor(this, iz, { v: [1, 0], etiket: 'Ana', birimAdi: 'kN', kisit: ([x]) => [kisitla(x, -2, 8), 0], degisti: ciz }));
    const Y = this.ekle(new SuruklenebilirVektor(this, iz, { v: [0, 1], etiket: 'Dikey', birimAdi: 'kN', kisit: ([, y]) => [0, kisitla(y, -4, 4)], degisti: ciz, etiketYonu: -1 }));
    ciz();
    const ates = this.ekle(dugme(this, 720, 470, 'ATEŞLE  ▸', () => {
      const R = topla(D, A.v, Y.v);
      const dogru = esitMi(R, k.hedef, 0.01);
      bileskeAcik = true;
      ciz();
      this.cevap({ dogru, ayrinti: `final itici: ana ${A.v[0]}, dikey ${Y.v[1]} → bileşke (${R[0]}, ${R[1]})` });
      if (!dogru) {
        this.gorevHata += 1;
        this.cameras.main.shake(300, 0.005);
        this.diyalog.soyle('ARGE', Math.abs(R[1]) > 0.01 ? k.sapma : R[0] > k.hedef[0] ? k.fazla : k.az);
        return;
      }
      ates.setVisible(false);
      A.kilitle();
      Y.kilitle();
      this.diyalog.soyle('ARGE', k.basari);
      this.defterYaz({ tur: 'final', metin: `Yörünge düzeltmesi: hasarlı itici (2; 2) kN + ana itici ${A.v[0]} kN + dikey itici ${Y.v[1]} kN = 6 kN ileri.` });
      const yildiz = this.gorevHata === 0 ? 3 : this.gorevHata <= 2 ? 2 : 1;
      this.yazi(720, 560, '★'.repeat(yildiz) + '☆'.repeat(3 - yildiz), { fontSize: '40px', color: '#FFD79A' }).setOrigin(0.5);
      this.time.delayedCall(3200, () => this.bitir(yildiz));
    }, { genislik: 220, yukseklik: 62, birincil: true, boyut: 19 }));
  }
}
