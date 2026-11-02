import Phaser from 'phaser';
import { dokuCiz, yumusakDaire } from './Tuval.js';
import { rastgele, gauss, cokgenIcinde } from './Rastgele.js';

// Alcak yorungeden (~400 km) gece tarafi: kadraji kaplayan kavisli ufuk, sehir isiklari, atmosfer.
// Kiyi cizgileri yaklasiktir: [boylam, enlem]

const DENIZLER = [
  // Karadeniz
  [[27.9, 42.3], [28.0, 41.6], [29.1, 41.25], [30.3, 41.2], [31.4, 41.3], [32.3, 41.75], [33.3, 42.0], [35.1, 42.05],
    [35.5, 41.6], [36.3, 41.3], [37.5, 41.05], [38.4, 40.95], [39.7, 41.0], [40.6, 41.2], [41.5, 41.5], [41.6, 42.6],
    [40.2, 43.3], [39.0, 44.0], [37.8, 44.7], [36.6, 45.3], [35.5, 45.1], [34.5, 44.5], [33.5, 44.5], [32.6, 45.4],
    [33.4, 45.9], [31.8, 46.4], [30.8, 46.5], [30.2, 45.8], [29.7, 45.2], [28.7, 44.3], [28.6, 43.4], [27.9, 42.8]],
  // Marmara
  [[26.7, 40.4], [27.3, 40.6], [27.6, 40.95], [28.6, 41.02], [29.0, 41.0], [29.4, 40.8], [29.0, 40.4], [28.0, 40.35],
    [27.4, 40.35], [26.9, 40.3]],
  // Akdeniz, Ege, Iyon ve Tiren
  [[36.0, 35.9], [35.8, 36.7], [34.6, 36.8], [33.9, 36.3], [33.0, 36.1], [32.5, 36.1], [31.6, 36.6], [30.6, 36.8],
    [30.4, 36.3], [29.6, 36.2], [29.1, 36.6], [28.2, 36.7], [27.6, 36.7], [27.3, 37.0], [27.2, 37.5], [26.4, 38.25],
    [26.9, 38.7], [26.7, 39.3], [26.1, 39.5], [26.2, 40.0], [25.9, 40.8], [25.0, 40.95], [24.0, 40.75], [22.9, 40.6],
    [22.6, 40.1], [23.3, 39.2], [22.9, 38.8], [24.0, 38.2], [23.1, 37.8], [22.9, 37.5], [22.5, 36.5], [21.7, 36.8],
    [21.6, 37.6], [21.1, 37.9], [21.2, 38.4], [20.7, 39.0], [20.0, 39.7], [19.4, 40.4], [18.5, 40.2], [17.0, 39.0],
    [16.5, 38.0], [15.65, 38.0], [16.0, 39.2], [15.6, 40.1], [14.3, 40.8], [13.0, 41.3], [12.2, 41.8], [11.0, 42.5],
    [10.4, 43.6], [8.8, 44.4], [7.0, 43.6], [5.0, 43.3], [3.0, 42.0], [0.5, 40.0], [0.0, 38.5], [0.0, 35.8],
    [5.0, 36.8], [9.5, 37.2], [11.0, 37.0], [10.5, 35.5], [10.5, 34.5], [11.5, 33.2], [13.2, 32.9], [15.5, 31.5],
    [19.0, 30.3], [20.1, 32.1], [22.0, 32.9], [25.0, 31.7], [29.9, 31.2], [32.3, 31.2], [34.2, 31.3], [34.9, 32.8],
    [35.5, 33.9], [35.9, 35.0]],
  // Adriyatik
  [[18.5, 40.2], [19.4, 40.5], [19.5, 41.8], [18.5, 42.5], [16.0, 43.5], [14.5, 45.3], [13.6, 45.7], [12.3, 45.3],
    [12.4, 44.2], [13.6, 43.5], [14.2, 42.4], [16.0, 41.4], [17.2, 40.9]],
  // Hazar
  [[47.5, 45.7], [46.7, 44.5], [47.5, 43.0], [48.5, 41.9], [49.5, 40.3], [49.0, 38.9], [48.9, 38.4], [49.5, 37.5],
    [50.5, 37.0], [53.0, 36.9], [54.0, 37.5], [53.0, 40.0], [52.8, 41.5], [53.0, 44.0], [51.3, 45.2], [49.5, 46.5]],
  // Van Golu
  [[42.3, 38.5], [43.0, 38.9], [43.6, 38.6], [43.2, 38.3], [42.5, 38.3]]
];

const ADALAR = [
  [[32.3, 35.0], [33.0, 35.4], [34.0, 35.5], [34.6, 35.7], [33.9, 35.25], [34.0, 34.95], [33.0, 34.6], [32.4, 34.75]],
  [[23.5, 35.5], [24.5, 35.4], [26.3, 35.3], [26.0, 35.0], [24.7, 34.9], [23.5, 35.2]],
  [[12.4, 37.8], [13.4, 38.2], [15.6, 38.3], [15.1, 37.0], [14.3, 36.7], [12.5, 37.6]]
];

const TURKIYE = [
  [26.0, 40.6], [26.35, 41.75], [27.6, 42.0], [28.0, 41.95], [29.1, 41.25], [30.3, 41.2], [31.4, 41.3], [32.3, 41.75],
  [33.3, 42.0], [35.1, 42.05], [35.5, 41.6], [36.3, 41.3], [37.5, 41.05], [38.4, 40.95], [39.7, 41.0], [40.6, 41.2],
  [41.5, 41.5], [42.6, 41.5], [43.4, 41.1], [43.6, 40.5], [44.8, 39.7], [44.3, 39.0], [44.4, 38.3], [44.2, 37.2],
  [43.0, 37.3], [42.4, 37.1], [41.2, 37.1], [40.0, 36.8], [38.7, 36.7], [38.0, 36.85], [36.7, 36.8], [36.5, 36.2],
  [36.0, 35.9], [35.8, 36.7], [34.6, 36.8], [33.9, 36.3], [33.0, 36.1], [32.5, 36.1], [31.6, 36.6], [30.6, 36.8],
  [30.4, 36.3], [29.6, 36.2], [29.1, 36.6], [28.2, 36.7], [27.6, 36.7], [27.3, 37.0], [27.2, 37.5], [26.4, 38.25],
  [26.9, 38.7], [26.7, 39.3], [26.1, 39.5], [26.2, 40.0]
];

// [boylam, enlem, buyukluk 0-1]
const SEHIRLER = [
  [29.0, 41.05, 1.0], [32.85, 39.93, 0.6], [27.14, 38.42, 0.55], [29.06, 40.18, 0.42], [29.9, 40.77, 0.35],
  [35.32, 37.0, 0.4], [30.7, 36.9, 0.35], [37.38, 37.07, 0.35], [32.48, 37.87, 0.3], [34.64, 36.8, 0.3],
  [35.48, 38.73, 0.25], [40.2, 37.9, 0.25], [36.33, 41.29, 0.2], [39.72, 41.0, 0.2], [30.52, 39.78, 0.2],
  [30.4, 40.75, 0.2], [36.16, 36.2, 0.2], [38.8, 37.16, 0.2], [41.27, 39.9, 0.15], [43.4, 38.5, 0.15],
  [38.3, 38.35, 0.15], [29.09, 37.78, 0.15], [27.43, 38.6, 0.15], [36.93, 37.58, 0.15], [37.0, 39.75, 0.12],
  [39.2, 38.67, 0.12], [27.84, 37.85, 0.12], [26.56, 41.68, 0.1], [26.4, 40.15, 0.1], [31.8, 41.45, 0.1],
  [27.4, 37.03, 0.1], [41.13, 37.88, 0.1], [33.36, 35.18, 0.15]
];

const KOMSU_SEHIRLER = [
  [23.7, 37.98, 0.5], [22.9, 40.6, 0.3], [23.3, 42.7, 0.3], [26.1, 44.4, 0.4], [20.5, 44.8, 0.3], [19.0, 47.5, 0.4],
  [16.4, 48.2, 0.35], [21.4, 42.0, 0.15], [19.8, 41.3, 0.15], [28.8, 47.0, 0.15], [30.7, 46.5, 0.25], [30.5, 50.45, 0.5],
  [36.2, 50.0, 0.3], [39.7, 47.2, 0.3], [39.0, 45.0, 0.2], [33.5, 44.6, 0.15], [34.1, 44.95, 0.12], [44.5, 48.7, 0.25],
  [44.8, 41.7, 0.2], [44.5, 40.2, 0.2], [49.9, 40.4, 0.3], [46.3, 38.1, 0.2], [51.4, 35.7, 0.6], [44.4, 33.3, 0.45],
  [43.1, 36.3, 0.2], [44.0, 36.2, 0.15], [37.16, 36.2, 0.3], [36.3, 33.5, 0.3], [35.5, 33.9, 0.25], [34.8, 32.1, 0.35],
  [35.9, 31.95, 0.25], [29.9, 31.2, 0.35], [31.2, 30.05, 0.7], [16.9, 41.1, 0.2], [14.3, 40.85, 0.35],
  [12.5, 41.9, 0.4], [15.1, 37.5, 0.15], [13.4, 38.1, 0.15], [10.2, 36.8, 0.25], [13.2, 32.9, 0.2], [20.1, 32.1, 0.12]
];

// Gece aydinlatilmis otoyollar
const YOLLAR = [
  [[29.0, 41.05], [29.9, 40.77], [30.4, 40.75], [31.6, 40.73], [32.85, 39.93]],
  [[32.85, 39.93], [32.48, 37.87]],
  [[32.85, 39.93], [35.48, 38.73]],
  [[27.14, 38.42], [27.43, 38.6], [29.06, 40.18], [29.9, 40.77]],
  [[34.64, 36.8], [35.32, 37.0], [37.38, 37.07], [38.8, 37.16]],
  [[29.0, 41.05], [26.56, 41.68]]
];

const ISIK_RENKLERI = ['255,214,140', '255,190,110', '255,236,190'];

export function dunyaDokusu(sahne, ayar = {}) {
  const ufukY = ayar.ufukY || 410;
  const safak = ayar.safak || 'sag';
  return dokuCiz(sahne, `dunya_${ufukY}_${safak}`, 1700, 1000, (ctx, W, H) => ciz(ctx, W, H, ufukY, safak));
}

function ciz(ctx, W, H, ufukY, safak) {
  const R = 3400;
  const cx = W / 2;
  const cy = ufukY + R;
  const LON0 = 35, LAT_UST = 50, LAT_ALT = 29, OLCEK = 50, DERIN = 600, US = 1.4;
  const ufuk = (x) => cy - Math.sqrt(Math.max(0, R * R - (x - cx) * (x - cx)));

  // Ufka dogru bakis: kuzey enlemleri ufukta sikisir, genislik de daralir
  const izd = (lon, lat) => {
    const t = (LAT_UST - lat) / (LAT_UST - LAT_ALT);
    const tt = Math.max(t, 0);
    const x = cx + (lon - LON0) * OLCEK * (0.4 + 0.6 * tt);
    return [x, ufuk(x) + DERIN * Math.pow(tt, US) + (t < 0 ? t * 60 : 0), tt];
  };
  const cokgenYolu = (cokgen) => {
    ctx.beginPath();
    cokgen.forEach(([lon, lat], i) => {
      const [x, y] = izd(lon, lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  };
  const r = rastgele(11);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  // Gezegen govdesi (ay isiginda soluk)
  const g = ctx.createLinearGradient(0, ufukY, 0, H);
  g.addColorStop(0, '#13223a');
  g.addColorStop(0.06, '#0a1528');
  g.addColorStop(1, '#03070e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Kiyilar yumusak: gece yorungeden kara-deniz siniri keskin gorunmez
  ctx.filter = 'blur(5px)';
  ctx.fillStyle = 'rgba(0,2,8,0.4)';
  for (const d of DENIZLER) {
    cokgenYolu(d);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(9,17,30,0.6)';
  for (const a of ADALAR) {
    cokgenYolu(a);
    ctx.fill();
  }
  ctx.filter = 'none';

  // Ay isiginda bulutlar
  for (let i = 0; i < 170; i++) {
    const [x, y, t] = izd(12 + r() * 44, LAT_ALT + r() * (LAT_UST - LAT_ALT));
    const w = (40 + r() * 170) * (0.4 + 0.6 * t);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.12 + 0.25 * t);
    yumusakDaire(ctx, 0, 0, w, '150,170,200', 0.05);
    ctx.restore();
  }

  // Sehir isiklari
  ctx.globalCompositeOperation = 'lighter';
  const isik = (lon, lat, boy, alfa) => {
    const [x, y, t] = izd(lon, lat);
    const s = boy * (0.45 + 0.65 * t);
    ctx.globalAlpha = alfa;
    ctx.fillStyle = `rgb(${ISIK_RENKLERI[(r() * 3) | 0]})`;
    ctx.fillRect(x - s, y - s * 0.6, s * 2, s * 1.2);
  };
  const sehir = ([lon, lat, w], kat) => {
    const n = Math.round((25 + w * 320) * kat);
    const sapma = 0.06 + w * 0.2;
    for (let i = 0; i < n; i++) isik(lon + gauss(r) * sapma * 1.3, lat + gauss(r) * sapma, 0.5 + r() * 0.9, 0.25 + r() * 0.6);
    const [x, y, t] = izd(lon, lat);
    ctx.globalAlpha = 1;
    yumusakDaire(ctx, x, y, (8 + w * 34) * (0.4 + 0.6 * t), '255,190,110', (0.2 + 0.3 * w) * kat);
  };
  const denizde = (lon, lat) => DENIZLER.some((d) => cokgenIcinde(lon, lat, d)) && !ADALAR.some((a) => cokgenIcinde(lon, lat, a));

  // Anadolu'daki kasabalar
  for (let i = 0; i < 1300; i++) {
    const lon = 26 + r() * 19, lat = 36 + r() * 6.1;
    if (!cokgenIcinde(lon, lat, TURKIYE) || denizde(lon, lat)) continue;
    for (let j = 0; j < 1 + r() * 3; j++) isik(lon + gauss(r) * 0.04, lat + gauss(r) * 0.03, 0.4 + r() * 0.6, 0.2 + r() * 0.45);
  }
  // Diger karalarda daha seyrek kasabalar
  for (let i = 0; i < 1600; i++) {
    const lon = 8 + r() * 46, lat = LAT_ALT + r() * (LAT_UST + 2 - LAT_ALT);
    if (denizde(lon, lat) || cokgenIcinde(lon, lat, TURKIYE)) continue;
    isik(lon, lat, 0.35 + r() * 0.5, 0.12 + r() * 0.3);
  }
  for (const yol of YOLLAR) {
    for (let i = 0; i < yol.length - 1; i++) {
      for (let s = 0; s < 30; s++) {
        const u = s / 30;
        isik(yol[i][0] + (yol[i + 1][0] - yol[i][0]) * u + gauss(r) * 0.03, yol[i][1] + (yol[i + 1][1] - yol[i][1]) * u + gauss(r) * 0.02, 0.45, 0.22);
      }
    }
  }
  for (const s of SEHIRLER) sehir(s, 1);
  for (const s of KOMSU_SEHIRLER) sehir(s, 0.6);
  ctx.globalAlpha = 1;

  // Safak tarafinda yuzeyin soluk aydinlanmasi
  if (safak) {
    const ex = safak === 'sag' ? W : 0;
    const rg = ctx.createRadialGradient(ex, ufuk(ex) + 40, 0, ex, ufuk(ex) + 40, 700);
    rg.addColorStop(0, 'rgba(70,110,170,0.25)');
    rg.addColorStop(1, 'rgba(70,110,170,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();

  // Atmosfer: ince mavi kenar ve ~100 km'deki yesilimsi hava isimasi (airglow)
  ctx.globalCompositeOperation = 'lighter';
  const yay = (dr, kalinlik, stil) => {
    ctx.beginPath();
    ctx.arc(cx, cy, R + dr, Math.PI, 2 * Math.PI);
    ctx.lineWidth = kalinlik;
    ctx.strokeStyle = stil;
    ctx.stroke();
  };
  yay(10, 30, 'rgba(60,120,220,0.05)');
  yay(5, 12, 'rgba(70,140,240,0.1)');
  yay(2, 4, 'rgba(110,170,255,0.25)');
  yay(14, 2, 'rgba(120,255,170,0.16)');

  if (safak) {
    const sag = safak === 'sag';
    const gradyan = (renk, a) => {
      const gr = ctx.createLinearGradient(sag ? cx * 0.9 : W - cx * 0.9, 0, sag ? W : 0, 0);
      gr.addColorStop(0, `rgba(${renk},0)`);
      gr.addColorStop(0.7, `rgba(${renk},${a * 0.35})`);
      gr.addColorStop(1, `rgba(${renk},${a})`);
      return gr;
    };
    // Gun dogumunda atmosfer katmanlari: altta kizil, ustte mavi
    yay(1, 5, gradyan('255,120,50', 0.9));
    yay(5, 10, gradyan('255,190,120', 0.5));
    yay(11, 22, gradyan('110,170,255', 0.55));
    yay(20, 50, gradyan('80,130,255', 0.18));
    const ex = sag ? W : 0;
    const ey = ufuk(ex);
    const rg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 600);
    rg.addColorStop(0, 'rgba(120,170,255,0.3)');
    rg.addColorStop(1, 'rgba(120,170,255,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalCompositeOperation = 'source-over';
}

// Kutup isiklari: ust atmosferde, kuzey ufkunda; yorungeden bakinca ufkun hemen ustunde ve altinda
export function auroraDokusu(sahne) {
  return dokuCiz(sahne, 'aurora', 1400, 300, (ctx, W) => {
    const r = rastgele(5);
    ctx.globalCompositeOperation = 'lighter';
    for (let x = 0; x < W; x += 2) {
      const zarf = Math.pow(Math.sin((Math.PI * x) / W), 1.5) * (0.55 + 0.45 * Math.sin(x / 170 + 1.3));
      const taban = 230 + 18 * Math.sin(x / 140) + 9 * Math.sin(x / 47 + 2);
      const h = (70 + 130 * r()) * (0.6 + 0.4 * zarf);
      const g = ctx.createLinearGradient(0, taban, 0, taban - h);
      g.addColorStop(0, `rgba(170,255,200,${0.9 * zarf})`);
      g.addColorStop(0.15, `rgba(90,240,150,${0.6 * zarf})`);
      g.addColorStop(0.7, `rgba(210,80,150,${0.2 * zarf})`);
      g.addColorStop(1, 'rgba(200,80,140,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, taban - h, 2, h + 6);
    }
  });
}

export function auroraOlustur(sahne) {
  const ADD = Phaser.BlendModes.ADD;
  const kap = sahne.add.container(0, 0);
  const a1 = sahne.add.image(0, 0, auroraDokusu(sahne)).setBlendMode(ADD);
  const a2 = sahne.add.image(0, 0, 'aurora').setBlendMode(ADD).setFlipX(true).setAlpha(0.5);
  kap.add([a1, a2]);
  kap.guncelle = (zaman) => {
    const t = zaman / 1000;
    a1.x = Math.sin(t * 0.13) * 30;
    a2.x = -Math.sin(t * 0.09 + 1) * 45;
    a1.alpha = 0.75 + 0.2 * Math.sin(t * 0.8);
    a2.alpha = 0.45 + 0.2 * Math.sin(t * 0.6 + 2);
  };
  kap.olay = (ad) => {
    if (ad === 'baslat') sahne.tweens.add({ targets: kap, alpha: 1, duration: 3000 });
  };
  return kap;
}
