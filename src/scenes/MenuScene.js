import Phaser from 'phaser';
import { yildizDokusu } from '../art/Starfield.js';
import { dunyaDokusu } from '../art/Earth.js';
import { Arge } from '../art/Arge.js';
import { dugme } from '../ui/Dugme.js';
import { YAZI, aralikli } from '../ui/tipografi.js';
import { ayarlarAc } from '../ui/Ayarlar.js';
import { muzikBaslat } from '../systems/Ses.js';
import { durdur as okumaDurdur, sesleriYukle } from '../systems/SesliOkuma.js';
import { oyuncuAc, sonOyuncu, aktifAyarla } from '../systems/SaveSystem.js';

// Kisisel veri toplanmaz: takma ad + sinif kodu (CLAUDE.md §0)
const FORM = `
<form class="giris" autocomplete="off">
  <label for="takmaAd">TAKMA AD</label>
  <input id="takmaAd" name="takmaAd" maxlength="16" placeholder="ör. Yıldız Avcısı">
  <label for="sinifKodu">SINIF KODU</label>
  <input id="sinifKodu" name="sinifKodu" maxlength="10" placeholder="ör. 9A">
  <div class="hata"></div>
  <button type="submit">GÖREVE BAŞLA</button>
  <div class="not">Gerçek adını ve soyadını yazma, takma ad yeterli. Aynı takma ad ve sınıf kodu ile kaldığın yerden devam edersin.</div>
</form>`;

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    // Sahne nesnesi yeniden kullanilir: durum her giriste sifirlanir
    this.giriliyor = false;
    this.form = null;
    this.add.image(640, 360, yildizDokusu(this, { katman: 'uzak' }));
    this.add.image(640, 360, yildizDokusu(this, { katman: 'yakin' }));
    this.dunya = this.add.image(640, 470, dunyaDokusu(this, { ufukY: 410, safak: 'sag' }));
    this.add.rectangle(640, 360, 1280, 720, 0x05070d, 0.45);

    this.arge = new Arge(this, 640, 78, { yaricap: 40, durum: 7 });
    this.add
      .text(640, 168, aralikli('KAYIP ÖLÇÜ'), { fontFamily: YAZI, fontSize: '64px', fontStyle: 'bold', color: '#E6E8EB', padding: { x: 30, y: 24 } })
      .setOrigin(0.5)
      .setShadow(0, 0, '#5FE3E8', 18, false, true);
    this.add
      .text(640, 222, aralikli('GÖKTÜRK-7 · 2071'), { fontFamily: YAZI, fontSize: '17px', color: '#5FE3E8' })
      .setOrigin(0.5)
      .setAlpha(0.85);

    this.ayarSatiri();
    muzikBaslat(null);
    okumaDurdur();
    sesleriYukle();
    this.icerik = this.add.container(0, 0);
    sonOyuncu().then((o) => (o ? this.devamGoster(o) : this.formGoster()));
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  temizle() {
    this.icerik.removeAll(true);
    if (this.form) {
      this.form.destroy();
      this.form = null;
    }
  }

  devamGoster(oyuncu) {
    this.temizle();
    this.icerik.add([
      dugme(this, 640, 350, '▶  DEVAM ET', () => {
        aktifAyarla(oyuncu);
        this.oyunaGir(oyuncu);
      }, { genislik: 440, yukseklik: 72, birincil: true, boyut: 24 }),
      this.add.text(640, 404, `${oyuncu.takmaAd} · ${oyuncu.sinifKodu}`, { fontFamily: YAZI, fontSize: '18px', color: '#D8F6FF' }).setOrigin(0.5),
      dugme(this, 640, 476, 'Başka bir oyuncuyla gir', () => this.formGoster(), { genislik: 340, yukseklik: 54, boyut: 18 })
    ]);
  }

  formGoster() {
    this.temizle();
    this.form = this.add.dom(640, 420).createFromHTML(FORM);
    const kok = this.form.node;
    const hata = kok.querySelector('.hata');
    kok.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const ad = kok.querySelector('#takmaAd').value.trim().replace(/\s+/g, ' ');
      const sinif = kok.querySelector('#sinifKodu').value.trim().replace(/\s+/g, '').toLocaleUpperCase('tr');
      if (ad.length < 2) return (hata.textContent = 'Takma ad en az 2 karakter olmalı.');
      if (!sinif) return (hata.textContent = 'Sınıf kodunu yaz (ör. 9A).');
      if (ad.includes('#') || sinif.includes('#')) return (hata.textContent = '"#" işareti kullanılamaz.');
      const { oyuncu, yeni } = await oyuncuAc(ad, sinif);
      if (!yeni) hata.textContent = 'Kayıt bulundu, kaldığın yerden devam ediyorsun.';
      this.oyunaGir(oyuncu);
    });
  }

  ayarSatiri() {
    // DOM formu Phaser penceresinin ustunde kalir: ayarlar acikken gizlenir
    dugme(this, 480, 650, '⚙  Ayarlar', () => {
      if (this.form) this.form.setVisible(false);
      const { kap } = ayarlarAc(this);
      kap.once('destroy', () => this.form && this.form.active && this.form.setVisible(true));
    }, { genislik: 280, yukseklik: 52, boyut: 17 });
    // Ogretmen panosu PIN korumali; CSV disa/ice aktarim orada (CLAUDE.md §9)
    dugme(this, 800, 650, 'Öğretmen panosu', () => this.git('TeacherScene'), { genislik: 280, yukseklik: 52, boyut: 17 });
  }

  oyunaGir(oyuncu) {
    this.git(oyuncu.girisIzlendi ? 'HubScene' : 'CutsceneScene', oyuncu.girisIzlendi ? undefined : { id: 'G', donus: 'HubScene' });
  }

  git(sahne, veri) {
    if (this.giriliyor) return;
    this.giriliyor = true;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(sahne, veri));
  }

  update(zaman) {
    this.arge.guncelle(zaman);
    this.dunya.x = 640 + Math.sin(zaman / 9000) * 30;
  }
}
