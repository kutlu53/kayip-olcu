import Phaser from 'phaser';
import { dokuCiz, tuval, yumusakDaire, yuvarlakDikdortgen } from './Tuval.js';
import { ekranAc, titreme } from '../fx/Transitions.js';
import { ayarlar } from '../config/settings.js';
import { YAZI, MONO } from '../ui/tipografi.js';

// Karakterler hikayede gerekcesi olan bicimlerde gorunur (CLAUDE.md §10.2):
// Elif baska bolmede yarali -> hologram; Kerem kapsulde -> video baglantisi

// ---------- Komutan Elif Aydin: hologram bust ----------
function elifYollari() {
  const govde = new Path2D();
  govde.moveTo(10, 430);
  govde.bezierCurveTo(14, 352, 52, 318, 112, 306);
  govde.lineTo(152, 292);
  govde.lineTo(208, 292);
  govde.lineTo(248, 306);
  govde.bezierCurveTo(308, 318, 346, 352, 350, 430);
  govde.closePath();

  const boyun = new Path2D();
  boyun.moveTo(153, 225);
  boyun.lineTo(150, 296);
  boyun.quadraticCurveTo(180, 310, 210, 296);
  boyun.lineTo(207, 225);
  boyun.closePath();

  const bas = new Path2D();
  bas.moveTo(180, 96);
  bas.bezierCurveTo(222, 96, 244, 128, 244, 172);
  bas.bezierCurveTo(244, 206, 234, 232, 214, 248);
  bas.quadraticCurveTo(196, 262, 180, 262);
  bas.quadraticCurveTo(164, 262, 146, 248);
  bas.bezierCurveTo(126, 232, 116, 206, 116, 172);
  bas.bezierCurveTo(116, 128, 138, 96, 180, 96);
  bas.closePath();

  // Arkaya toplanmis sac, yandan ayrik
  const sac = new Path2D();
  sac.moveTo(113, 188);
  sac.bezierCurveTo(104, 118, 140, 84, 180, 84);
  sac.bezierCurveTo(220, 84, 256, 118, 247, 188);
  sac.bezierCurveTo(241, 150, 222, 118, 192, 115);
  sac.bezierCurveTo(160, 113, 132, 132, 121, 162);
  sac.closePath();

  const aski = new Path2D();
  aski.moveTo(236, 304);
  aski.lineTo(262, 312);
  aski.lineTo(150, 430);
  aski.lineTo(112, 430);
  aski.closePath();

  const kol = new Path2D();
  yuvarlakDikdortgenYol(kol, 118, 360, 140, 38, 16);
  return { govde, boyun, bas, sac, aski, kol };
}

function yuvarlakDikdortgenYol(p, x, y, w, h, r) {
  p.moveTo(x + r, y);
  p.arcTo(x + w, y, x + w, y + h, r);
  p.arcTo(x + w, y + h, x, y + h, r);
  p.arcTo(x, y + h, x, y, r);
  p.arcTo(x, y, x + w, y, r);
  p.closePath();
}

const cizgi = (x, noktalar) => {
  x.beginPath();
  x.moveTo(noktalar[0], noktalar[1]);
  for (let i = 2; i < noktalar.length; i += 4) x.quadraticCurveTo(noktalar[i], noktalar[i + 1], noktalar[i + 2], noktalar[i + 3]);
  x.stroke();
};

const IFADELER = {
  // [sol kas, sag kas, agiz]
  endiseli: [[140, 163, 154, 156, 168, 154], [192, 154, 206, 156, 220, 163], [165, 236, 180, 231, 195, 236]],
  notr: [[140, 160, 154, 154, 168, 158], [192, 158, 206, 154, 220, 160], [165, 234, 180, 235, 195, 234]],
  gulumseme: [[140, 160, 154, 153, 168, 157], [192, 157, 206, 153, 220, 160], [163, 232, 180, 241, 197, 232]]
};

export function elifDokusu(sahne, ifade = 'endiseli') {
  return dokuCiz(sahne, `elif_${ifade}`, 360, 430, (ctx, W, H) => {
    const c = tuval(W, H);
    const x = c.getContext('2d');
    const p = elifYollari();

    // 1) Hologram tonlari: isik sol ustten
    x.fillStyle = 'rgba(80,200,220,0.3)';
    x.fill(p.govde);
    x.fillStyle = 'rgba(60,170,200,0.4)';
    x.fill(p.boyun);
    const isik = x.createLinearGradient(110, 90, 300, 330);
    isik.addColorStop(0, 'rgba(195,248,255,0.66)');
    isik.addColorStop(0.5, 'rgba(110,220,235,0.45)');
    isik.addColorStop(1, 'rgba(60,170,200,0.28)');
    x.fillStyle = isik;
    x.fill(p.bas);
    x.save();
    x.clip(p.bas);
    const golge = x.createLinearGradient(170, 0, 250, 0);
    golge.addColorStop(0, 'rgba(0,30,50,0)');
    golge.addColorStop(1, 'rgba(0,30,50,0.4)');
    x.fillStyle = golge;
    x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(0,40,60,0.2)';
    for (const [ex, ey, rx, ry] of [[155, 177, 18, 10], [205, 177, 18, 10], [224, 214, 12, 22]]) {
      x.beginPath();
      x.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
      x.fill();
    }
    x.restore();
    x.fillStyle = 'rgba(40,150,180,0.7)';
    x.fill(p.sac);
    x.beginPath();
    x.arc(180, 78, 24, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = 'rgba(170,240,250,0.2)';
    x.fill(p.aski);
    x.fillStyle = 'rgba(140,230,245,0.36)';
    x.fill(p.kol);

    // 2) Cizgiler
    x.strokeStyle = 'rgba(230,252,255,0.9)';
    x.lineWidth = 2;
    x.lineCap = 'round';
    const [solKas, sagKas, agiz] = IFADELER[ifade] || IFADELER.notr;
    cizgi(x, solKas);
    cizgi(x, sagKas);
    cizgi(x, [142, 179, 155, 170, 168, 179, 155, 186, 142, 179]);
    cizgi(x, [192, 179, 205, 170, 218, 179, 205, 186, 192, 179]);
    x.fillStyle = 'rgba(240,255,255,0.95)';
    for (const ex of [155, 205]) {
      x.beginPath();
      x.arc(ex, 178.5, 3.2, 0, Math.PI * 2);
      x.fill();
    }
    x.lineWidth = 1.6;
    cizgi(x, [182, 184, 186, 203, 178, 212]);
    cizgi(x, [172, 214, 180, 218, 188, 214]);
    x.lineWidth = 2;
    cizgi(x, agiz);
    // Sac telleri
    x.strokeStyle = 'rgba(200,250,255,0.3)';
    x.lineWidth = 1;
    for (let i = 0; i < 6; i++) cizgi(x, [190 - i * 4, 116, 150 - i * 6, 112 + i * 2, 122 + i * 2, 150 + i * 6]);
    // Uniforma: yaka, rutbe, isim
    x.strokeStyle = 'rgba(220,250,255,0.75)';
    x.lineWidth = 2;
    x.beginPath();
    x.moveTo(150, 296);
    x.lineTo(180, 332);
    x.lineTo(210, 296);
    x.stroke();
    x.fillStyle = 'rgba(220,250,255,0.75)';
    x.fillRect(268, 336, 28, 4);
    x.fillRect(268, 344, 28, 4);
    x.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    x.fillText('E. AYDIN', 66, 350);
    // Kulaklik ve mikrofon (telsiz)
    x.lineWidth = 5;
    x.beginPath();
    x.moveTo(114, 184);
    x.bezierCurveTo(108, 92, 252, 92, 246, 184);
    x.stroke();
    x.fillStyle = 'rgba(190,245,255,0.8)';
    yuvarlakDikdortgen(x, 102, 168, 18, 38, 6);
    x.fill();
    x.lineWidth = 3;
    cizgi(x, [110, 202, 118, 246, 156, 245]);
    x.beginPath();
    x.arc(159, 245, 4, 0, Math.PI * 2);
    x.fill();
    // Kenarlar
    x.lineWidth = 1.5;
    x.strokeStyle = 'rgba(200,250,255,0.55)';
    x.stroke(p.bas);
    x.stroke(p.govde);

    // 3) Tarama cizgileri ve alt kenarda sonumlenme
    x.globalCompositeOperation = 'destination-out';
    x.fillStyle = 'rgba(0,0,0,0.35)';
    for (let y = 0; y < H; y += 3) x.fillRect(0, y, W, 1);
    const alt = x.createLinearGradient(0, H - 120, 0, H);
    alt.addColorStop(0, 'rgba(0,0,0,0)');
    alt.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = alt;
    x.fillRect(0, H - 120, W, 120);

    // 4) Parlama ile son goruntu
    ctx.shadowColor = 'rgba(95,227,232,0.9)';
    ctx.shadowBlur = 14;
    ctx.drawImage(c, 0, 0);
    ctx.shadowBlur = 0;
  });
}

export function ekranElifOlustur(sahne, ayar = {}) {
  const ADD = Phaser.BlendModes.ADD;
  const G = 520, Y = 390;
  const kap = sahne.add.container(0, 0);
  const ekran = sahne.add.container(0, 0);
  const cerceve = sahne.add.graphics();
  cerceve.fillStyle(0x02070c, 0.95).fillRect(-G / 2, -Y / 2, G, Y);
  cerceve.lineStyle(2, 0x5fe3e8, 0.55).strokeRect(-G / 2, -Y / 2, G, Y);
  cerceve.lineStyle(4, 0x5fe3e8, 0.9);
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    cerceve.beginPath();
    cerceve.moveTo((sx * G) / 2, sy * (Y / 2 - 22));
    cerceve.lineTo((sx * G) / 2, (sy * Y) / 2);
    cerceve.lineTo(sx * (G / 2 - 22), (sy * Y) / 2);
    cerceve.strokePath();
  }
  const stil = { fontFamily: MONO, fontSize: '13px', color: '#5FE3E8' };
  const etiket = sahne.add.text(-G / 2 + 14, -Y / 2 + 10, 'TIBBİ BÖLME · K. ELİF AYDIN', stil).setAlpha(0.8);
  const ses = sahne.add.text(G / 2 - 14, -Y / 2 + 10, 'SES ●', stil).setOrigin(1, 0).setAlpha(0.8);
  const holo = sahne.add.image(0, 22, elifDokusu(sahne, ayar.ifade || 'endiseli')).setScale(0.8).setBlendMode(ADD);
  const tarama = sahne.add.rectangle(0, -Y / 2, G - 4, 26, 0x5fe3e8, 0.07).setBlendMode(ADD);
  ekran.add([cerceve, holo, tarama, etiket, ses]);
  ekran.setVisible(false);
  kap.add(ekran);

  kap.olay = (ad) => {
    if (ad === 'ac') ekranAc(sahne, ekran, 700);
  };
  kap.guncelle = (zaman) => {
    const t = zaman / 1000;
    tarama.y = -Y / 2 + 13 + ((t * 90) % (Y - 26));
    holo.alpha = 0.85 + 0.08 * Math.sin(t * 3.1);
    if (!ayarlar.hareketiAzalt && Math.random() < 0.02) holo.x = (Math.random() - 0.5) * 8;
    else holo.x = 0;
  };
  return kap;
}

// ---------- Kerem: kapsul kamerasindan video karesi ----------
export function keremDokusu(sahne) {
  return dokuCiz(sahne, 'kerem_video', 380, 250, (x, W, H) => {
    // Kapsul ici
    const bg = x.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0e141b');
    bg.addColorStop(1, '#05070a');
    x.fillStyle = bg;
    x.fillRect(0, 0, W, H);
    x.fillStyle = '#141b24';
    x.fillRect(0, 30, 70, 150);
    x.fillRect(312, 20, 68, 170);
    for (const [lx, ly, renk] of [[20, 60, '#e3b341'], [34, 60, '#e05555'], [330, 50, '#5fb7e8'], [344, 50, '#e3b341']]) {
      x.fillStyle = renk;
      x.fillRect(lx, ly, 5, 5);
    }
    // Giysi (alttan kask lambasiyla aydinlanmis)
    const giysi = x.createLinearGradient(0, H, 0, 190);
    giysi.addColorStop(0, '#c9ced6');
    giysi.addColorStop(1, '#4b525c');
    x.fillStyle = giysi;
    x.beginPath();
    x.ellipse(190, 300, 175, 90, 0, 0, Math.PI * 2);
    x.fill();
    // Kask
    x.fillStyle = '#1a212b';
    x.beginPath();
    x.arc(190, 132, 104, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#07090c';
    x.beginPath();
    x.arc(190, 136, 88, 0, Math.PI * 2);
    x.fill();
    // Yuz: alttan aydinlatma
    const yuz = new Path2D();
    yuz.moveTo(190, 76);
    yuz.bezierCurveTo(230, 76, 246, 104, 246, 140);
    yuz.bezierCurveTo(246, 172, 236, 194, 214, 208);
    yuz.quadraticCurveTo(200, 216, 190, 216);
    yuz.quadraticCurveTo(180, 216, 166, 208);
    yuz.bezierCurveTo(144, 194, 134, 172, 134, 140);
    yuz.bezierCurveTo(134, 104, 150, 76, 190, 76);
    yuz.closePath();
    const ten = x.createLinearGradient(0, 216, 0, 80);
    ten.addColorStop(0, '#e6c3a6');
    ten.addColorStop(0.55, '#9a7258');
    ten.addColorStop(1, '#3e2b22');
    x.fillStyle = ten;
    x.fill(yuz);
    // Daginik kisa sac
    x.fillStyle = '#17100d';
    x.beginPath();
    x.moveTo(134, 128);
    x.quadraticCurveTo(128, 78, 168, 70);
    x.quadraticCurveTo(176, 58, 190, 66);
    x.quadraticCurveTo(204, 54, 214, 68);
    x.quadraticCurveTo(250, 72, 246, 128);
    x.quadraticCurveTo(236, 100, 220, 104);
    x.quadraticCurveTo(212, 92, 198, 102);
    x.quadraticCurveTo(186, 90, 176, 104);
    x.quadraticCurveTo(160, 96, 152, 110);
    x.quadraticCurveTo(140, 108, 134, 128);
    x.fill();
    // Kaslar (telasli, yukari kalkik)
    x.strokeStyle = '#24160f';
    x.lineWidth = 5;
    x.lineCap = 'round';
    cizgi(x, [150, 126, 162, 116, 178, 120]);
    cizgi(x, [202, 120, 218, 116, 230, 126]);
    // Gozler
    for (const ex of [165, 215]) {
      x.fillStyle = '#d8d0c8';
      x.beginPath();
      x.ellipse(ex, 140, 10, 5.5, 0, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = '#2e2018';
      x.beginPath();
      x.arc(ex, 140, 4.2, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = '#fff';
      x.fillRect(ex + 1, 137, 2, 2);
    }
    x.strokeStyle = 'rgba(70,40,28,0.6)';
    x.lineWidth = 2;
    cizgi(x, [192, 146, 196, 164, 186, 170]);
    // Bagiran agiz
    x.fillStyle = '#2a1210';
    x.beginPath();
    x.ellipse(190, 190, 14, 9, 0, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#e8e0d8';
    x.fillRect(180, 182, 20, 3);
    // Lamba isigi ve vizor yansimasi
    x.globalCompositeOperation = 'lighter';
    yumusakDaire(x, 190, 250, 120, '255,230,200', 0.18);
    x.strokeStyle = 'rgba(200,230,255,0.35)';
    x.lineWidth = 3;
    x.beginPath();
    x.arc(190, 136, 80, Math.PI * 1.1, Math.PI * 1.45);
    x.stroke();
    x.globalCompositeOperation = 'source-over';
    // Video dokusu: soguk renk kaymasi ve tarama cizgileri
    x.fillStyle = 'rgba(30,70,80,0.15)';
    x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < H; y += 3) x.fillRect(0, y, W, 1);
  });
}

export function keremVideoOlustur(sahne) {
  const G = 380, Y = 250;
  const kap = sahne.add.container(0, 0);
  const ic = sahne.add.container(0, 0);
  const zemin = sahne.add.rectangle(0, -14, G + 10, Y + 38, 0x02060b, 0.9).setStrokeStyle(2, 0x5fe3e8, 0.6);
  const goruntu = sahne.add.image(0, 4, keremDokusu(sahne));
  const gurultu = sahne.add.tileSprite(0, 4, G, Y, 'gurultu').setAlpha(0.16);
  const stil = { fontFamily: YAZI, fontSize: '14px', fontStyle: 'bold', color: '#D8F6FF' };
  const baslik = sahne.add.text(-G / 2 + 2, -Y / 2 - 26, 'KAPSÜL-2 · KEREM', stil);
  const canli = sahne.add.text(G / 2 - 2, -Y / 2 - 26, '● CANLI', { ...stil, color: '#FF5A5A' }).setOrigin(1, 0);
  const koptu = sahne.add.text(0, 4, 'BAĞLANTI KOPTU', { ...stil, fontSize: '26px', color: '#FF5A5A' }).setOrigin(0.5).setVisible(false);
  ic.add([zemin, goruntu, gurultu, baslik, canli, koptu]);
  ic.setVisible(false);
  kap.add(ic);
  let kesildi = false;

  kap.guncelle = (zaman) => {
    if (!ic.visible) return;
    gurultu.tilePositionX = Math.random() * 256;
    gurultu.tilePositionY = Math.random() * 256;
    if (kesildi) return;
    // Telasli, sarsintili kamera; ara sira sinyal yirtilmasi
    goruntu.y = 4 + Math.sin(zaman / 140) * 1.5;
    goruntu.x = !ayarlar.hareketiAzalt && Math.random() < 0.04 ? (Math.random() - 0.5) * 14 : 0;
  };
  kap.olay = (ad) => {
    if (ad === 'ac') ekranAc(sahne, ic, 500);
    if (ad === 'sinyalKes') {
      sahne.tweens.add({
        targets: gurultu,
        alpha: 1,
        duration: 600,
        ease: titreme,
        onComplete: () => {
          kesildi = true;
          goruntu.setVisible(false);
          gurultu.setAlpha(0.35);
          canli.setText('● SİNYAL YOK').setColor('#9AA6B4');
          koptu.setVisible(true);
        }
      });
    }
  };
  return kap;
}
