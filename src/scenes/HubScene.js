import Phaser from 'phaser';
import bolumler from '../data/levels.json';
import araSahneler from '../data/cutscenes.json';
import { yildizDokusu } from '../art/Starfield.js';
import { dunyaDokusu } from '../art/Earth.js';
import { ustCubuk, UST_YUKSEKLIK } from '../ui/UstCubuk.js';
import { diyalogPaneli } from '../ui/DiyalogPaneli.js';
import { defterSimgesi } from '../ui/Defter.js';
import { dugme } from '../ui/Dugme.js';
import { YAZI, MONO, aralikli } from '../ui/tipografi.js';
import { aktifOyuncu, guc } from '../systems/SaveSystem.js';

// Istasyonun yan kesit haritasi: her bolme bir bolum (CLAUDE.md §10.4 Hub).
// [merkez x, merkez y, genislik, yukseklik]
const BOLMELER = {
  1: [475, 390, 160, 96],
  2: [295, 390, 140, 80],
  3: [475, 205, 140, 60],
  4: [125, 390, 120, 70],
  5: [655, 390, 140, 86],
  6: [830, 390, 70, 120],
  7: [475, 575, 150, 60]
};
// Enerji hatlari kontrol odasindan (cekirdek) disa dogru
const HATLAR = [[1, 2], [2, 4], [1, 5], [5, 6], [1, 3], [1, 7]];

export default class HubScene extends Phaser.Scene {
  constructor() {
    super('HubScene');
  }

  create() {
    this.oyuncu = aktifOyuncu();
    if (!this.oyuncu) {
      this.scene.start('MenuScene');
      return;
    }
    const n = guc(this.oyuncu);

    this.add.image(640, 360, yildizDokusu(this, { katman: 'uzak' }));
    this.add.image(640, 360, yildizDokusu(this, { katman: 'yakin' })).setAlpha(0.7);
    this.add.image(470, 480, dunyaDokusu(this, { ufukY: 660, safak: 'sol' })).setAlpha(0.8);

    this.harita = this.add.graphics();
    this.akis = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.bolmeleriKur();

    const cubuk = ustCubuk(this, { menuye: () => this.git('MenuScene') });
    cubuk.guncelle(this.oyuncu);
    cubuk.add(
      this.add
        .text(1146, UST_YUKSEKLIK / 2, `${this.oyuncu.takmaAd} · ${this.oyuncu.sinifKodu}`, { fontFamily: YAZI, fontSize: '14px', color: '#D8F6FF' })
        .setOrigin(1, 0.5)
    );
    this.panel = diyalogPaneli(this, { argeDurum: n });
    defterSimgesi(this, 64, 626, () => this.oyuncu);
    dugme(this, 790, 664, '↻  Girişi tekrar izle', () => this.git('CutsceneScene', { id: 'G', donus: 'HubScene' }), {
      genislik: 250,
      yukseklik: 50,
      boyut: 16
    });
    this.add.text(36, UST_YUKSEKLIK + 18, aralikli('GÖKTÜRK-7 · İSTASYON HARİTASI'), { fontFamily: MONO, fontSize: '13px', color: '#5FE3E8' }).setAlpha(0.8);

    this.time.delayedCall(500, () => this.karsila(n));
    this.cameras.main.fadeIn(700, 0, 0, 0);
  }

  // Bolum, kendinden onceki HAZIR bolumlerin hepsi tamamlaninca acilir.
  // Henuz yapilmamis bolumler sirayi kilitlemez (dikey dilim: Bolum 4 once oynanabilir)
  durum(b) {
    const s = this.oyuncu.sistemler;
    if (s.includes(b.bolum)) return 'tamam';
    return this.engel(b) ? 'kilitli' : 'acik';
  }

  engel(b) {
    return bolumler.find((o) => o.bolum < b.bolum && o.hazir && !this.oyuncu.sistemler.includes(o.bolum)) || null;
  }

  bolmeleriKur() {
    const g = this.harita;
    const enerjili = (b) => this.durum(bolumler[b - 1]) !== 'kilitli';

    // Kafes kirisler
    g.lineStyle(10, 0x1a2330, 1);
    for (const [a, b] of HATLAR) g.lineBetween(BOLMELER[a][0], BOLMELER[a][1], BOLMELER[b][0], BOLMELER[b][1]);
    g.lineStyle(1.5, 0x3a4656, 1);
    for (const [a, b] of HATLAR) g.lineBetween(BOLMELER[a][0], BOLMELER[a][1], BOLMELER[b][0], BOLMELER[b][1]);
    // Gunes paneli kanatlari ve kenetlenme halkasi
    const [px, py] = BOLMELER[3];
    for (const yon of [-1, 1]) {
      g.fillStyle(0x0b1a33, 1).fillRect(px + yon * 95 - 60, py - 22, 120, 44);
      g.lineStyle(1, 0x2a3f66, 1).strokeRect(px + yon * 95 - 60, py - 22, 120, 44);
    }
    g.lineStyle(6, 0x2b3542, 1).strokeCircle(BOLMELER[4][0] - 72, BOLMELER[4][1], 18);
    this.hatlar = HATLAR.filter(([a, b]) => enerjili(a) && enerjili(b) && this.durum(bolumler[a - 1]) === 'tamam');

    this.bolmeNesneleri = bolumler.map((b) => this.bolmeKur(b));
  }

  bolmeKur(b) {
    const [x, y, w, h] = BOLMELER[b.bolum];
    const durum = this.durum(b);
    const kap = this.add.container(x, y);
    const g = this.add.graphics();
    const halka = b.bolum === 6;

    const govde = durum === 'tamam' ? 0x223144 : durum === 'acik' ? 0x162030 : 0x0d131c;
    g.fillStyle(govde, 1);
    if (halka) {
      g.lineStyle(14, govde, 1).strokeEllipse(0, 0, w * 2, h * 2);
      g.fillCircle(0, 0, 22);
    } else {
      g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
    }
    g.lineStyle(2, durum === 'kilitli' ? 0x2b3542 : 0x5fe3e8, durum === 'kilitli' ? 1 : 0.6);
    if (halka) g.strokeEllipse(0, 0, w * 2 + 14, h * 2 + 14);
    else g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);

    // Pencereler: tamamlanmis bolmede sicak isik, acik bolmede soluk, kilitlide karanlik
    const pencereRenk = durum === 'tamam' ? 0xffd79a : durum === 'acik' ? 0x5fe3e8 : 0x1a222d;
    const pencereAlfa = durum === 'tamam' ? 0.95 : durum === 'acik' ? 0.35 : 1;
    g.fillStyle(pencereRenk, pencereAlfa);
    if (halka) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) g.fillCircle(Math.cos(a) * w, Math.sin(a) * h, 3);
    } else {
      for (let px = -w / 2 + 18; px <= w / 2 - 18; px += 18) g.fillRect(px - 4, -6, 8, 8);
    }
    kap.add(g);

    // Etiket
    const etiketY = halka ? h + 24 : h / 2 + 14;
    const ad = this.add
      .text(0, etiketY, `${b.bolum} · ${b.mekan.toLocaleUpperCase('tr')}`, {
        fontFamily: YAZI,
        fontSize: '13px',
        fontStyle: 'bold',
        color: durum === 'kilitli' ? '#6f7b8c' : '#D8F6FF',
        backgroundColor: 'rgba(5,7,13,0.8)',
        padding: { x: 6, y: 2 }
      })
      .setOrigin(0.5, 0);
    const alt = this.add
      .text(0, etiketY + 21, durum === 'tamam' ? `${b.ad} ${'★'.repeat(this.yildiz(b))}` : durum === 'acik' ? (b.hazir ? `SIRADAKİ GÖREV · ${b.ad}` : `${b.ad} · hazırlanıyor`) : b.ad, {
        fontFamily: YAZI,
        fontSize: '12px',
        color: durum === 'acik' && b.hazir ? '#5FE3E8' : durum === 'tamam' ? '#FFD79A' : '#8A96A6',
        backgroundColor: 'rgba(5,7,13,0.8)',
        padding: { x: 6, y: 1 }
      })
      .setOrigin(0.5, 0);
    kap.add([ad, alt]);
    if (durum === 'kilitli') kap.add(this.kilitCiz(halka ? 0 : w / 2 - 14, halka ? 0 : -h / 2 + 14));

    // Siradaki (oynanabilir) bolme nabiz gibi parlar
    if (durum === 'acik' && b.hazir) {
      const nabiz = this.add.graphics();
      nabiz.lineStyle(3, 0x5fe3e8, 1);
      if (halka) nabiz.strokeEllipse(0, 0, w * 2 + 26, h * 2 + 26);
      else nabiz.strokeRoundedRect(-w / 2 - 7, -h / 2 - 7, w + 14, h + 14, 20);
      kap.add(nabiz);
      this.tweens.add({ targets: nabiz, alpha: { from: 0.15, to: 0.9 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Dokunma alani (en az 48 px)
    const hw = Math.max(w + 20, halka ? w * 2 + 20 : 0, 96);
    const hh = Math.max(h + 50, halka ? h * 2 + 60 : 0, 80);
    kap.setSize(hw, hh).setInteractive({ useHandCursor: true });
    kap.on('pointerup', () => this.bolmeSec(b, durum));
    return kap;
  }

  yildiz(b) {
    const k = this.oyuncu.bolumler[b.bolum];
    return k ? k.yildiz || 0 : 0;
  }

  kilitCiz(x, y) {
    const g = this.add.graphics();
    g.lineStyle(2, 0x5d6878, 1).strokeCircle(x, y - 5, 5);
    g.fillStyle(0x5d6878, 1).fillRoundedRect(x - 7, y - 3, 14, 11, 2);
    return g;
  }

  karsila(n) {
    const ad = this.oyuncu.takmaAd;
    if (n === 0) {
      this.panel.argeSoyle('Ben… ARGE. Birim… tanımsız. Yön… tanımsız. Sen… kimsin?');
      this.karsilamaZamanlayici = this.time.delayedCall(2600, () =>
        this.panel.elifSoyle(`Hoş geldin ${ad}. Bu, istasyonun haritası. Işığı sönük her bölme kapalı bir sistem. Nabız gibi parlayan bölme seni bekliyor.`)
      );
    } else if (n < 7) {
      this.panel.argeSoyle(`${ad}, ${n} sistem yeniden çalışıyor. Sıradaki bölmeye enerji gidiyor.`);
    } else {
      this.panel.argeSoyle(`${ad}. Bütün sistemler çalışıyor. Göktürk-7 güvende.`);
    }
  }

  bolmeSec(b, durum) {
    // Oyuncu dokunursa bekleyen karsilama mesaji yaniti ezmesin
    if (this.karsilamaZamanlayici) this.karsilamaZamanlayici.remove(false);
    if (durum === 'kilitli') {
      this.panel.argeSoyle(`${b.mekan}… enerji yok. Önce ${this.engel(b).mekan} sistemini aç.`);
      return;
    }
    if (!b.hazir) {
      this.panel.argeSoyle(`${b.mekan}. Bölüm ${b.bolum}: ${b.ad}.`);
      this.panel.elifSoyle('Bu bölmenin onarımı henüz hazırlanıyor. Yakında buradan girebileceksin.');
      return;
    }
    // Acilis ara sahnesi varsa once o oynar, sonra bolum baslar
    const acilis = araSahneler.some((s) => s.id === b.acilisSahnesi);
    if (acilis) this.git('CutsceneScene', { id: b.acilisSahnesi, donus: b.sahne });
    else this.git(b.sahne);
  }

  git(sahne, veri) {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(sahne, veri));
  }

  update(zaman) {
    if (!this.panel) return;
    this.panel.guncelle(zaman);
    // Enerji akisi: acik sistemler arasinda hat boyunca kayan isik noktalari
    this.akis.clear();
    for (const [a, b] of this.hatlar) {
      const [x1, y1] = BOLMELER[a];
      const [x2, y2] = BOLMELER[b];
      const uzunluk = Math.hypot(x2 - x1, y2 - y1);
      for (let d = (zaman / 12) % 28; d < uzunluk; d += 28) {
        const u = d / uzunluk;
        this.akis.fillStyle(0x5fe3e8, 0.15).fillCircle(x1 + (x2 - x1) * u, y1 + (y2 - y1) * u, 6);
        this.akis.fillStyle(0xd8f6ff, 0.9).fillCircle(x1 + (x2 - x1) * u, y1 + (y2 - y1) * u, 2);
      }
    }
  }
}
