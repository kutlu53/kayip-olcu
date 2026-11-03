import { ayarlar } from '../config/settings.js';

// Harici yazi tipi sunucusu yok (cevrim disi calisma): sistem yazi tipleri.
// Disleksiye uygun secenek OpenDyslexic (OFL) yerel paketten gelir (main.js, @fontsource/opendyslexic)
export const SISTEM_YAZI = '"Segoe UI", "Noto Sans", "Helvetica Neue", Arial, sans-serif';
const DISLEKSI_YAZI = `"OpenDyslexic", ${SISTEM_YAZI}`;
export const MONO = 'Consolas, "DejaVu Sans Mono", "Courier New", monospace';

// Arayuz (dugme, etiket, tablo): sabit genislikli yerlesimler, her zaman sistem yazi tipi
export const YAZI = SISTEM_YAZI;
// Uzun okuma metinleri (yonerge, konusmalar, altyazi, defter): satir kaydirdigi icin disleksi
// yazi tipine uyum saglar. OpenDyslexic genis oldugundan boyut kuculur. Canli baglama: ayar degisince sahne yeniden kurulur
export let OKUMA = SISTEM_YAZI;
export let OKUMA_OLCEK = 1;
export const okumaBoyutu = (px) => `${Math.round(px * OKUMA_OLCEK)}px`;

export function yaziTipiAyarla(tur = ayarlar.yaziTipi) {
  const disleksi = tur === 'disleksi';
  OKUMA = disleksi ? DISLEKSI_YAZI : SISTEM_YAZI;
  OKUMA_OLCEK = disleksi ? 0.86 : 1;
  if (typeof document !== 'undefined' && document.body) document.body.classList.toggle('disleksi', disleksi);
}

// Tuval yazi tipi yuklenmeden cizilirse yedek yazi tipiyle kalir: once yuklenir
export function yaziTipiYukle(tur = ayarlar.yaziTipi) {
  yaziTipiAyarla(tur);
  if (tur !== 'disleksi' || typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return Promise.all(['400 20px "OpenDyslexic"', '700 20px "OpenDyslexic"'].map((f) => document.fonts.load(f, 'ğışİ'))).catch(() => {});
}

yaziTipiAyarla();

// Basliklarda harf araligi: harflerin arasina ince bosluk koyar
export const aralikli = (metin) => metin.split('').join(' ');
