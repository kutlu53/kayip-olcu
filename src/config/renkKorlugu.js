// Renk korlugu benzetimi (Machado, Oliveira ve Fernandes 2009, tam siddet). Dogrusal RGB uzayinda uygulanir.
// Iki kullanim: tests/renkKorlugu.test.js pedagojik renklerin ayirt edilebilirligini denetler;
// ?renkKorlugu=protan|deutan|tritan oyunu o goruste gosterir (elle kontrol, CLAUDE.md §10.5)
export const MATRISLER = {
  protan: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deutan: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  tritan: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039]
};

const dogrusal = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const ayrik = (k) => [(k >> 16) & 255, (k >> 8) & 255, k & 255].map((c) => dogrusal(c / 255));

// Dogrusal RGB -> benzetilmis dogrusal RGB
export function benzet(renk, tur) {
  const [r, g, b] = ayrik(renk);
  const m = MATRISLER[tur];
  if (!m) return [r, g, b];
  const s = (v) => Math.min(1, Math.max(0, v));
  return [s(m[0] * r + m[1] * g + m[2] * b), s(m[3] * r + m[4] * g + m[5] * b), s(m[6] * r + m[7] * g + m[8] * b)];
}

// Dogrusal RGB -> CIE Lab (D65)
function lab([r, g, b]) {
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

// Iki rengin benzetilmis gorunumdeki farki (CIE76 ΔE). ~10 alti: yan yana bile zor ayirt edilir
export function renkFarki(a, b, tur = null) {
  const [l1, a1, b1] = lab(benzet(a, tur));
  const [l2, a2, b2] = lab(benzet(b, tur));
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

// ?renkKorlugu=... : tuvale SVG renk matrisi suzgeci (feColorMatrix varsayilan olarak dogrusal RGB'de calisir)
export function renkKorluguSuzgeci(tur, hedef) {
  const m = MATRISLER[tur];
  if (!m || typeof document === 'undefined') return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  const filtre = document.createElementNS(ns, 'filter');
  filtre.id = 'renkKorlugu';
  const matris = document.createElementNS(ns, 'feColorMatrix');
  matris.setAttribute('type', 'matrix');
  matris.setAttribute('values', `${m.slice(0, 3).join(' ')} 0 0 ${m.slice(3, 6).join(' ')} 0 0 ${m.slice(6, 9).join(' ')} 0 0 0 0 0 1 0`);
  filtre.appendChild(matris);
  svg.appendChild(filtre);
  document.body.appendChild(svg);
  hedef.style.filter = 'url(#renkKorlugu)';
}
