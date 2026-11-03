import Phaser from 'phaser';
import bolumler from '../../data/levels.json';
import { yildizDokusu } from '../../art/Starfield.js';
import { ustCubuk, UST_YUKSEKLIK } from '../../ui/UstCubuk.js';
import { diyalogPaneli } from '../../ui/DiyalogPaneli.js';
import { defterSimgesi } from '../../ui/Defter.js';
import { dugme } from '../../ui/Dugme.js';
import { modalAc } from '../../ui/Panel.js';
import { YAZI, MONO, OKUMA, okumaBoyutu, aralikli } from '../../ui/tipografi.js';
import { aktifOyuncu, aktifiKaydet, guc } from '../../systems/SaveSystem.js';
import { olayKaydet } from '../../systems/Telemetry.js';
import { IpucuSistemi } from '../../systems/HintSystem.js';
import { Diyalog } from '../../systems/DialogueSystem.js';
import { ayarlar } from '../../config/settings.js';
import { efekt, muzikBaslat } from '../../systems/Ses.js';
import { durdur as okumaDurdur } from '../../systems/SesliOkuma.js';

// Butun bolumlerin ortak iskeleti (CLAUDE.md §6 ekran duzeni ve §9 telemetri):
// ust cubuk, sag panel (ARGE + Elif + ipucu), defter simgesi, adim basligi, adim nesnelerinin temizligi
export default class BolumTemel extends Phaser.Scene {
  constructor(anahtar, bolumNo, adimSayisi) {
    super(anahtar);
    this.bolumNo = bolumNo;
    this.adimSayisi = adimSayisi;
  }

  create(veri = {}) {
    this.oyuncu = aktifOyuncu();
    if (!this.oyuncu) {
      this.scene.start('MenuScene');
      return;
    }
    this.tanim = bolumler.find((b) => b.bolum === this.bolumNo);
    this.cikti = this.tanim.ciktilar[0];
    this.adimNesneleri = [];
    this.guncelleyiciler = [];
    this.bitiyor = false;

    this.add.image(640, 360, yildizDokusu(this, { katman: 'uzak' }));
    this.arkaPlan();
    const cubuk = ustCubuk(this, { menuye: () => this.haritayaDonSor(), menuEtiketi: 'Harita' });
    cubuk.guncelle(this.oyuncu);
    this.panel = diyalogPaneli(this, { argeDurum: guc(this.oyuncu) });
    this.diyalog = new Diyalog(this, this.panel);
    this.ipucu = new IpucuSistemi(this.panel, { bolum: this.bolumNo, cikti: this.cikti });
    defterSimgesi(this, 64, 640, () => this.oyuncu);
    this.baslikYazi = this.add.text(36, UST_YUKSEKLIK + 14, '', { fontFamily: MONO, fontSize: '14px', color: '#5FE3E8' }).setDepth(300);
    this.ilerleme = this.add.graphics().setDepth(300);

    muzikBaslat(guc(this.oyuncu));
    okumaDurdur();
    this.bolumBaslangic = this.time.now;
    // Zor modda oynanan bolum ogretmen verisinde ayirt edilebilsin
    olayKaydet('bolumBasla', { bolum: this.bolumNo, cikti: this.cikti, ayrinti: ayarlar.zorMod ? 'zor mod' : null });
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.basla(veri.adim);
  }

  // Alt siniflar doldurur
  arkaPlan() {}
  basla() {}

  adimBaslat({ no, baslik, ipuclari = [], ad }) {
    this.temizle();
    this.diyalog.durdur();
    this.panel.sustur();
    this.adimNo = no;
    this.baslikYazi.setText(aralikli(baslik));
    this.ilerleme.clear();
    const x0 = 900 - (this.adimSayisi - 1) * 22;
    for (let i = 0; i < this.adimSayisi; i++) {
      this.ilerleme.lineStyle(2, 0x5fe3e8, i <= no ? 1 : 0.35).strokeCircle(x0 + i * 22, UST_YUKSEKLIK + 22, 6);
      if (i < no) this.ilerleme.fillStyle(0x5fe3e8, 1).fillCircle(x0 + i * 22, UST_YUKSEKLIK + 22, 4);
    }
    this.ipucu.adimAyarla(ad, ipuclari);
    this.adimBaslangic = this.time.now;
    this.deneme = 0;
  }

  ekle(...nesneler) {
    this.adimNesneleri.push(...nesneler);
    return nesneler[0];
  }

  temizle() {
    for (const n of this.adimNesneleri) if (n && n.destroy) n.destroy();
    this.adimNesneleri = [];
    this.guncelleyiciler = [];
  }

  yonerge(metin) {
    if (this.yonergeYazi) this.yonergeYazi.destroy();
    this.yonergeYazi = this.ekle(
      this.add.text(36, UST_YUKSEKLIK + 40, metin, { fontFamily: OKUMA, fontSize: okumaBoyutu(18), color: '#D8F6FF', wordWrap: { width: 880 }, lineSpacing: 3 }).setDepth(300)
    );
    return this.yonergeYazi;
  }

  yazi(x, y, metin, stil = {}) {
    return this.ekle(this.add.text(x, y, metin, { fontFamily: YAZI, fontSize: '18px', color: '#D8F6FF', ...stil }));
  }

  devam(metin, fn, { x = 800, y = 664, genislik = 240 } = {}) {
    return this.ekle(dugme(this, x, y, metin, fn, { genislik, yukseklik: 56, birincil: true, boyut: 18 }));
  }

  // Her cevap telemetriye duser; yanlis secenekler bir yanilgi koduna eslenir (CLAUDE.md §9)
  cevap({ dogru, yanilgi = null, ayrinti = null }) {
    this.deneme += 1;
    olayKaydet('cevap', {
      bolum: this.bolumNo,
      cikti: this.cikti,
      dogru,
      deneme: this.deneme,
      yanilgi: dogru ? null : yanilgi,
      ipucuKademesi: this.ipucu.kademe,
      sureSn: Math.round((this.time.now - this.adimBaslangic) / 1000),
      ayrinti
    });
    efekt(dogru ? 'dogru' : 'yanlis');
    if (dogru) this.ipucu.dogru();
    else this.ipucu.hata();
  }

  defterYaz(kayit) {
    this.oyuncu.defter = this.oyuncu.defter || [];
    this.oyuncu.defter.push({ bolum: this.bolumNo, zaman: new Date().toISOString(), ...kayit });
    aktifiKaydet();
    olayKaydet('defterKayit', { bolum: this.bolumNo, cikti: this.cikti, ayrinti: `${kayit.tur}: ${kayit.metin}` });
  }

  bitir(yildiz) {
    if (this.bitiyor) return;
    this.bitiyor = true;
    const o = this.oyuncu;
    const sureSn = Math.round((this.time.now - this.bolumBaslangic) / 1000);
    if (!o.sistemler.includes(this.bolumNo)) o.sistemler.push(this.bolumNo);
    o.sistemler.sort((a, b) => a - b);
    const eski = o.bolumler[this.bolumNo];
    o.bolumler[this.bolumNo] = { tamamlandi: true, yildiz: Math.max(yildiz, eski ? eski.yildiz : 0), sureSn };
    aktifiKaydet();
    efekt('basari');
    olayKaydet('bolumBitir', { bolum: this.bolumNo, cikti: this.cikti, sureSn, ayrinti: `${yildiz} yıldız` });
    const kapanis = this.tanim.kapanisSahnesi;
    this.git(kapanis ? 'CutsceneScene' : 'HubScene', kapanis ? { id: kapanis, donus: 'HubScene' } : undefined);
  }

  // Bolumun ortasinda ilerleme kaydedilmez: haritaya donmeden once sorulur
  haritayaDonSor() {
    if (this.bitiyor) return;
    const { kap, kapan } = modalAc(this, 'HARİTAYA DÖN', (k, alan) => {
      k.add(this.add.text(alan.sol, alan.ust + 10, 'Haritaya dönersen bu bölüme sonra baştan başlarsın. Gözlem Defteri’ne yazdıkların kalır.', { fontFamily: OKUMA, fontSize: okumaBoyutu(20), color: '#D8F6FF', wordWrap: { width: alan.genislik }, lineSpacing: 4 }));
      k.add(dugme(this, alan.sol + 150, alan.ust + alan.yukseklik - 30, 'Bölümde kal', () => kapan(), { genislik: 280, yukseklik: 56, boyut: 18 }));
      k.add(dugme(this, alan.sol + alan.genislik - 150, alan.ust + alan.yukseklik - 30, 'Haritaya dön', () => this.git('HubScene'), { genislik: 280, yukseklik: 56, birincil: true, boyut: 18 }));
    }, { genislik: 680, yukseklik: 300 });
    kap.setDepth(2000);
  }

  git(sahne, veri) {
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(sahne, veri));
  }

  update(zaman, delta) {
    if (!this.panel) return;
    this.panel.guncelle(zaman);
    for (const f of this.guncelleyiciler) f(zaman, delta);
  }
}
