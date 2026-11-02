import Phaser from 'phaser';
import { yildizDokusu } from '../art/Starfield.js';
import { dunyaDokusu } from '../art/Earth.js';
import { Arge } from '../art/Arge.js';
import { dugme } from '../ui/Dugme.js';
import { YAZI, aralikli } from '../ui/tipografi.js';
import { ayarlar, kaydet } from '../config/settings.js';
import { KADEMELER, kademeAdi, sonrakiKademe } from '../fx/Quality.js';
import { oyuncuAc, sonOyuncu, aktifAyarla } from '../systems/SaveSystem.js';
import { csvIndir } from '../systems/Telemetry.js';

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
    const hareket = dugme(this, 330, 650, '', () => {
      ayarlar.hareketiAzalt = !ayarlar.hareketiAzalt;
      kaydet();
      yaz();
    }, { genislik: 280, yukseklik: 50, boyut: 16 });
    const kalite = dugme(this, 640, 650, '', () => {
      sonrakiKademe();
      yaz();
    }, { genislik: 280, yukseklik: 50, boyut: 16 });
    const bilgi = this.add.text(950, 688, '', { fontFamily: YAZI, fontSize: '13px', color: '#8A96A6' }).setOrigin(0.5);
    dugme(this, 950, 650, 'Öğretmen: verileri indir', async () => {
      const adet = await csvIndir();
      bilgi.setText(adet ? `${adet} kayıt indirildi (CSV)` : 'Bu cihazda henüz kayıt yok');
    }, { genislik: 280, yukseklik: 50, boyut: 16 });
    const yaz = () => {
      hareket.yaziAyarla(`Hareketi azalt: ${ayarlar.hareketiAzalt ? 'Açık' : 'Kapalı'}`);
      kalite.yaziAyarla(`Görsel kalite: ${KADEMELER[kademeAdi()].ad}`);
    };
    yaz();
  }

  oyunaGir(oyuncu) {
    if (this.giriliyor) return;
    this.giriliyor = true;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (oyuncu.girisIzlendi) this.scene.start('HubScene');
      else this.scene.start('CutsceneScene', { id: 'G', donus: 'HubScene' });
    });
  }

  update(zaman) {
    this.arge.guncelle(zaman);
    this.dunya.x = 640 + Math.sin(zaman / 9000) * 30;
  }
}
