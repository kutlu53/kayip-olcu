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
  // yaziTipi: 'sistem' | 'disleksi' (OpenDyslexic), altyazi: 'normal' | 'buyuk' | 'cokBuyuk' (CLAUDE.md §10.8)
  // sesliOkuma: 'acik' | 'sahneler' (yalnizca ara sahneler) | 'kapali'
  { kalite: null, hareketiAzalt: sistemHareketiAzalt, zorMod: false, yaziTipi: 'sistem', altyazi: 'normal', muzik: true, efekt: true, sesliOkuma: 'acik' },
  oku()
);

// Test ve sunum icin URL ile kalite secimi: ?kalite=yuksek | orta | dusuk
const url = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
if (['yuksek', 'orta', 'dusuk'].includes(url.get('kalite'))) ayarlar.kalite = url.get('kalite');

// Altyazi ve diyalog panelindeki konusma metinlerinin olcegi
export const ALTYAZI_OLCEGI = { normal: 1, buyuk: 1.25, cokBuyuk: 1.5 };
export const altyaziOlcegi = () => ALTYAZI_OLCEGI[ayarlar.altyazi] || 1;

export function kaydet() {
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(ayarlar));
  } catch (e) {
    // gizli pencerede localStorage kapali olabilir; ayarlar yalnizca bu oturumda gecerli
  }
}
