import { ayarlar } from '../config/settings.js';

// Isik sonmesi egrisi: sabit bir titreme deseni. Parlak tepe sayisi saniyede 3'u gecmez
const TITREME_DESENI = [1, 0.35, 0.9, 0.25, 0.6, 0];
export function titreme(v) {
  if (ayarlar.hareketiAzalt || v >= 1) return v;
  return 1 - TITREME_DESENI[Math.min(Math.floor(v * TITREME_DESENI.length), TITREME_DESENI.length - 1)];
}

// Eski tup ekran gibi acilma: once ince yatay cizgi, sonra tam ekran
export function ekranAc(sahne, hedef, sure = 600, bitince) {
  hedef.setVisible(true);
  if (ayarlar.hareketiAzalt) {
    hedef.setScale(1).setAlpha(0);
    sahne.tweens.add({ targets: hedef, alpha: 1, duration: sure, onComplete: bitince });
    return;
  }
  hedef.setScale(0.02, 0.01).setAlpha(1);
  sahne.tweens.add({
    targets: hedef,
    scaleX: 1,
    duration: sure * 0.35,
    ease: 'Cubic.easeOut',
    onComplete: () =>
      sahne.tweens.add({ targets: hedef, scaleY: 1, duration: sure * 0.65, ease: 'Back.easeOut', onComplete: bitince })
  });
}
