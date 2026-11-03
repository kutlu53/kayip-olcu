import Phaser from 'phaser';
import { dokuCiz, yumusakDaire, yuvarlakDikdortgen, poligon } from './Tuval.js';
import { MONO } from '../ui/tipografi.js';

// ---------- Tibbi kapsul (yandan; burun saga, porta bakar) ----------
// Doku 240x110, merkez (120, 55). Burun ucu yerel x = +112
export const KAPSUL_BURUN = 112;
// Sizinti deligi ust arkada: gaz geriye-yukari puskurur, tepki kuvveti kapsulu ileri-asagi iter
export const SIZINTI_NOKTASI = [-65, -29];

// govdeYazi: ayni govde finalde kurtarma araci olarak da kullanilir
export function tibbiKapsulDokusu(sahne, govdeYazi = 'TIBBİ') {
  return dokuCiz(sahne, govdeYazi === 'TIBBİ' ? 'tibbi_kapsul' : `kapsul_${govdeYazi}`, 240, 110, (c) => {
    // Motor nozulu
    poligon(c, [[16, 40], [42, 34], [42, 76], [16, 70]], '#3a4250');
    // Govde (isik sol ustten)
    const g = c.createLinearGradient(0, 25, 0, 85);
    g.addColorStop(0, '#eef1f4');
    g.addColorStop(0.55, '#b7bec8');
    g.addColorStop(1, '#6d7682');
    c.fillStyle = g;
    yuvarlakDikdortgen(c, 40, 25, 152, 60, 10);
    c.fill();
    // Kenetlenme adaptoru ve halka
    poligon(c, [[190, 30], [222, 40], [222, 70], [190, 80]], '#9aa3ae');
    c.fillStyle = '#5d6672';
    c.fillRect(222, 42, 10, 26);
    // Panel cizgileri, serit, yazi
    c.strokeStyle = 'rgba(40,50,62,0.35)';
    c.lineWidth = 1;
    for (const x of [82, 122, 162]) {
      c.beginPath();
      c.moveTo(x, 26);
      c.lineTo(x, 84);
      c.stroke();
    }
    c.fillStyle = '#26324a';
    c.fillRect(40, 62, 152, 6);
    c.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    c.fillStyle = '#26324a';
    c.fillText(govdeYazi, govdeYazi.length > 6 ? 84 : 92, 52);
    // Pencereler
    c.fillStyle = '#10161f';
    for (const x of [166, 180]) {
      c.beginPath();
      c.arc(x, 42, 4, 0, Math.PI * 2);
      c.fill();
    }
    // Yon itici bloklari
    c.fillStyle = '#4a5260';
    for (const [x, y] of [[58, 20], [58, 84], [170, 20], [170, 84]]) c.fillRect(x, y, 12, 6);
    // Sizinti deligi
    c.fillStyle = '#1a1010';
    c.beginPath();
    c.arc(120 + SIZINTI_NOKTASI[0], 55 + SIZINTI_NOKTASI[1] + 3, 3, 0, Math.PI * 2);
    c.fill();
    // Ust kenar isigi
    c.strokeStyle = 'rgba(255,248,235,0.7)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(48, 26);
    c.lineTo(186, 26);
    c.stroke();
  });
}

// Gaz bulutu: mikro yercekiminde koni biciminde yayilip seyrelir
export function sizintiYayici(sahne, x, y, aciDerece = 217) {
  return sahne.add.particles(x, y, 'p_nokta', {
    speed: { min: 60, max: 150 },
    angle: { min: aciDerece - 13, max: aciDerece + 13 },
    lifespan: { min: 600, max: 1100 },
    scale: { start: 0.25, end: 1.5 },
    alpha: { start: 0.45, end: 0 },
    frequency: 45,
    quantity: 1
  });
}

export function tibbiKapsulOlustur(sahne, ayar = {}) {
  const kap = sahne.add.container(0, 0);
  const ic = sahne.add.container(0, 0);
  const govde = sahne.add.image(0, 0, tibbiKapsulDokusu(sahne, ayar.govdeYazi));
  ic.add(govde);
  let gaz = null;
  if (ayar.sizinti) {
    gaz = sizintiYayici(sahne, ...SIZINTI_NOKTASI);
    ic.add(gaz);
  }
  // Kenetlenme kilitleri (burunda)
  const kilitler = [-12, -4, 4, 12].map((dy) => sahne.add.image(KAPSUL_BURUN - 4, dy, 'p_nokta').setScale(0.35).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD));
  ic.add(kilitler);
  kap.add(ic);
  // Etiket araca baglidir (yanasirken onunla gider); hasarli kapsulde kirmizi, saglam aracta camgobegi
  if (ayar.etiket) {
    ic.add(
      sahne.add
        .text(-120, -95, ayar.etiket, { fontFamily: MONO, fontSize: '14px', color: ayar.sizinti === false ? '#5FE3E8' : '#FF8A8A', backgroundColor: 'rgba(5,7,13,0.7)', padding: { x: 6, y: 3 } })
        .setOrigin(0, 0.5)
    );
  }

  kap.guncelle = (zaman) => {
    if (ayar.yalpa) ic.rotation = Math.sin(zaman / 900) * 0.06;
  };
  kap.olay = (ad, o = {}) => {
    if (ad === 'yanas') sahne.tweens.add({ targets: ic, x: o.dx || 0, rotation: 0, duration: o.sure || 5000, ease: 'Sine.easeOut' });
    if (ad === 'sizintiDurdur' && gaz) gaz.stop();
    if (ad === 'kilitle') {
      if (gaz) gaz.stop();
      kilitler.forEach((k, i) => sahne.tweens.add({ targets: k, alpha: 1, delay: i * 450, duration: 150 }));
      const buhar = sahne.add.particles(KAPSUL_BURUN, 0, 'p_nokta', {
        emitting: false, speed: { min: 20, max: 70 }, angle: { min: 0, max: 360 }, lifespan: 1400,
        scale: { start: 0.4, end: 2 }, alpha: { start: 0.35, end: 0 }
      });
      ic.add(buhar);
      sahne.time.delayedCall(1900, () => buhar.explode(24));
    }
  };
  kap.ic = ic;
  return kap;
}

// ---------- Istasyonun kenetlenme portu (saga dayali gövde + porta cikan silindir) ----------
// Doku 420x720; port yuzu x=130, port ekseni y=360
export const PORT_YUZU = 130 - 210;

export function istasyonPortuDokusu(sahne) {
  return dokuCiz(sahne, 'istasyon_portu', 420, 720, (c) => {
    // Govde duvari
    const g = c.createLinearGradient(300, 0, 420, 0);
    g.addColorStop(0, '#3a4656');
    g.addColorStop(1, '#141b26');
    c.fillStyle = g;
    c.fillRect(300, 0, 120, 720);
    c.strokeStyle = 'rgba(0,0,0,0.5)';
    c.lineWidth = 2;
    for (let y = 40; y < 720; y += 90) {
      c.beginPath();
      c.moveTo(300, y);
      c.lineTo(420, y);
      c.stroke();
    }
    c.strokeStyle = 'rgba(220,230,240,0.35)';
    c.beginPath();
    c.moveTo(301, 0);
    c.lineTo(301, 720);
    c.stroke();
    // Port silindiri
    const s = c.createLinearGradient(0, 300, 0, 420);
    s.addColorStop(0, '#9aa3ae');
    s.addColorStop(0.5, '#5d6672');
    s.addColorStop(1, '#2b3542');
    c.fillStyle = s;
    c.fillRect(150, 305, 150, 110);
    // Kenetlenme halkasi
    c.fillStyle = '#c3cad3';
    c.fillRect(130, 290, 20, 140);
    c.fillStyle = '#2b3542';
    c.fillRect(134, 320, 12, 80);
    // Kenetlenme hedefi (levha + capraz)
    c.fillStyle = '#0d1117';
    c.beginPath();
    c.arc(220, 215, 34, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#e6e8eb';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(220, 190);
    c.lineTo(220, 240);
    c.moveTo(195, 215);
    c.lineTo(245, 215);
    c.stroke();
    c.fillStyle = '#6d7682';
    c.fillRect(216, 249, 8, 56);
    // Kilavuz isiklari (beyaz)
    c.globalCompositeOperation = 'lighter';
    for (const y of [296, 424]) yumusakDaire(c, 140, y, 12, '235,245,255', 0.9);
    c.globalCompositeOperation = 'source-over';
  });
}

export function istasyonPortuOlustur(sahne) {
  const kap = sahne.add.container(0, 0);
  kap.add(sahne.add.image(0, 0, istasyonPortuDokusu(sahne)));
  // Yanip sonen kilavuz isigi: saniyede bir, kisa
  const isik = sahne.add.image(PORT_YUZU + 10, 0, 'p_nokta').setBlendMode(Phaser.BlendModes.ADD).setScale(0.9);
  kap.add(isik);
  kap.guncelle = (zaman) => {
    isik.alpha = zaman % 1000 < 120 ? 1 : 0.15;
  };
  return kap;
}
