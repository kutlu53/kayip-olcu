// Tohumlu rastgele sayi ureteci (mulberry32): her acilista ayni goruntu
export function rastgele(tohum = 1) {
  let a = tohum >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Normal dagilim (ortalama 0, sapma 1)
export function gauss(r) {
  const u = Math.max(r(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

export function cokgenIcinde(x, y, cokgen) {
  let icinde = false;
  for (let i = 0, j = cokgen.length - 1; i < cokgen.length; j = i++) {
    const [xi, yi] = cokgen[i];
    const [xj, yj] = cokgen[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) icinde = !icinde;
  }
  return icinde;
}

// Ogrenciye karisik sira; ?sabit=1 ile sabit sira (otomatik test ve sunum)
const SABIT = typeof location !== 'undefined' && new URLSearchParams(location.search).get('sabit') === '1';
export function karistir(dizi) {
  if (SABIT) return [...dizi];
  return dizi.map((d) => [Math.random(), d]).sort((a, b) => a[0] - b[0]).map((d) => d[1]);
}
