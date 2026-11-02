// Vektor matematigi: saf fonksiyonlar, oyun motorundan bagimsiz (tests/VectorMath.test.js).
// Vektor = [x, y]; y yukari pozitif (fizik koordinatlari, ekran degil). Acilar derece, +x ekseninden saat yonunun tersine.

export const vektor = (x, y) => [x, y];
export const topla = (...vektorler) => vektorler.reduce(([ax, ay], [bx, by]) => [ax + bx, ay + by], [0, 0]);
export const cikar = ([ax, ay], [bx, by]) => [ax - bx, ay - by];
export const olcekle = ([x, y], k) => [x * k, y * k];
export const ters = (v) => olcekle(v, -1);
export const buyukluk = ([x, y]) => Math.hypot(x, y);
export const skalerCarpim = ([ax, ay], [bx, by]) => ax * bx + ay * by;

export function aci([x, y]) {
  const a = (Math.atan2(y, x) * 180) / Math.PI;
  return a < 0 ? a + 360 : a;
}

// Iki vektor arasindaki en kucuk aci (0-180)
export function aciFarki(a, b) {
  const d = Math.abs(aci(a) - aci(b)) % 360;
  return d > 180 ? 360 - d : d;
}

// Buyukluk ve acidan vektor; bilesenlere ayirma (zor mod: sin/cos)
export function kutupsal(buyuklukDegeri, aciDerece) {
  const r = (aciDerece * Math.PI) / 180;
  return [buyuklukDegeri * Math.cos(r), buyuklukDegeri * Math.sin(r)];
}
export const bilesenler = (buyuklukDegeri, aciDerece) => kutupsal(buyuklukDegeri, aciDerece);

// Bir vektorun bir dogrultu uzerindeki izdusum vektoru
export function izdusum(v, dogrultu) {
  const d2 = skalerCarpim(dogrultu, dogrultu);
  return d2 === 0 ? [0, 0] : olcekle(dogrultu, skalerCarpim(v, dogrultu) / d2);
}

export const esitMi = ([ax, ay], [bx, by], tolerans = 1e-9) => Math.abs(ax - bx) <= tolerans && Math.abs(ay - by) <= tolerans;
export const ayniYonlu = (a, b, toleransDerece = 0.5) => buyukluk(a) > 0 && buyukluk(b) > 0 && aciFarki(a, b) <= toleransDerece;
export const zitYonlu = (a, b, toleransDerece = 0.5) => buyukluk(a) > 0 && buyukluk(b) > 0 && aciFarki(a, b) >= 180 - toleransDerece;

// Izgaraya oturtma: adim 1 ise tam sayilara, 0.5 ise yarimlara
export const izgarayaOturt = ([x, y], adim = 1) => [Math.round(x / adim) * adim, Math.round(y / adim) * adim];

// Ekranda gosterim: en fazla bir ondalik, Turkce ondalik virgulu
export function yaz(sayi, ondalik = 1) {
  const k = 10 ** ondalik;
  const r = Math.round(sayi * k) / k;
  return (Object.is(r, -0) ? 0 : r).toString().replace('.', ',');
}
