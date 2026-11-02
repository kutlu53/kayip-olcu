// Pedagojik renkler: oynanista YALNIZCA vektorler icin kullanilir (CLAUDE.md §10.5)
export const PEDAGOJIK = {
  skaler: 0xe6e8eb,
  vektor: 0xf28c28,
  bileske: 0x2f7de1,
  bilesen: 0x3bb273
};

// Ortam paleti: arka planlar, karakterler, arayuz
export const ORTAM = {
  uzaySiyahi: 0x05070d,
  geceLacivert: 0x0b1426,
  celik: 0x3a4656,
  panelGri: 0x8a96a6,
  argeCamgobegi: 0x5fe3e8,
  hologramBeyazi: 0xd8f6ff,
  acilKirmizi: 0xd64545,
  reaktorMoru: 0x8e6cf0,
  gunesBeyazi: 0xfff6e0
};

export const css = (renk) => '#' + renk.toString(16).padStart(6, '0');
