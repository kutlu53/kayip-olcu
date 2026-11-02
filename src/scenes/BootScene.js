import Phaser from 'phaser';
import { parcacikDokulari } from '../fx/Particles.js';
import { kaliteOlc } from '../fx/Quality.js';
import { Arge } from '../art/Arge.js';
import { YAZI, aralikli } from '../ui/tipografi.js';
import bolumler from '../data/levels.json';
import { sonOyuncu, aktifAyarla, oyuncuAc } from '../systems/SaveSystem.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    parcacikDokulari(this);
    this.arge = new Arge(this, 640, 330, { yaricap: 70, durum: 0 });
    this.arge.durumaGec(7, 2400);
    this.add
      .text(640, 450, aralikli('ARGE BAŞLATILIYOR'), { fontFamily: YAZI, fontSize: '18px', color: '#5FE3E8' })
      .setOrigin(0.5)
      .setAlpha(0.8);

    // Hata ayiklama ve sunum: ?sahne=G&panel=3 dogrudan ara sahneyi acar;
    // ?bolum=4&adim=gorev bolumu son oyuncuyla (yoksa "Deneme#SUNUM") dogrudan baslatir
    const url = new URLSearchParams(location.search);
    const dogrudan = url.get('sahne');
    const bolum = bolumler.find((b) => String(b.bolum) === url.get('bolum') && b.hazir);
    const enAz = new Promise((coz) => this.time.delayedCall(dogrudan || bolum ? 0 : 2400, coz));
    Promise.all([kaliteOlc(this, 2400), enAz]).then(async () => {
      if (dogrudan) return this.scene.start('CutsceneScene', { id: dogrudan, panel: Number(url.get('panel') || 0) });
      if (bolum) {
        const son = await sonOyuncu();
        if (son) aktifAyarla(son);
        else await oyuncuAc('Deneme', 'SUNUM');
        return this.scene.start(bolum.sahne, { adim: url.get('adim') });
      }
      this.scene.start('MenuScene');
    });
  }

  update(zaman) {
    this.arge.guncelle(zaman);
  }
}
