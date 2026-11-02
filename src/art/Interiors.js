import Phaser from 'phaser';
import { dokuCiz, yumusakDaire, yuvarlakDikdortgen, poligon } from './Tuval.js';
import { rastgele } from './Rastgele.js';
import { titreme } from '../fx/Transitions.js';
import { kivilcimYayici } from '../fx/Particles.js';
import { MONO } from '../ui/tipografi.js';

// ---------- Kontrol odasi (perspektif: kacis noktasi arka duvarin ortasinda) ----------
const W = 1440, H = 810;
const X1 = 430, X2 = 1010, Y1 = 235, Y2 = 555;
const PENCERE = [500, 270, 440, 230, 28];
const FENER = [330, 215];
const LEDLER = ['#3fd17a', '#e3b341', '#e05555', '#5fb7e8'];
const solSerit = [[424, 0], [522, 0], [640, 235], [600, 235]];
const sagSerit = [[918, 0], [1016, 0], [840, 235], [800, 235]];

const solX = (f) => X1 * f;
const sagX = (f) => W - (W - X2) * f;
const duvarY = (f, v) => Y1 * f + (H + (Y2 - H) * f - Y1 * f) * v;
const yerel = (x, y) => [x - W / 2, y - H / 2];

function pencereyiDel(ctx) {
  ctx.globalCompositeOperation = 'destination-out';
  yuvarlakDikdortgen(ctx, ...PENCERE);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

function yatayGradyan(ctx, xa, xb, a, b) {
  const g = ctx.createLinearGradient(xa, 0, xb, 0);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}
function dikeyGradyan(ctx, ya, yb, a, b) {
  const g = ctx.createLinearGradient(0, ya, 0, yb);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}

export function kontrolOdasiDokusu(sahne) {
  odaIsikDokusu(sahne);
  odaMaskeDokusu(sahne);
  nesneDokulari(sahne);
  isikKonisiDokusu(sahne);
  return dokuCiz(sahne, 'oda_kontrol', W, H, (ctx) => {
    const r = rastgele(3);
    poligon(ctx, [[0, 0], [W, 0], [X2, Y1], [X1, Y1]], dikeyGradyan(ctx, 0, Y1, '#0d131d', '#1b2533'));
    poligon(ctx, [[0, H], [W, H], [X2, Y2], [X1, Y2]], dikeyGradyan(ctx, H, Y2, '#090e15', '#172030'));
    poligon(ctx, [[0, 0], [X1, Y1], [X1, Y2], [0, H]], yatayGradyan(ctx, 0, X1, '#0b1119', '#1e2938'));
    poligon(ctx, [[W, 0], [X2, Y1], [X2, Y2], [W, H]], yatayGradyan(ctx, W, X2, '#0b1119', '#1e2938'));
    ctx.fillStyle = '#1a2330';
    ctx.fillRect(X1, Y1, X2 - X1, Y2 - Y1);

    // Duvar raflari (uzay istasyonlarindaki deney ve sistem kabinleri)
    const BANT = [0, 0.2, 0.38, 0.53, 0.65, 0.75, 0.83, 0.9, 0.95];
    for (const X of [solX, sagX]) {
      for (let i = 0; i < BANT.length - 1; i++) {
        const fa = BANT[i] + 0.008, fb = BANT[i + 1] - 0.008;
        for (const [v0, v1] of [[0.1, 0.46], [0.54, 0.88]]) {
          const q = [[X(fa), duvarY(fa, v0)], [X(fb), duvarY(fb, v0)], [X(fb), duvarY(fb, v1)], [X(fa), duvarY(fa, v1)]];
          const ton = 22 + ((i * 3 + v0 * 10) % 4) * 3;
          poligon(ctx, q, `rgb(${ton - 6},${ton + 2},${ton + 14})`);
          ctx.strokeStyle = 'rgba(0,0,0,0.55)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.strokeStyle = 'rgba(170,200,230,0.12)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(q[0][0], q[0][1]);
          ctx.lineTo(q[1][0], q[1][1]);
          ctx.stroke();
          const fm = (fa + fb) / 2;
          const boy = 4 * (1 - fm * 0.75);
          for (let j = 0; j < 4; j++) {
            if (r() < 0.45) continue;
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = LEDLER[(r() * LEDLER.length) | 0];
            ctx.fillRect(X(fa + (fb - fa) * (0.15 + j * 0.18)), duvarY(fm, v0 + 0.06), boy, boy);
            ctx.globalAlpha = 1;
          }
          ctx.fillStyle = 'rgba(200,210,225,0.12)';
          ctx.fillRect(X(fa + (fb - fa) * 0.15), duvarY(fm, v1 - 0.1), (X(fb) - X(fa)) * 0.5, boy * 0.8);
        }
      }
      // Tutunma rayi
      const yA = duvarY(0, 0.5), yB = duvarY(1, 0.5);
      const xA = X(0), xB = X(1);
      poligon(ctx, [[xA, yA - 6], [xB, yB - 1.5], [xB, yB + 1.5], [xA, yA + 6]], '#5d6878');
      ctx.strokeStyle = 'rgba(200,215,235,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xA, yA - 5);
      ctx.lineTo(xB, yB - 1.2);
      ctx.stroke();
    }

    // Tavan isik seritleri (sonukken)
    poligon(ctx, solSerit, '#253040');
    poligon(ctx, sagSerit, '#253040');
    // Acil durum lambasi
    ctx.fillStyle = '#3a1416';
    ctx.beginPath();
    ctx.arc(FENER[0], FENER[1], 11, 0, Math.PI * 2);
    ctx.fill();

    // Arka duvar paneli ve pencere
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(X1 + 20, Y1 + 15, X2 - X1 - 40, Y2 - Y1 - 30);
    pencereyiDel(ctx);
    yuvarlakDikdortgen(ctx, ...PENCERE);
    ctx.strokeStyle = '#2b3542';
    ctx.lineWidth = 16;
    ctx.stroke();
    yuvarlakDikdortgen(ctx, PENCERE[0] + 8, PENCERE[1] + 8, PENCERE[2] - 16, PENCERE[3] - 16, 22);
    ctx.strokeStyle = 'rgba(150,185,225,0.28)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // On konsol
    poligon(ctx, [[0, H], [0, 610], [230, 560], [1210, 560], [1440, 610], [1440, H]], dikeyGradyan(ctx, 560, H, '#141c27', '#05080d'));
    ctx.strokeStyle = 'rgba(150,180,210,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 610);
    ctx.lineTo(230, 560);
    ctx.lineTo(1210, 560);
    ctx.lineTo(1440, 610);
    ctx.stroke();
    for (const [x, y] of [[170, 470], [1040, 470]]) {
      ctx.fillStyle = '#0a0e14';
      yuvarlakDikdortgen(ctx, x - 8, y - 8, 246, 121, 8);
      ctx.fill();
      ctx.strokeStyle = '#2f3a48';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#04080d';
      ctx.fillRect(x, y, 230, 105);
    }
    // ARGE projektoru
    ctx.fillStyle = '#1d2633';
    ctx.beginPath();
    ctx.ellipse(720, 570, 62, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(95,227,232,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function odaIsikDokusu(sahne) {
  return dokuCiz(sahne, 'oda_isik', W, H, (ctx) => {
    ctx.shadowColor = 'rgba(190,225,255,1)';
    ctx.shadowBlur = 40;
    poligon(ctx, solSerit, 'rgba(235,246,255,0.95)');
    poligon(ctx, sagSerit, 'rgba(235,246,255,0.95)');
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'lighter';
    yumusakDaire(ctx, 470, 60, 520, '150,190,240', 0.22);
    yumusakDaire(ctx, 970, 60, 520, '150,190,240', 0.22);
    yumusakDaire(ctx, 720, 400, 380, '140,180,230', 0.12);
    yumusakDaire(ctx, 720, 760, 600, '120,150,200', 0.08);
    pencereyiDel(ctx);
  });
}

// Pencere disinda kalan oda yuzeyi: karartma ve kirmizi isik yalnizca odaya uygulanir
function odaMaskeDokusu(sahne) {
  return dokuCiz(sahne, 'oda_maske', W, H, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    pencereyiDel(ctx);
  });
}

function isikKonisiDokusu(sahne) {
  return dokuCiz(sahne, 'isik_konisi', 700, 300, (ctx) => {
    const g = ctx.createRadialGradient(0, 150, 0, 0, 150, 700);
    g.addColorStop(0, 'rgba(255,80,70,0.5)');
    g.addColorStop(1, 'rgba(255,80,70,0)');
    poligon(ctx, [[0, 140], [700, 0], [700, 300], [0, 160]], g);
  });
}

function nesneDokulari(sahne) {
  dokuCiz(sahne, 'n_tablet', 64, 44, (c) => {
    c.fillStyle = '#161b22';
    yuvarlakDikdortgen(c, 1, 1, 62, 42, 6);
    c.fill();
    c.fillStyle = '#22384e';
    yuvarlakDikdortgen(c, 6, 5, 52, 34, 3);
    c.fill();
    c.fillStyle = 'rgba(95,227,232,0.35)';
    c.fillRect(10, 10, 30, 3);
    c.fillRect(10, 17, 22, 3);
  });
  dokuCiz(sahne, 'n_kalem', 48, 6, (c) => {
    c.fillStyle = '#c4ccd6';
    yuvarlakDikdortgen(c, 0, 0, 40, 6, 3);
    c.fill();
    c.fillStyle = '#39424e';
    c.fillRect(36, 1, 12, 4);
  });
  // Icecek posedi (istasyonda bardak kullanilmaz)
  dokuCiz(sahne, 'n_poset', 30, 44, (c) => {
    c.fillStyle = '#a9b3bf';
    yuvarlakDikdortgen(c, 2, 8, 26, 34, 5);
    c.fill();
    c.fillStyle = '#e6e8eb';
    c.fillRect(6, 18, 18, 8);
    c.strokeStyle = '#d8dde3';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(15, 8);
    c.lineTo(15, 0);
    c.stroke();
  });
  dokuCiz(sahne, 'n_vida', 16, 8, (c) => {
    c.fillStyle = '#8a96a6';
    c.fillRect(0, 2, 11, 4);
    c.fillRect(10, 0, 6, 8);
  });
  dokuCiz(sahne, 'n_kagit', 40, 52, (c) => {
    c.fillStyle = '#d9dde2';
    c.fillRect(0, 0, 40, 52);
    c.fillStyle = 'rgba(60,70,90,0.35)';
    for (let y = 8; y < 48; y += 6) c.fillRect(5, y, 30, 1.5);
  });
}

const EKRAN_NORMAL = ['ALT.    412,6 km\nSÜRAT   7,66 km/s\nGÜÇ     %98\nARGE    ÇEVRİMİÇİ', 'GÜNEŞ ETKİNLİĞİ\n▁▂▃▂▁▂▃▂▁▂\nUYARI KANALI: AÇIK\nMÜRETTEBAT: UYKU'];
const EKRAN_BOZUK = ['ALT.    412,6 ??\nSÜRAT   7,66 ??/??\nGÜÇ     %??\nARGE    ?????', 'BİRİM TABLOSU\nOKUNAMIYOR\n▒▒▒▒▒▒▒▒▒▒\nYÖN: TANIMSIZ'];

export function kontrolOdasiOlustur(sahne) {
  const ADD = Phaser.BlendModes.ADD;
  const kap = sahne.add.container(0, 0);
  const taban = sahne.add.image(0, 0, kontrolOdasiDokusu(sahne));

  // Mikro yercekimi: sarsintidan sonra nesneler istasyona gore sabit hizla, duz cizgide suzulur
  const nesneler = [
    ['n_tablet', -330, -120, 14, -6, 0.25],
    ['n_kalem', 330, -160, -18, 8, -0.8],
    ['n_poset', 180, 40, -10, -12, 0.3],
    ['n_vida', -220, 10, 20, 4, 1.5],
    ['n_kagit', 380, -40, -6, 10, 0.15]
  ].map(([anahtar, x, y, vx, vy, w]) => ({ img: sahne.add.image(x, y, anahtar).setRotation(w), vx, vy, w }));

  const isik = sahne.add.image(0, 0, 'oda_isik').setBlendMode(ADD);
  const karanlik = sahne.add.image(0, 0, 'oda_maske').setTint(0x000000).setAlpha(0);
  const kirmizi = sahne.add.image(0, 0, 'oda_maske').setTint(0xd64545).setBlendMode(ADD).setAlpha(0);
  const [fx, fy] = yerel(...FENER);
  const fener = sahne.add.image(fx, fy, 'isik_konisi').setOrigin(0, 0.5).setBlendMode(ADD).setAlpha(0);
  const lamba = sahne.add.image(fx, fy, 'p_nokta').setTint(0xff5040).setBlendMode(ADD).setScale(1.6).setAlpha(0);
  const yaziStili = { fontFamily: MONO, fontSize: '15px', color: '#5FE3E8', lineSpacing: 6 };
  const ekranlar = [yerel(182, 480), yerel(1052, 480)].map(([x, y], i) => sahne.add.text(x, y, EKRAN_NORMAL[i], yaziStili));
  const [kx, ky] = yerel(300, 300);
  const kivilcim = kivilcimYayici(sahne, kx, ky);

  kap.add([taban, ...nesneler.map((n) => n.img), isik, karanlik, kirmizi, fener, lamba, ...ekranlar, kivilcim]);
  const durum = { karanlik: false, acil: false, suzulme: false };

  kap.guncelle = (zaman, delta) => {
    const dt = delta / 1000;
    const t = zaman / 1000;
    if (durum.suzulme) {
      for (const n of nesneler) {
        n.img.x += n.vx * dt;
        n.img.y += n.vy * dt;
        n.img.rotation += n.w * dt;
      }
    }
    if (durum.acil) {
      // Donen acil durum lambasi: tam tur ~2,6 sn (yavas, flas etkisi yok)
      fener.rotation = t * 2.4;
      kirmizi.alpha = 0.08 + 0.2 * Math.max(0, Math.cos(t * 2.4 - 0.6));
      lamba.alpha = 0.6 + 0.4 * Math.max(0, Math.cos(t * 2.4));
    }
  };

  kap.olay = (ad) => {
    if (ad !== 'karart' || durum.karanlik) return;
    durum.karanlik = true;
    durum.suzulme = true;
    sahne.tweens.add({ targets: isik, alpha: 0, duration: 900, ease: titreme });
    sahne.tweens.add({
      targets: karanlik,
      alpha: 0.62,
      duration: 900,
      ease: titreme,
      onComplete: () => {
        durum.acil = true;
        sahne.tweens.add({ targets: fener, alpha: 0.9, duration: 400 });
        // Pencere onundeki nesneler karartma maskesinin disinda kalir; kendileri kararir
        for (const n of nesneler) n.img.setTint(0x4a4650);
      }
    });
    sahne.time.delayedCall(350, () => ekranlar.forEach((e, i) => e.setText(EKRAN_BOZUK[i]).setColor('#ff6b6b')));
    kivilcim.explode(14);
    const kivilcimOlayi = sahne.time.addEvent({
      delay: 850,
      loop: true,
      callback: () => {
        if (Math.random() < 0.7) kivilcim.explode(6 + ((Math.random() * 10) | 0));
      }
    });
    kap.once('destroy', () => kivilcimOlayi.remove(false));
  };
  return kap;
}

// ---------- Pencere cercevesi (dis manzaraya bakan lomboz) ----------
export function pencereCercevesiDokusu(sahne) {
  return dokuCiz(sahne, 'pencere_cerceve', 1500, 860, (ctx, PW, PH) => {
    const cx = 750, cy = 400, R = 255;
    const g = ctx.createRadialGradient(cx, cy, R, cx, cy, 900);
    g.addColorStop(0, '#141c27');
    g.addColorStop(1, '#05080c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, PW, PH);
    // Duvar panelleri
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    for (const x of [180, 420, 1080, 1320]) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, PH);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // Cerceve halkasi ve civatalar
    ctx.strokeStyle = '#242d39';
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(140,175,215,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 34, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      const bx = cx + Math.cos(a) * (R + 18), by = cy + Math.sin(a) * (R + 18);
      ctx.fillStyle = '#3a4656';
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(200,215,235,0.35)';
      ctx.fillRect(bx - 2, by - 3, 2, 2);
    }
    // Dunya isigi cercevenin alt ic kenarina vurur
    ctx.strokeStyle = 'rgba(120,160,230,0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 1, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    // Tutunma kolu
    ctx.strokeStyle = '#4a5566';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - R - 90, cy + 120);
    ctx.lineTo(cx - R - 90, cy - 120);
    ctx.stroke();
  });
}
