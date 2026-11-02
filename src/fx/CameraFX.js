import { ayarlar } from '../config/settings.js';

// "Hareketi azalt" acikken sarsinti ve bozulma kapanir, flas yumusar (CLAUDE.md §10.6)

export function sars(sahne, sure = 400, siddet = 0.008) {
  if (ayarlar.hareketiAzalt) return;
  sahne.cameras.main.shake(sure, siddet);
}

// Tek flas; ard arda kullanilmaz (saniyede en fazla 3 flas kurali)
export function flas(sahne, sure = 300) {
  if (ayarlar.hareketiAzalt) sahne.cameras.main.flash(sure * 2, 90, 90, 90);
  else sahne.cameras.main.flash(sure, 255, 255, 255);
}

export function bozulma(sahne, sure = 500, guc = 1) {
  if (ayarlar.hareketiAzalt) return;
  const fx = sahne.sinemaFX;
  if (fx) {
    sahne.tweens.addCounter({
      from: guc,
      to: 0,
      duration: sure,
      ease: 'Quad.easeIn',
      onUpdate: (tw) => (fx.bozulma = tw.getValue()),
      onComplete: () => (fx.bozulma = 0)
    });
    return;
  }
  // Canvas modu: shader yok, panel yatayda sicrar
  const kok = sahne.panel && sahne.panel.kok;
  if (!kok) return;
  const olay = sahne.time.addEvent({
    delay: 50,
    repeat: Math.floor(sure / 50),
    callback: () => {
      kok.x = olay.getRepeatCount() === 0 ? 0 : (Math.random() - 0.5) * 24 * guc;
    }
  });
}
