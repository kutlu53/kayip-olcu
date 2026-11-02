import Phaser from 'phaser';
import { rastgele } from './Rastgele.js';
import { ayarlar } from '../config/settings.js';

const SOLUK = [106, 138, 144];
const CAMGOBEGI = [95, 227, 232];
const BEYAZ = [216, 246, 255];
const PARLAMA = [[16, 0.05], [9, 0.1], [4, 0.3], [1.6, 0.95]];

const karistir = (a, b, t) =>
  Phaser.Display.Color.GetColor(...a.map((v, i) => Math.round(v + (b[i] - v) * t)));

// ARGE: isik halkasi + dalga formu. durum 0-7 = acilan sistem sayisi (CLAUDE.md §10.2)
export class Arge extends Phaser.GameObjects.Container {
  constructor(sahne, x, y, { yaricap = 100, durum = 7 } = {}) {
    super(sahne, x, y);
    this.yaricap = yaricap;
    this.durum = durum;
    this.konusma = 0;
    this.konusmaBitis = 0;
    this.tohum = 1;
    this.sonAdim = 0;
    this.g = sahne.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.g);
    sahne.add.existing(this);
  }

  konus(sureMs) {
    this.konusmaBitis = this.scene.time.now + sureMs;
  }

  durumaGec(hedef, sureMs) {
    this.scene.tweens.add({ targets: this, durum: hedef, duration: sureMs, ease: 'Sine.easeInOut' });
  }

  olay(ad, o) {
    if (ad === 'durum') this.durumaGec(o.deger, o.sure || 1000);
  }

  guncelle(zaman) {
    const g = this.g;
    g.clear();
    const t = zaman / 1000;
    const d = Phaser.Math.Clamp(this.durum / 7, 0, 1);
    const bozuk = Math.pow(1 - d, 1.4) * (ayarlar.hareketiAzalt ? 0.3 : 1);
    this.konusma += ((zaman < this.konusmaBitis ? 1 : 0) - this.konusma) * 0.12;

    // Bozulma her karede degil, adim adim degisir: goz yorulmasin
    if (zaman - this.sonAdim > 90 + d * 160) {
      this.sonAdim = zaman;
      this.tohum = (Math.random() * 1e9) | 0;
    }
    const r = rastgele(this.tohum);
    const renk = d > 0.85 ? karistir(CAMGOBEGI, BEYAZ, (d - 0.85) / 0.15) : karistir(SOLUK, CAMGOBEGI, d / 0.85);
    const R = this.yaricap * (1 + 0.025 * Math.sin(t * 1.7) * d);
    const k = this.yaricap / 100;
    const kayma = r() < bozuk * 0.5 ? (r() - 0.5) * R * 0.5 * bozuk : 0;
    const parlak = 0.5 + 0.5 * d;

    const parcalar = [];
    if (this.durum < 0.6) {
      // Cokmus: kirik yatay cizgi
      const n = 6;
      for (let i = 0; i < n; i++) {
        if (r() < 0.35) continue;
        const x1 = -R + (2 * R * i) / n + r() * 8;
        const x2 = x1 + ((2 * R) / n) * (0.3 + 0.6 * r());
        const y = (r() - 0.5) * 8 * k;
        parcalar.push([[x1 + kayma, y], [x2 + kayma, y]]);
      }
    } else {
      // Halka: bozukken kopuk yaylar, duzeldikce tek parca
      const parcaSayisi = d < 0.45 ? 7 : d < 0.7 ? 3 : 1;
      const bosluk = parcaSayisi === 1 ? 0 : Math.max(0.12, 0.6 - d * 0.7);
      for (let i = 0; i < parcaSayisi; i++) {
        const a0 = (i * Math.PI * 2) / parcaSayisi + t * 0.25;
        const yay = ((Math.PI * 2) / parcaSayisi) * (1 - bosluk);
        const sapma = (r() - 0.5) * bozuk * R * 0.15;
        const adim = Math.max(8, Math.ceil((48 * yay) / (Math.PI * 2)));
        const nokta = [];
        for (let j = 0; j <= adim; j++) {
          const a = a0 + (yay * j) / adim;
          nokta.push([kayma + Math.cos(a) * (R + sapma), sapma * 0.3 + Math.sin(a) * (R + sapma)]);
        }
        parcalar.push(nokta);
      }
      // Dalga formu: konusurken genligi artar
      const genlik = R * (0.04 + 0.26 * this.konusma * (0.65 + 0.35 * Math.sin(t * 21)));
      const dalga = [];
      for (let j = 0; j <= 40; j++) {
        const u = (j / 40) * 2 - 1;
        const zarf = Math.pow(Math.cos((u * Math.PI) / 2), 2);
        const y = genlik * zarf * (0.6 * Math.sin(u * 9 + t * 8) + 0.4 * Math.sin(u * 21 - t * 13)) + (r() - 0.5) * bozuk * 10 * k;
        dalga.push([u * R * 0.72 + kayma, y]);
      }
      parcalar.push(dalga);
    }

    for (const [kalinlik, alfa] of PARLAMA) {
      g.lineStyle(kalinlik * k, renk, alfa * parlak);
      for (const p of parcalar) {
        g.beginPath();
        g.moveTo(p[0][0], p[0][1]);
        for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]);
        g.strokePath();
      }
    }

    // Ic desen: sistemler geri geldikce ARGE'nin "yuzu" belirir
    if (this.durum > 5) {
      const a = Math.min(1, (this.durum - 5) / 2);
      g.fillStyle(renk, 0.8 * a);
      for (let i = 0; i < 6; i++) {
        const aci = t * 0.4 + (i * Math.PI) / 3;
        g.fillCircle(Math.cos(aci) * R * 0.46, Math.sin(aci) * R * 0.46, 2.4 * k);
      }
      g.lineStyle(1.2 * k, renk, 0.3 * a);
      g.strokeCircle(0, 0, R * 0.3);
    }
  }
}
