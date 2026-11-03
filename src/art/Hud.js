import { parcacikAkisiYayici } from '../fx/Particles.js';
import { MONO, aralikli } from '../ui/tipografi.js';

// Yorunge geri sayimi: gercek sure baskisi yok, yalnizca hikaye gerilimi (CLAUDE.md §6)
export function geriSayimOlustur(sahne, ayar = {}) {
  const kap = sahne.add.container(0, 0).setAlpha(0);
  const etiket = sahne.add
    .text(0, -36, aralikli('YÖRÜNGE DÜZELTMESİNE KALAN SÜRE'), { fontFamily: MONO, fontSize: '14px', color: '#D8F6FF' })
    .setOrigin(0.5)
    .setAlpha(0.75);
  const sayi = sahne.add
    .text(0, 0, '', { fontFamily: MONO, fontSize: '54px', fontStyle: 'bold', color: '#FF5A5A', padding: { x: 30, y: 24 } })
    .setOrigin(0.5)
    .setShadow(0, 0, '#ff3030', 18, false, true);
  kap.add([etiket, sayi]);

  let kalan = ayar.saniye !== undefined ? ayar.saniye : (ayar.saat || 72) * 3600;
  let son = 0;
  let aktif = false;
  const bicim = (s) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
  sayi.setText(bicim(kalan));

  kap.olay = (ad) => {
    if (ad === 'durdur') {
      aktif = false;
      sayi.setColor('#5FE3E8').setShadow(0, 0, '#5fe3e8', 18, false, true);
      etiket.setText('YÖRÜNGE GÜVENLİ');
      return;
    }
    if (ad !== 'goster') return;
    sahne.tweens.add({ targets: kap, alpha: 1, duration: 800 });
    aktif = true;
    son = sahne.time.now + 1500;
  };
  kap.guncelle = (zaman) => {
    if (aktif && zaman - son >= 1000) {
      son += 1000;
      kalan -= 1;
      sayi.setText(bicim(kalan));
    }
  };
  return kap;
}

// Yuklu parcacik akisi: gozle gorulmez, bu yuzden etiketli bir sensor goruntusu olarak cizilir
export function parcacikAkisiOlustur(sahne) {
  const kap = sahne.add.container(0, 0);
  const yayici = parcacikAkisiYayici(sahne, -700, 0, 720);
  const etiket = sahne.add
    .text(-600, -250, '◉ SENSÖR GÖRÜNTÜSÜ · YÜKLÜ PARÇACIK AKISI', { fontFamily: MONO, fontSize: '15px', color: '#CABDFF' })
    .setAlpha(0);
  kap.add([yayici, etiket]);
  kap.olay = (ad) => {
    if (ad === 'baslat') {
      yayici.start();
      sahne.tweens.add({ targets: etiket, alpha: 0.85, duration: 600 });
    }
    if (ad === 'durdur') yayici.stop();
  };
  return kap;
}
