const ANAHTAR = 'kayipOlcu.ayarlar';

function oku() {
  try {
    return JSON.parse(localStorage.getItem(ANAHTAR)) || {};
  } catch (e) {
    return {};
  }
}

const sistemHareketiAzalt =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const ayarlar = Object.assign(
  { kalite: null, hareketiAzalt: sistemHareketiAzalt, zorMod: false },
  oku()
);

// Test ve sunum icin URL ile kalite secimi: ?kalite=yuksek | orta | dusuk
const url = new URLSearchParams(location.search);
if (['yuksek', 'orta', 'dusuk'].includes(url.get('kalite'))) ayarlar.kalite = url.get('kalite');

export function kaydet() {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(ayarlar));
  } catch (e) {
    // gizli pencerede localStorage kapali olabilir; ayarlar yalnizca bu oturumda gecerli
  }
}
