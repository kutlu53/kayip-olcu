import { PEDAGOJIK } from '../config/colors.js';
import { buyukluk, izgarayaOturt, yaz } from './VectorMath.js';
import { YAZI } from '../ui/tipografi.js';

// Renk kodlamasi oyun boyunca sabit; renk korlugu icin desen de farkli (CLAUDE.md §10.5)
export const STILLER = {
  vektor: { renk: PEDAGOJIK.vektor, kalinlik: 4 },
  bileske: { renk: PEDAGOJIK.bileske, kalinlik: 7 },
  bilesen: { renk: PEDAGOJIK.bilesen, kalinlik: 4, kesikli: true },
  kopya: { renk: PEDAGOJIK.vektor, kalinlik: 2, kesikli: true, alfa: 0.7 },
  skaler: { renk: PEDAGOJIK.skaler, kalinlik: 2 }
};

// Fizik koordinatlari (birim, y yukari) <-> ekran pikseli
export class Izgara {
  constructor({ x, y, birim = 48, sol = -1, sag = 10, alt = -1, ust = 6 }) {
    Object.assign(this, { x, y, birim, sol, sag, alt, ust });
  }
  ekran([wx, wy]) {
    return [this.x + wx * this.birim, this.y - wy * this.birim];
  }
  dunya(px, py) {
    return [(px - this.x) / this.birim, (this.y - py) / this.birim];
  }
  ciz(g, { eksenler = true, alfa = 1 } = {}) {
    const [x0, y0] = this.ekran([this.sol, this.ust]);
    const [x1, y1] = this.ekran([this.sag, this.alt]);
    g.fillStyle(0x05070d, 0.55 * alfa).fillRect(x0, y0, x1 - x0, y1 - y0);
    g.lineStyle(1, 0x8a96a6, 0.16 * alfa);
    for (let i = this.sol; i <= this.sag; i++) g.lineBetween(...this.ekran([i, this.alt]), ...this.ekran([i, this.ust]));
    for (let j = this.alt; j <= this.ust; j++) g.lineBetween(...this.ekran([this.sol, j]), ...this.ekran([this.sag, j]));
    if (eksenler) {
      g.lineStyle(1.5, 0x8a96a6, 0.45 * alfa);
      g.lineBetween(...this.ekran([this.sol, 0]), ...this.ekran([this.sag, 0]));
      g.lineBetween(...this.ekran([0, this.alt]), ...this.ekran([0, this.ust]));
    }
  }
}

// Ok: govde + ucgen bas. Kesikli stilde govde parcali cizilir
export function okCiz(g, x1, y1, x2, y2, stil = STILLER.vektor) {
  const { renk, kalinlik = 4, kesikli = false, alfa = 1 } = stil;
  const boy = Math.hypot(x2 - x1, y2 - y1);
  if (boy < 1) return;
  const ux = (x2 - x1) / boy;
  const uy = (y2 - y1) / boy;
  const bas = Math.min(10 + kalinlik * 2, boy * 0.6);
  const gx = x2 - ux * bas * 0.8;
  const gy = y2 - uy * bas * 0.8;
  g.lineStyle(kalinlik, renk, alfa);
  if (kesikli) {
    for (let d = 0; d < boy - bas * 0.8; d += 16) {
      const e = Math.min(d + 9, boy - bas * 0.8);
      g.lineBetween(x1 + ux * d, y1 + uy * d, x1 + ux * e, y1 + uy * e);
    }
  } else {
    g.lineBetween(x1, y1, gx, gy);
  }
  const genis = bas * 0.55;
  g.fillStyle(renk, alfa);
  g.fillTriangle(x2, y2, x2 - ux * bas - uy * genis, y2 - uy * bas + ux * genis, x2 - ux * bas + uy * genis, y2 - uy * bas - ux * genis);
}

export function izgaradaOk(g, izgara, kuyruk, v, stil) {
  const [x1, y1] = izgara.ekran(kuyruk);
  const [x2, y2] = izgara.ekran([kuyruk[0] + v[0], kuyruk[1] + v[1]]);
  okCiz(g, x1, y1, x2, y2, stil);
}

// Surukle-birak vektor. kip 'uc': ucu suruklenir (vektor degisir); kip 'tasi': butun ok tasinir (kuyruk degisir).
// kisit(v veya kuyruk) -> izin verilen deger (eksen boyunca, sinirlar icinde vb.)
export class SuruklenebilirVektor {
  constructor(sahne, izgara, { kuyruk = [0, 0], v = [1, 0], kip = 'uc', stil = STILLER.vektor, etiket = '', birimAdi = 'm', adim = 1, kisit = null, degisti = null, birakildi = null, etiketYonu = 1 }) {
    Object.assign(this, { sahne, izgara, kuyruk: [...kuyruk], v: [...v], kip, stil, etiket, birimAdi, adim, kisit, degisti, birakildi, etiketYonu });
    this.g = sahne.add.graphics();
    this.yazi = sahne.add
      .text(0, 0, '', { fontFamily: YAZI, fontSize: '17px', fontStyle: 'bold', color: '#' + stil.renk.toString(16).padStart(6, '0'), backgroundColor: 'rgba(5,7,13,0.75)', padding: { x: 5, y: 2 } })
      .setOrigin(0.5);
    // Gorunmez tutamac: 64 px dokunma hedefi
    this.tutamac = sahne.add.zone(0, 0, 64, 64).setInteractive({ draggable: true, useHandCursor: true });
    this.halka = sahne.add.graphics();
    this.aktif = true;
    this.tutamac.on('drag', (isaretci) => this.surukle(isaretci.x, isaretci.y));
    this.tutamac.on('dragend', () => this.birakildi && this.birakildi(this));
    this.ciz();
  }

  tutamacNoktasi() {
    if (this.kip === 'uc') return [this.kuyruk[0] + this.v[0], this.kuyruk[1] + this.v[1]];
    return [this.kuyruk[0] + this.v[0] * 0.5, this.kuyruk[1] + this.v[1] * 0.5];
  }

  surukle(px, py) {
    if (!this.aktif) return;
    const [wx, wy] = this.izgara.dunya(px, py);
    if (this.kip === 'uc') {
      let v = [wx - this.kuyruk[0], wy - this.kuyruk[1]];
      if (this.adim) v = izgarayaOturt(v, this.adim);
      if (this.kisit) v = this.kisit(v);
      this.v = v;
    } else {
      let k = [wx - this.v[0] * 0.5, wy - this.v[1] * 0.5];
      if (this.adim) k = izgarayaOturt(k, this.adim);
      if (this.kisit) k = this.kisit(k);
      this.kuyruk = k;
    }
    this.ciz();
    if (this.degisti) this.degisti(this);
  }

  ayarla({ kuyruk, v } = {}) {
    if (kuyruk) this.kuyruk = [...kuyruk];
    if (v) this.v = [...v];
    this.ciz();
  }

  ciz() {
    const g = this.g;
    g.clear();
    izgaradaOk(g, this.izgara, this.kuyruk, this.v, this.stil);
    const [tx, ty] = this.izgara.ekran(this.tutamacNoktasi());
    this.tutamac.setPosition(tx, ty);
    this.halka.clear();
    if (this.aktif) {
      this.halka.lineStyle(2, 0xffffff, 0.85).strokeCircle(tx, ty, 13);
      this.halka.fillStyle(0xffffff, 0.12).fillCircle(tx, ty, 13);
    }
    const [ox, oy] = this.izgara.ekran([this.kuyruk[0] + this.v[0] * 0.5, this.kuyruk[1] + this.v[1] * 0.5]);
    const boy = Math.hypot(this.v[0], this.v[1]) || 1;
    // Etiket okun soluna (normali yonunde) kaydirilir
    const nx = (-this.v[1] / boy) * this.etiketYonu;
    const ny = (this.v[0] / boy) * this.etiketYonu;
    const metin = this.etiket ? `${this.etiket} = ${yaz(buyukluk(this.v))} ${this.birimAdi}` : `${yaz(buyukluk(this.v))} ${this.birimAdi}`;
    this.yazi.setText(metin).setPosition(ox + nx * 26, oy - ny * 26).setVisible(buyukluk(this.v) > 0.01);
  }

  kilitle(kilitli = true) {
    this.aktif = !kilitli;
    if (kilitli) this.tutamac.disableInteractive();
    else this.tutamac.setInteractive({ draggable: true, useHandCursor: true });
    this.ciz();
  }

  nesneler() {
    return [this.g, this.halka, this.yazi, this.tutamac];
  }

  destroy() {
    for (const n of this.nesneler()) n.destroy();
  }
}

