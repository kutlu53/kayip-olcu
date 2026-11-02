import Phaser from 'phaser';
import { ayarlar, kaydet } from '../config/settings.js';

// Kalite kademeleri (CLAUDE.md §10.6)
export const KADEMELER = {
  yuksek: { ad: 'Yüksek', parcacik: 400, yildiz: 600, postFX: 'tam' },
  orta: { ad: 'Orta', parcacik: 150, yildiz: 300, postFX: 'kismi' },
  dusuk: { ad: 'Düşük', parcacik: 40, yildiz: 120, postFX: 'kapali' }
};
const SIRA = ['dusuk', 'orta', 'yuksek'];

export const kademeAdi = () => ayarlar.kalite || 'orta';
export const kademe = () => KADEMELER[kademeAdi()];
export const kaliteYeterli = (enAz) => SIRA.indexOf(kademeAdi()) >= SIRA.indexOf(enAz);

export function sonrakiKademe() {
  ayarlar.kalite = SIRA[(SIRA.indexOf(kademeAdi()) + 1) % SIRA.length];
  kaydet();
  return ayarlar.kalite;
}

// Ilk acilista FPS olcerek kademe secer; secim kaydedilir, ayarlardan degistirilebilir
export function kaliteOlc(sahne, sureMs = 2500) {
  return new Promise((coz) => {
    if (ayarlar.kalite) return coz(ayarlar.kalite);
    const adet = Math.round(sureMs / 250);
    const ornekler = [];
    sahne.time.addEvent({
      delay: 250,
      repeat: adet - 1,
      callback: () => {
        ornekler.push(sahne.game.loop.actualFps);
        if (ornekler.length < adet) return;
        const gecerli = ornekler.slice(2); // ilk olcumler isinma donemi
        const ort = gecerli.reduce((a, b) => a + b, 0) / gecerli.length;
        let k = ort >= 55 ? 'yuksek' : ort >= 40 ? 'orta' : 'dusuk';
        if (sahne.game.renderer.type !== Phaser.WEBGL && k === 'yuksek') k = 'orta';
        ayarlar.kalite = k;
        kaydet();
        coz(k);
      }
    });
  });
}
