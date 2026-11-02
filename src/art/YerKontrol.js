import Phaser from 'phaser';
import { dokuCiz, yumusakDaire, yuvarlakDikdortgen } from './Tuval.js';
import { ekranAc } from '../fx/Transitions.js';
import { YAZI } from '../ui/tipografi.js';

// Dr. Feza: Ankara'daki yer kontrolden video baglantisi. Sicak ic isik, arkada ekranlar (CLAUDE.md §10.2)
const egri = (x, n) => {
  x.beginPath();
  x.moveTo(n[0], n[1]);
  for (let i = 2; i < n.length; i += 4) x.quadraticCurveTo(n[i], n[i + 1], n[i + 2], n[i + 3]);
  x.stroke();
};

export function fezaDokusu(sahne) {
  return dokuCiz(sahne, 'feza_video', 380, 250, (x, W, H) => {
    const bg = x.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#3a2a1e');
    bg.addColorStop(1, '#120c08');
    x.fillStyle = bg;
    x.fillRect(0, 0, W, H);
    // Arkadaki ekranlar ve yazi
    for (const [sx, sy, w, h] of [[14, 24, 90, 56], [282, 20, 86, 60], [300, 96, 70, 44]]) {
      x.fillStyle = '#0b1218';
      x.fillRect(sx, sy, w, h);
      x.strokeStyle = 'rgba(95,227,232,0.5)';
      x.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        x.beginPath();
        x.moveTo(sx + 6, sy + 10 + i * 11);
        x.lineTo(sx + w - 10 - ((i * 17) % 30), sy + 10 + i * 11);
        x.stroke();
      }
    }
    x.font = 'bold 10px "Segoe UI", Arial, sans-serif';
    x.fillStyle = 'rgba(255,220,180,0.55)';
    x.fillText('YER KONTROL – ANKARA', 16, 100);
    // Govde: hirka ve yaka
    x.fillStyle = '#23464a';
    x.beginPath();
    x.ellipse(190, 290, 165, 92, 0, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#e8e2d8';
    x.beginPath();
    x.moveTo(166, 212);
    x.lineTo(190, 246);
    x.lineTo(214, 212);
    x.closePath();
    x.fill();
    // Boyun ve bas (isik sol onden)
    const ten = x.createLinearGradient(140, 80, 250, 210);
    ten.addColorStop(0, '#e0b896');
    ten.addColorStop(1, '#9a7058');
    x.fillStyle = ten;
    x.fillRect(172, 180, 36, 40);
    x.beginPath();
    x.moveTo(190, 70);
    x.bezierCurveTo(232, 70, 246, 100, 245, 136);
    x.bezierCurveTo(244, 168, 232, 192, 210, 204);
    x.quadraticCurveTo(190, 214, 170, 204);
    x.bezierCurveTo(148, 192, 136, 168, 135, 136);
    x.bezierCurveTo(134, 100, 148, 70, 190, 70);
    x.fill();
    // Kisa kir sac, yanlarda belirgin
    x.fillStyle = '#b9b4ad';
    x.beginPath();
    x.moveTo(134, 130);
    x.quadraticCurveTo(128, 68, 190, 62);
    x.quadraticCurveTo(252, 68, 246, 130);
    x.quadraticCurveTo(240, 96, 214, 88);
    x.quadraticCurveTo(190, 82, 166, 88);
    x.quadraticCurveTo(140, 96, 134, 130);
    x.fill();
    // Gozler, kaslar, gozluk
    x.strokeStyle = '#4a3a30';
    x.lineWidth = 3;
    x.lineCap = 'round';
    egri(x, [154, 118, 166, 112, 180, 116]);
    egri(x, [200, 116, 214, 112, 226, 118]);
    for (const gx of [167, 213]) {
      x.fillStyle = '#2e2018';
      x.beginPath();
      x.arc(gx, 132, 3.6, 0, Math.PI * 2);
      x.fill();
    }
    x.strokeStyle = '#2a2420';
    x.lineWidth = 2.5;
    yuvarlakDikdortgen(x, 148, 120, 38, 26, 8);
    x.stroke();
    yuvarlakDikdortgen(x, 194, 120, 38, 26, 8);
    x.stroke();
    x.beginPath();
    x.moveTo(186, 130);
    x.lineTo(194, 130);
    x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.45)';
    x.lineWidth = 1.5;
    egri(x, [154, 126, 160, 122, 168, 123]);
    egri(x, [200, 126, 206, 122, 214, 123]);
    // Burun ve hafif gulumseme
    x.strokeStyle = 'rgba(80,50,35,0.55)';
    x.lineWidth = 2;
    egri(x, [192, 138, 196, 156, 186, 162]);
    x.strokeStyle = '#6a3a30';
    x.lineWidth = 2.5;
    egri(x, [174, 178, 190, 186, 206, 178]);
    // Sicak lamba yansimasi ve video dokusu
    x.globalCompositeOperation = 'lighter';
    yumusakDaire(x, 120, 60, 140, '255,200,140', 0.12);
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = 'rgba(0,0,0,0.15)';
    for (let y = 0; y < H; y += 3) x.fillRect(0, y, W, 1);
  });
}

export function fezaVideoOlustur(sahne) {
  const G = 380, Y = 250;
  const kap = sahne.add.container(0, 0);
  const ic = sahne.add.container(0, 0);
  const zemin = sahne.add.rectangle(0, -14, G + 10, Y + 38, 0x0b0805, 0.92).setStrokeStyle(2, 0xffc890, 0.6);
  const goruntu = sahne.add.image(0, 4, fezaDokusu(sahne));
  const gurultu = sahne.add.tileSprite(0, 4, G, Y, 'gurultu').setAlpha(0.06);
  const stil = { fontFamily: YAZI, fontSize: '14px', fontStyle: 'bold', color: '#FFE2C2' };
  ic.add([zemin, goruntu, gurultu, sahne.add.text(-G / 2 + 2, -Y / 2 - 26, 'YER KONTROL · DR. FEZA', stil), sahne.add.text(G / 2 - 2, -Y / 2 - 26, '● CANLI', { ...stil, color: '#FF5A5A' }).setOrigin(1, 0)]);
  ic.setVisible(false);
  kap.add(ic);
  kap.guncelle = () => {
    if (!ic.visible) return;
    gurultu.tilePositionX = Math.random() * 256;
    gurultu.tilePositionY = Math.random() * 256;
  };
  kap.olay = (ad) => {
    if (ad === 'ac') ekranAc(sahne, ic, 600);
  };
  return kap;
}

// Dort kuvvet hologrami: dort halka doner, 'birles' ile tek halkada birlesir (birlestirme kuramlari)
const HALKALAR = [
  ['Kütle çekimi', 0xe6e8eb],
  ['Elektromanyetik', 0x5fe3e8],
  ['Güçlü nükleer', 0x8e6cf0],
  ['Zayıf nükleer', 0xe3b341]
];

export function kuvvetHalkalariOlustur(sahne) {
  const kap = sahne.add.container(0, 0);
  const g = sahne.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
  const etiketler = HALKALAR.map(([ad, renk]) =>
    sahne.add.text(0, 0, ad, { fontFamily: YAZI, fontSize: '15px', fontStyle: 'bold', color: '#' + renk.toString(16).padStart(6, '0') }).setOrigin(0.5)
  );
  const birlesik = sahne.add.text(0, 92, 'Tek kuram?', { fontFamily: YAZI, fontSize: '18px', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5).setAlpha(0);
  kap.add([g, ...etiketler, birlesik]);
  const durum = { r: 130 };
  kap.guncelle = (zaman) => {
    const t = zaman / 1000;
    g.clear();
    HALKALAR.forEach(([, renk], i) => {
      const a = t * 0.5 + (i * Math.PI) / 2;
      const x = Math.cos(a) * durum.r;
      const y = Math.sin(a) * durum.r * 0.55;
      for (const [w, al] of [[10, 0.08], [5, 0.2], [2, 0.9]]) g.lineStyle(w, renk, al).strokeCircle(x, y, 34);
      etiketler[i].setPosition(x, y + 50).setAlpha(Math.min(1, durum.r / 60));
    });
  };
  kap.olay = (ad) => {
    if (ad !== 'birles') return;
    sahne.tweens.add({ targets: durum, r: 0, duration: 3500, ease: 'Sine.easeInOut' });
    sahne.tweens.add({ targets: birlesik, alpha: 1, delay: 3000, duration: 800 });
  };
  return kap;
}
