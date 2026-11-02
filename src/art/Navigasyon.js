import Phaser from 'phaser';
import { dokuCiz, poligon } from './Tuval.js';
import { YAZI } from '../ui/tipografi.js';

// Navigasyon koprusu: genis on cam, petrol mavisi konsol, radar ve pusula hologramlari (CLAUDE.md §10.4)
const W = 1500, H = 860;
const CAM = [[250, 80], [1250, 80], [1360, 500], [140, 500]];

export function navKoprusuDokusu(sahne) {
  return dokuCiz(sahne, 'nav_koprusu', W, H, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#08141a');
    g.addColorStop(1, '#03080b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // On cam (Dunya ve yildizlar arkadan gorunur)
    ctx.globalCompositeOperation = 'destination-out';
    poligon(ctx, CAM, '#000');
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#1f3440';
    ctx.lineWidth = 18;
    poligon(ctx, CAM);
    ctx.stroke();
    // Cam bolmeleri
    ctx.lineWidth = 8;
    for (const x of [583, 917]) {
      ctx.beginPath();
      ctx.moveTo(x, 80);
      ctx.lineTo(x + (x < 750 ? -36 : 36), 500);
      ctx.stroke();
    }
    // Dunya isigi: cercevenin alt kenari
    ctx.strokeStyle = 'rgba(110,170,230,0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(150, 494);
    ctx.lineTo(1350, 494);
    ctx.stroke();
    // Konsol
    const k = ctx.createLinearGradient(0, 560, 0, H);
    k.addColorStop(0, '#12303a');
    k.addColorStop(1, '#040b0f');
    poligon(ctx, [[0, H], [0, 640], [180, 580], [1320, 580], [1500, 640], [1500, H]], k);
    ctx.strokeStyle = 'rgba(120,200,220,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 640);
    ctx.lineTo(180, 580);
    ctx.lineTo(1320, 580);
    ctx.lineTo(1500, 640);
    ctx.stroke();
    // Hologram projektorleri
    for (const x of [450, 1050]) {
      ctx.fillStyle = '#16323d';
      ctx.beginPath();
      ctx.ellipse(x, 600, 90, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(95,227,232,0.5)';
      ctx.stroke();
    }
  });
}

// Radar hologrami: halkalar, tarama cizgisi, gurultu ya da hedef
export function radarCiz(g, r, { zaman = 0, gurultu = 0, hedef = null, alfa = 1 } = {}) {
  g.clear();
  g.lineStyle(1.5, 0x5fe3e8, 0.5 * alfa);
  for (const k of [1, 0.66, 0.33]) g.strokeCircle(0, 0, r * k);
  g.lineBetween(-r, 0, r, 0).lineBetween(0, -r, 0, r);
  const a = (zaman / 1000) * 1.6;
  for (let i = 0; i < 14; i++) {
    g.lineStyle(2, 0x5fe3e8, (0.5 - i * 0.035) * alfa);
    g.lineBetween(0, 0, Math.cos(a - i * 0.04) * r, Math.sin(a - i * 0.04) * r);
  }
  if (gurultu) {
    g.fillStyle(0x5fe3e8, 0.6 * alfa);
    for (let i = 0; i < 18 * gurultu; i++) {
      const rr = Math.random() * r;
      const aa = Math.random() * Math.PI * 2;
      g.fillCircle(Math.cos(aa) * rr, Math.sin(aa) * rr, 1.5);
    }
  }
  if (hedef) {
    const [hx, hy] = hedef;
    g.lineStyle(2, 0xf28c28, alfa).lineBetween(0, 0, hx, hy);
    g.fillStyle(0xffffff, alfa).fillCircle(hx, hy, 5);
    g.lineStyle(2, 0xffffff, (0.5 + 0.5 * Math.sin(zaman / 200)) * alfa).strokeCircle(hx, hy, 11);
  }
}

export function navKonsolOlustur(sahne) {
  const ADD = Phaser.BlendModes.ADD;
  const kap = sahne.add.container(0, 0);
  kap.add(sahne.add.image(0, 0, navKoprusuDokusu(sahne)));
  const radar = sahne.add.graphics().setPosition(-300, 60).setBlendMode(ADD);
  radar.scaleY = 0.55; // projektorden egik bakis
  const pusula = sahne.add.container(300, 60);
  const pg = sahne.add.graphics().setBlendMode(ADD);
  pg.lineStyle(3, 0x5fe3e8, 0.8).strokeCircle(0, 0, 90);
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI) / 18;
    const u = i % 9 === 0 ? 16 : 7;
    pg.lineStyle(2, 0x5fe3e8, 0.6).lineBetween(Math.cos(a) * 90, Math.sin(a) * 90, Math.cos(a) * (90 - u), Math.sin(a) * (90 - u));
  }
  pg.fillStyle(0xf28c28, 0.9).fillTriangle(0, -70, -9, -40, 9, -40);
  pusula.add(pg);
  // Turkce yon harfleri: K(uzey) D(ogu) G(uney) B(ati)
  [['K', 0, -62], ['D', 62, 0], ['G', 0, 62], ['B', -62, 0]].forEach(([h, x, y]) =>
    pusula.add(sahne.add.text(x, y, h, { fontFamily: YAZI, fontSize: '20px', fontStyle: 'bold', color: '#D8F6FF' }).setOrigin(0.5))
  );
  pusula.scaleY = 0.55;
  kap.add([radar, pusula]);

  const durum = { bozuk: true, hiz: 0, hedef: null };
  kap.guncelle = (zaman, delta) => {
    radarCiz(radar, 120, { zaman, gurultu: durum.bozuk ? 1 : 0, hedef: durum.hedef });
    if (durum.bozuk) {
      // Pusula rastgele hizlanip yavaslar: yon bilgisi yok
      durum.hiz += (Math.random() - 0.5) * 0.02 * (delta / 16);
      durum.hiz = Phaser.Math.Clamp(durum.hiz, -0.06, 0.06);
      pg.rotation += durum.hiz;
    }
  };
  kap.olay = (ad) => {
    if (ad === 'duzel') {
      durum.bozuk = false;
      sahne.tweens.add({ targets: pg, rotation: Math.round(pg.rotation / (Math.PI * 2)) * Math.PI * 2, duration: 1800, ease: 'Back.easeOut' });
    }
    if (ad === 'bul') durum.hedef = [70, -70];
  };
  return kap;
}
