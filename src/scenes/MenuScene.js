import Phaser from 'phaser';
import { yildizDokusu } from '../art/Starfield.js';
import { dunyaDokusu } from '../art/Earth.js';
import { Arge } from '../art/Arge.js';
import { dugme } from '../ui/Dugme.js';
import { YAZI, aralikli } from '../ui/tipografi.js';
import { ayarlar, kaydet } from '../config/settings.js';
import { KADEMELER, kademeAdi, sonrakiKademe } from '../fx/Quality.js';

// Gecici menu: takma ad + sinif kodu girisi Asama 1'de eklenecek
export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(veri = {}) {
    this.add.image(640, 360, yildizDokusu(this, { katman: 'uzak' }));
    this.add.image(640, 360, yildizDokusu(this, { katman: 'yakin' }));
    this.dunya = this.add.image(640, 420, dunyaDokusu(this, { ufukY: 410, safak: 'sag' }));
    this.add.rectangle(640, 360, 1280, 720, 0x05070d, 0.35);

    this.arge = new Arge(this, 640, 140, { yaricap: 44, durum: 7 });
    this.add
      .text(640, 240, aralikli('KAYIP ÖLÇÜ'), { fontFamily: YAZI, fontSize: '68px', fontStyle: 'bold', color: '#E6E8EB', padding: { x: 30, y: 24 } })
      .setOrigin(0.5)
      .setShadow(0, 0, '#5FE3E8', 18, false, true);
    this.add
      .text(640, 298, aralikli('GÖKTÜRK-7 · 2071'), { fontFamily: YAZI, fontSize: '18px', color: '#5FE3E8' })
      .setOrigin(0.5)
      .setAlpha(0.85);

    const izleYazi = veri.izlenen ? '↻  GİRİŞİ TEKRAR İZLE' : '▶  GİRİŞ SAHNESİNİ İZLE';
    dugme(this, 640, 400, izleYazi, () => this.basla(), { genislik: 440, yukseklik: 68, birincil: true, boyut: 22 });

    const hareket = dugme(this, 485, 492, '', () => {
      ayarlar.hareketiAzalt = !ayarlar.hareketiAzalt;
      kaydet();
      yaz();
    }, { genislik: 300, yukseklik: 54, boyut: 17 });
    const kalite = dugme(this, 795, 492, '', () => {
      sonrakiKademe();
      yaz();
    }, { genislik: 300, yukseklik: 54, boyut: 17 });
    const yaz = () => {
      hareket.yaziAyarla(`Hareketi azalt: ${ayarlar.hareketiAzalt ? 'Açık' : 'Kapalı'}`);
      kalite.yaziAyarla(`Görsel kalite: ${KADEMELER[kademeAdi()].ad}`);
    };
    yaz();

    if (veri.izlenen) {
      this.add
        .text(640, 575, 'Giriş tamamlandı. Sıradaki: Bölüm 1 — Uyanış (yapım aşamasında)', { fontFamily: YAZI, fontSize: '18px', color: '#D8F6FF' })
        .setOrigin(0.5);
    }
    this.add
      .text(640, 688, 'Deneme sürümü · şimdilik yalnızca Giriş ara sahnesi oynatılabiliyor', { fontFamily: YAZI, fontSize: '14px', color: '#8A96A6' })
      .setOrigin(0.5);
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  update(zaman) {
    this.arge.guncelle(zaman);
    this.dunya.x = 640 + Math.sin(zaman / 9000) * 30;
  }

  basla() {
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('CutsceneScene', { id: 'G' }));
  }
}
