// Kodla cizim yardimcilari. Durgun gorseller bir kez cizilip dokuya donusturulur (CLAUDE.md §10.6)

export function dokuCiz(sahne, anahtar, genislik, yukseklik, ciz) {
  if (sahne.textures.exists(anahtar)) return anahtar;
  const doku = sahne.textures.createCanvas(anahtar, genislik, yukseklik);
  ciz(doku.getContext(), genislik, yukseklik);
  doku.refresh();
  return anahtar;
}

export function tuval(genislik, yukseklik) {
  const c = document.createElement('canvas');
  c.width = genislik;
  c.height = yukseklik;
  return c;
}

// Bir siluetin sekli korunarak boyanmis kopyasi; dolgu(ctx) bir renk ya da gradyan dondurur
export function boya(kaynak, dolgu) {
  const c = tuval(kaynak.width, kaynak.height);
  const x = c.getContext('2d');
  x.drawImage(kaynak, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = typeof dolgu === 'function' ? dolgu(x) : dolgu;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

// Merkezden disa sonen isik lekesi; renk 'r,g,b' biciminde
export function yumusakDaire(ctx, x, y, r, renk, alfa = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${renk},${alfa})`);
  g.addColorStop(0.4, `rgba(${renk},${alfa * 0.35})`);
  g.addColorStop(1, `rgba(${renk},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Eski tarayicilarda ctx.roundRect yok
export function yuvarlakDikdortgen(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function poligon(ctx, noktalar, dolgu) {
  ctx.beginPath();
  ctx.moveTo(noktalar[0][0], noktalar[0][1]);
  for (let i = 1; i < noktalar.length; i++) ctx.lineTo(noktalar[i][0], noktalar[i][1]);
  ctx.closePath();
  if (dolgu) {
    ctx.fillStyle = dolgu;
    ctx.fill();
  }
}
