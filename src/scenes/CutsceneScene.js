import Phaser from 'phaser';
import araSahneler from '../data/cutscenes.json';
import kompozisyonlar from '../data/scenes.json';
import { KATMANLAR } from '../art/Katmanlar.js';
import { kademe, kaliteYeterli } from '../fx/Quality.js';
import { SinemaFX } from '../fx/Shaders.js';
import { sars, flas, bozulma } from '../fx/CameraFX.js';
import { aktifOyuncu, aktifiKaydet } from '../systems/SaveSystem.js';
import { olayKaydet } from '../systems/Telemetry.js';
import { efekt, muzikBaslat, seslendirmeCal, seslendirmeDurdur } from '../systems/Ses.js';
import { guc } from '../systems/SaveSystem.js';
import { oku, durdur as okumaDurdur } from '../systems/SesliOkuma.js';
import { sablonDoldur } from '../systems/DialogueSystem.js';

// Katman olaylarinin sesi; JSON'da bir olaya "ses" alani eklenirse o calar
const OLAY_SESLERI = { kilitle: 'kilit', atesle: 'itici', isiklariSondur: 'gucKesik', isiklariYak: 'gucAcik' };

const CX = 640;
const CY = 360;
const YONLER = { sag: [1, 0], sol: [-1, 0], yukari: [0, -1], asagi: [0, 1] };

// cutscenes.json'daki bir ara sahneyi panel panel oynatir (CLAUDE.md §8, §11).
// Altyazi, sinema seritleri ve dugmeler ayri sahnede (CutsceneOverlay): bozulma efektinden etkilenmezler
export default class CutsceneScene extends Phaser.Scene {
  constructor() {
    super('CutsceneScene');
  }

  init(veri) {
    this.tanim = araSahneler.find((s) => s.id === (veri.id || 'G'));
    this.baslangicPaneli = Phaser.Math.Clamp(veri.panel || 0, 0, this.tanim.paneller.length - 1);
    this.donus = veri.donus || 'MenuScene';
    this.panel = null;
    this.eskiPanel = null;
    this.geciste = false;
    this.bitiyor = false;
  }

  create() {
    // Opak zemin sart: saydam zeminde toplamali (ADD) isiklar son islemede dikdortgen izler birakir
    this.cameras.main.setBackgroundColor('#05070D');
    this.efektleriKur();
    // Dokular bastan cizilir: panel gecislerinde takilma olmasin
    for (const p of this.tanim.paneller) {
      for (const k of this.katmanlar(p)) {
        const tur = KATMANLAR[k.tip];
        if (tur && tur.hazirla) tur.hazirla(this, k.ayar || {});
      }
    }
    this.events.once('shutdown', () => {
      seslendirmeDurdur();
      okumaDurdur();
      this.scene.stop('CutsceneOverlay');
    });
    muzikBaslat(guc());
    this.scene.launch('CutsceneOverlay', { sahne: this });
  }

  overlayHazir(overlay) {
    this.overlay = overlay;
    this.panelNo = this.baslangicPaneli;
    this.panel = this.panelKur(this.tanim.paneller[this.panelNo]);
    this.cameras.main.fadeIn(1400, 0, 0, 0);
  }

  efektleriKur() {
    this.sinemaFX = null;
    const postFX = kademe().postFX;
    if (this.game.renderer.type !== Phaser.WEBGL || postFX === 'kapali') return;
    const yonetici = this.renderer.pipelines;
    if (!yonetici.postPipelineClasses.has('SinemaFX')) yonetici.addPostPipeline('SinemaFX', SinemaFX);
    this.cameras.main.setPostPipeline('SinemaFX');
    const fx = this.cameras.main.getPostPipeline('SinemaFX');
    this.sinemaFX = Array.isArray(fx) ? fx[0] : fx;
    if (postFX === 'kismi') this.sinemaFX.gren = 0;
  }

  // Kompozisyon katmanlari + panele ozel ek katmanlar; katmanAyar ile ayar degerleri ezilebilir
  katmanlar(p) {
    const temel = (kompozisyonlar[p.sahne] && kompozisyonlar[p.sahne].katmanlar) || [];
    const ezme = p.katmanAyar || {};
    return [...temel, ...(p.ekKatmanlar || [])].map((k) => (ezme[k.id] ? { ...k, ayar: { ...k.ayar, ...ezme[k.id] } } : k));
  }

  panelKur(p) {
    const kok = this.add.container(0, 0);
    const panel = { tanim: p, kok, katmanlar: [], baslangic: this.time.now, zamanlayicilar: [] };
    for (const k of this.katmanlar(p)) {
      if (k.min && !kaliteYeterli(k.min)) continue;
      const tur = KATMANLAR[k.tip];
      if (!tur) {
        console.warn('Bilinmeyen katman tipi:', k.tip);
        continue;
      }
      const a = k.ayar || {};
      const nesne = tur.olustur(this, a);
      const L = { id: k.id, nesne, derinlik: k.derinlik || 0, sabit: !!k.sabit, yuvarlan: !!k.yuvarlan, x: CX + (a.x || 0), y: CY + (a.y || 0), olcek: a.olcek || 1 };
      nesne.setPosition(L.x, L.y).setScale(L.olcek);
      if (a.alfa !== undefined) nesne.setAlpha(a.alfa);
      kok.add(nesne);
      panel.katmanlar.push(L);
    }

    const zamanla = (ms, fn) => panel.zamanlayicilar.push(this.time.delayedCall(ms, fn));
    for (const o of p.olaylar || []) zamanla(o.ms, () => this.olayCalistir(o, panel));
    for (const b of p.basliklar || []) zamanla(b.ms, () => this.overlay.baslik(b));
    for (const s of p.altyazilar || []) {
      zamanla(s.ms, () => {
        this.overlay.altyazi(s);
        if (s.ses) seslendirmeCal(s.ses);
        else oku(s.konusan, sablonDoldur(s.metin), { sureMs: s.sureMs, bozuk: s.bozuk, kaynak: 'sahne' });
        if (s.konusan === 'ARGE') panel.katmanlar.forEach((L) => L.nesne.konus && L.nesne.konus(s.sureMs));
      });
    }
    zamanla(p.sureMs, () => this.sonraki());
    this.kameraUygula(panel, this.time.now);
    return panel;
  }

  olayCalistir(o, panel) {
    if (o.fx === 'sars') sars(this, o.sure, o.siddet);
    else if (o.fx === 'flas') flas(this, o.sure);
    else if (o.fx === 'bozulma') bozulma(this, o.sure, o.guc);
    if (o.ses || OLAY_SESLERI[o.olay]) efekt(o.ses || OLAY_SESLERI[o.olay]);
    if (o.hedef) {
      const L = panel.katmanlar.find((k) => k.id === o.hedef);
      if (L && L.nesne.olay) L.nesne.olay(o.olay, o);
    }
  }

  // Sanal kamera: yakin katmanlar daha cok kayar ve buyur (parallax -> derinlik hissi)
  kameraUygula(panel, zaman) {
    const k = panel.tanim.kamera || {};
    const p = Phaser.Math.Clamp((zaman - panel.baslangic) / panel.tanim.sureMs, 0, 1);
    const e = Phaser.Math.Easing.Sine.InOut(p);
    const [yx, yy] = YONLER[k.yon] || [0, 0];
    const m = k.mesafe || 0;
    const [z0, z1] = k.zoom || [1, 1];
    const z = z0 + (z1 - z0) * e;
    for (const L of panel.katmanlar) {
      if (L.sabit) continue;
      const ox = -yx * m * L.derinlik * (e - 0.5);
      const oy = -yy * m * L.derinlik * (e - 0.5);
      const s = 1 + (z - 1) * (0.35 + 0.65 * L.derinlik);
      let px = (L.x - CX + ox) * s;
      let py = (L.y - CY + oy) * s;
      // Yatma (roll): kamera istasyona bagli, istasyon donunce dis manzara doner
      if (k.roll && L.yuvarlan) {
        const r = ((k.roll[0] + (k.roll[1] - k.roll[0]) * e) * Math.PI) / 180;
        [px, py] = [px * Math.cos(r) - py * Math.sin(r), px * Math.sin(r) + py * Math.cos(r)];
        L.nesne.rotation = r;
      }
      L.nesne.setPosition(CX + px, CY + py).setScale(L.olcek * s);
    }
  }

  update(zaman, delta) {
    for (const panel of [this.eskiPanel, this.panel]) {
      if (!panel) continue;
      this.kameraUygula(panel, zaman);
      for (const L of panel.katmanlar) if (L.nesne.guncelle) L.nesne.guncelle(zaman, delta);
    }
  }

  sonraki() {
    if (this.geciste || this.bitiyor || !this.panel) return;
    if (this.panelNo + 1 >= this.tanim.paneller.length) this.bitir();
    else this.panelDegistir(this.panelNo + 1);
  }

  panelDegistir(no) {
    const yeni = this.tanim.paneller[no];
    const eski = this.panel;
    for (const z of eski.zamanlayicilar) z.remove(false);
    this.overlay.temizle();
    this.panelNo = no;
    const kur = () => (this.panel = this.panelKur(yeni));
    const kam = this.cameras.main;

    switch (yeni.gecis) {
      case 'fadeBlack':
        this.geciste = true;
        kam.fadeOut(450, 0, 0, 0);
        kam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          eski.kok.destroy();
          kur();
          kam.fadeIn(700, 0, 0, 0);
          this.geciste = false;
        });
        break;
      case 'crossDissolve':
        this.geciste = true;
        this.eskiPanel = eski;
        kur();
        this.panel.kok.setAlpha(0);
        this.tweens.add({
          targets: this.panel.kok,
          alpha: 1,
          duration: 1200,
          onComplete: () => {
            eski.kok.destroy();
            this.eskiPanel = null;
            this.geciste = false;
          }
        });
        break;
      case 'flashWhite':
        flas(this, 450);
        eski.kok.destroy();
        kur();
        break;
      case 'glitch':
        this.geciste = true;
        bozulma(this, 600, 1);
        this.time.delayedCall(250, () => {
          eski.kok.destroy();
          kur();
          this.geciste = false;
        });
        break;
      default:
        eski.kok.destroy();
        kur();
    }
  }

  bitir(atlandi = false) {
    if (this.bitiyor) return;
    this.bitiyor = true;
    if (atlandi) olayKaydet('sahneAtla', { ayrinti: `${this.tanim.id} panel ${this.panelNo + 1}/${this.tanim.paneller.length}` });
    // Atlanan sahne de izlenmis sayilir; istasyon haritasindan tekrar izlenebilir
    const oyuncu = aktifOyuncu();
    if (oyuncu && this.tanim.id === 'G' && !oyuncu.girisIzlendi) {
      oyuncu.girisIzlendi = true;
      aktifiKaydet();
    }
    if (this.panel) for (const z of this.panel.zamanlayicilar) z.remove(false);
    if (this.overlay) this.overlay.kapat(900);
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(this.donus, { izlenen: this.tanim.id }));
  }
}
