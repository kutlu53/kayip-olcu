import Phaser from 'phaser';
import { dokuCiz, yumusakDaire, poligon, yuvarlakDikdortgen } from './Tuval.js';
import { MONO } from '../ui/tipografi.js';
import { titreme } from '../fx/Transitions.js';

// Reaktor bolmesi: mor-beyaz cekirdek isigi, solda Dunya'ya bakan lomboz, sagda dort alarm paneli (CLAUDE.md §10.4)
const W = 1500, H = 860;
const LOMBOZ = [300, 330, 170];
const PANEL = { x: 975, y: 190, w: 180, h: 160, ara: 16 };
const CEKIRDEK = { x: 780, ust: 110, alt: 770, gen: 170 };

export const ALARMLAR = [
  ['YÖRÜNGE', 'İrtifa 412 → 398 km'],
  ['KUTUP IŞIĞI', 'Parçacık akısı yüksek'],
  ['FİSYON', 'Çekirdek bölünmesi'],
  ['BOZUNMA', 'Beta sayacı artıyor']
];

const panelKonumu = (i) => [PANEL.x + (i % 2) * (PANEL.w + PANEL.ara), PANEL.y + Math.floor(i / 2) * (PANEL.h + PANEL.ara)];

export function reaktorDokusu(sahne) {
  dokuCiz(sahne, 'reaktor_parilti', 256, 512, (c) => {
    c.save();
    c.scale(1, 2);
    yumusakDaire(c, 128, 128, 128, '200,180,255', 1);
    c.restore();
  });
  return dokuCiz(sahne, 'reaktor_bolmesi', W, H, (c) => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#140d22');
    g.addColorStop(1, '#06040b');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    // Duvar panelleri
    c.strokeStyle = 'rgba(0,0,0,0.5)';
    c.lineWidth = 2;
    for (let x = 60; x < W; x += 120) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, H);
      c.stroke();
    }
    c.strokeStyle = 'rgba(160,140,220,0.08)';
    for (let x = 62; x < W; x += 120) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, H);
      c.stroke();
    }
    // Lomboz (dis manzara arkadan gorunur)
    const [lx, ly, lr] = LOMBOZ;
    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    c.arc(lx, ly, lr, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = '#2a2238';
    c.lineWidth = 30;
    c.beginPath();
    c.arc(lx, ly, lr + 15, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = 'rgba(160,190,230,0.35)';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(lx, ly, lr + 1, 0.15 * Math.PI, 0.85 * Math.PI);
    c.stroke();
    // Reaktor cekirdegi: metal silindir, ortada izleme penceresi
    const { x, ust, alt, gen } = CEKIRDEK;
    const m = c.createLinearGradient(x - gen / 2, 0, x + gen / 2, 0);
    m.addColorStop(0, '#2c2638');
    m.addColorStop(0.35, '#5a5470');
    m.addColorStop(1, '#16121f');
    c.fillStyle = m;
    c.fillRect(x - gen / 2, ust, gen, alt - ust);
    c.fillStyle = 'rgba(0,0,0,0.35)';
    for (let y = ust + 40; y < alt; y += 70) c.fillRect(x - gen / 2, y, gen, 8);
    c.fillStyle = '#0a0612';
    yuvarlakDikdortgen(c, x - 45, 300, 90, 280, 20);
    c.fill();
    c.strokeStyle = '#8e6cf0';
    c.lineWidth = 3;
    c.stroke();
    // Ust ve alt baglanti halkalari
    for (const y of [ust, alt - 30]) {
      c.fillStyle = '#3a3448';
      c.fillRect(x - gen / 2 - 30, y, gen + 60, 30);
    }
    // Alarm panelleri (bos cerceveler; yazilar canli)
    for (let i = 0; i < 4; i++) {
      const [px, py] = panelKonumu(i);
      c.fillStyle = '#05030a';
      yuvarlakDikdortgen(c, px, py, PANEL.w, PANEL.h, 10);
      c.fill();
      c.strokeStyle = '#3a3448';
      c.lineWidth = 3;
      c.stroke();
    }
    // Zemin izgarasi
    poligon(c, [[0, H], [0, 790], [W, 790], [W, H]], '#0c0814');
    c.strokeStyle = 'rgba(160,140,220,0.12)';
    c.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 30) {
      c.beginPath();
      c.moveTo(gx, 790);
      c.lineTo(gx, H);
      c.stroke();
    }
  });
}

export function reaktorOlustur(sahne, ayar = {}) {
  const ADD = Phaser.BlendModes.ADD;
  const kap = sahne.add.container(0, 0);
  kap.add(sahne.add.image(0, 0, reaktorDokusu(sahne)));
  const parilti = sahne.add.image(CEKIRDEK.x - W / 2, 440 - H / 2, 'reaktor_parilti').setBlendMode(ADD).setScale(0.55, 0.65).setTint(0xb8a0ff);
  kap.add(parilti);
  const paneller = ALARMLAR.map(([ad, satir], i) => {
    const [px, py] = panelKonumu(i);
    const x = px - W / 2;
    const y = py - H / 2;
    const zemin = sahne.add.rectangle(x + PANEL.w / 2, y + PANEL.h / 2, PANEL.w - 8, PANEL.h - 8, 0xd64545, 0).setBlendMode(ADD);
    const baslik = sahne.add.text(x + PANEL.w / 2, y + 40, ad, { fontFamily: MONO, fontSize: '18px', fontStyle: 'bold', color: '#FF6B6B' }).setOrigin(0.5);
    const alt = sahne.add.text(x + PANEL.w / 2, y + 90, satir, { fontFamily: MONO, fontSize: '13px', color: '#E6E8EB', align: 'center', wordWrap: { width: PANEL.w - 20 } }).setOrigin(0.5);
    const durum = sahne.add.text(x + PANEL.w / 2, y + 130, '▲ ALARM', { fontFamily: MONO, fontSize: '13px', color: '#FF6B6B' }).setOrigin(0.5);
    kap.add([zemin, baslik, alt, durum]);
    return { zemin, baslik, durum, alarm: !ayar.sakin };
  });
  if (ayar.sakin) paneller.forEach((p) => kapat(p, true));

  function kapat(p, hemen) {
    p.alarm = false;
    p.zemin.setAlpha(0);
    p.baslik.setColor('#5FE3E8');
    p.durum.setText('● KARARLI').setColor('#5FE3E8');
    if (!hemen) sahne.tweens.add({ targets: p.durum, alpha: { from: 0.2, to: 1 }, duration: 500, ease: titreme });
  }

  kap.guncelle = (zaman) => {
    const t = zaman / 1000;
    parilti.alpha = 0.65 + 0.25 * Math.sin(t * 1.4);
    // Alarm: saniyede bir kez yanip soner (flas kuralinin altinda)
    const yanik = Math.floor(t * 1.0) % 2 === 0;
    for (const p of paneller) if (p.alarm) p.zemin.setAlpha(yanik ? 0.18 : 0.04);
  };
  kap.olay = (ad, o = {}) => {
    if (ad === 'sustur') {
      const liste = o.no === undefined ? paneller : [paneller[o.no]];
      liste.forEach((p, i) => sahne.time.delayedCall(i * 450, () => kapat(p)));
    }
  };
  return kap;
}
