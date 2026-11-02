import Phaser from 'phaser';
import karakterler from '../data/characters.json';
import { YAZI, aralikli } from '../ui/tipografi.js';

const SERIT = 92; // 2.39:1 sinema seridi: 1280 / 2.39 = 536 px goruntu
const BOZUK_HARFLER = '█▓▒░#%&?/<>01';

const bozukYap = (s, oran) =>
  s
    .split('')
    .map((c) => (c !== ' ' && Math.random() < oran ? BOZUK_HARFLER[(Math.random() * BOZUK_HARFLER.length) | 0] : c))
    .join('');

// Ara sahnenin ustundeki katman: sinema seritleri, altyazi (her zaman acik), baslik kartlari, Atla dugmesi
export default class CutsceneOverlay extends Phaser.Scene {
  constructor() {
    super('CutsceneOverlay');
  }

  init(veri) {
    this.sahne = veri.sahne;
  }

  create() {
    this.ust = this.add.rectangle(640, -SERIT / 2, 1280, SERIT, 0x000000);
    this.alt = this.add.rectangle(640, 720 + SERIT / 2, 1280, SERIT, 0x000000);
    this.tweens.add({ targets: this.ust, y: SERIT / 2, duration: 900, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: this.alt, y: 720 - SERIT / 2, duration: 900, ease: 'Cubic.easeOut' });

    this.konusan = this.add.text(640, 720 - SERIT + 8, '', { fontFamily: YAZI, fontSize: '15px', fontStyle: 'bold', color: '#5FE3E8' }).setOrigin(0.5, 0);
    this.metin = this.add
      .text(640, 720 - SERIT + 30, '', { fontFamily: YAZI, fontSize: '24px', color: '#EEF3F7', align: 'center', wordWrap: { width: 1080 }, lineSpacing: 2 })
      .setOrigin(0.5, 0);
    this.baslikYazi = this.add
      .text(640, 520, '', { fontFamily: YAZI, fontSize: '26px', color: '#E6E8EB' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setShadow(0, 0, '#000000', 8, false, true);

    // Atla dugmesi: 140 x 52 px dokunma hedefi
    const atla = this.add.container(1190, 46).setAlpha(0);
    const zemin = this.add.graphics();
    zemin.lineStyle(2, 0x5fe3e8, 0.7).strokeRoundedRect(-70, -26, 140, 52, 10);
    atla.add([zemin, this.add.text(0, 0, 'ATLA  ▸▸', { fontFamily: YAZI, fontSize: '19px', color: '#D8F6FF' }).setOrigin(0.5)]);
    atla.setSize(140, 52).setInteractive({ useHandCursor: true });
    atla.on('pointerup', () => this.sahne.bitir());
    const ipucu = this.add
      .text(28, 46, 'Dokun ▸ sonraki sahne', { fontFamily: YAZI, fontSize: '15px', color: '#8A96A6' })
      .setOrigin(0, 0.5)
      .setAlpha(0);
    this.tweens.add({ targets: atla, alpha: 0.85, duration: 600, delay: 900 });
    this.tweens.add({ targets: ipucu, alpha: 0.6, duration: 600, delay: 900 });
    this.dugmeler = [atla, ipucu];

    this.input.on('pointerdown', (isaretci, uzerindekiler) => {
      if (uzerindekiler.length === 0) this.sahne.sonraki();
    });
    if (this.input.keyboard) {
      for (const tus of ['SPACE', 'ENTER', 'RIGHT']) this.input.keyboard.on(`keydown-${tus}`, () => this.sahne.sonraki());
      this.input.keyboard.on('keydown-ESC', () => this.sahne.bitir());
    }
    this.sahne.overlayHazir(this);
  }

  altyazi({ konusan, metin, sureMs = 3000, bozuk = false }) {
    this.temizle();
    const k = karakterler[konusan] || { ad: konusan || '', renk: '#E6E8EB' };
    this.konusan.setText(k.ad ? aralikli(k.ad) : '').setColor(k.renk).setAlpha(1);
    const sistem = konusan === 'Sistem';
    this.metin.setAlpha(1).setColor(sistem ? '#9AA6B4' : '#EEF3F7').setFontStyle(sistem ? 'italic' : 'normal');

    // Daktilo efekti; ARGE bozukken harfler arada bir bozulur
    let i = 0;
    this.yazici = this.time.addEvent({
      delay: 30,
      repeat: metin.length - 1,
      callback: () => {
        i += 1;
        this.metin.setText(bozuk ? bozukYap(metin.slice(0, i), 0.12) : metin.slice(0, i));
      }
    });
    if (bozuk) {
      this.bozucu = this.time.addEvent({
        delay: 160,
        loop: true,
        callback: () => {
          if (i >= metin.length) this.metin.setText(bozukYap(metin, 0.06));
        }
      });
    }
    this.silici = this.time.delayedCall(sureMs, () => {
      if (this.bozucu) this.bozucu.remove(false);
      if (bozuk) this.metin.setText(metin);
      this.tweens.add({ targets: [this.konusan, this.metin], alpha: 0, duration: 300 });
    });
  }

  temizle() {
    for (const z of [this.yazici, this.bozucu, this.silici]) if (z) z.remove(false);
    this.tweens.killTweensOf([this.konusan, this.metin]);
    this.konusan.setText('');
    this.metin.setText('');
  }

  baslik({ metin, sureMs = 3000 }) {
    this.tweens.killTweensOf(this.baslikYazi);
    this.baslikYazi.setText(aralikli(metin)).setAlpha(0);
    this.tweens.add({ targets: this.baslikYazi, alpha: 1, duration: 800, hold: sureMs, yoyo: true });
  }

  kapat(ms) {
    this.temizle();
    this.tweens.add({ targets: [...this.dugmeler, this.baslikYazi], alpha: 0, duration: ms / 2 });
    this.tweens.add({ targets: this.ust, y: -SERIT / 2, duration: ms, ease: 'Cubic.easeIn' });
    this.tweens.add({ targets: this.alt, y: 720 + SERIT / 2, duration: ms, ease: 'Cubic.easeIn' });
  }
}
