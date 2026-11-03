import { modalAc } from './Panel.js';
import { dugme } from './Dugme.js';
import { YAZI, yaziTipiYukle } from './tipografi.js';
import { ayarlar, kaydet } from '../config/settings.js';
import { KADEMELER, kademeAdi, sonrakiKademe } from '../fx/Quality.js';
import { sesSeviyesiUygula } from '../systems/Ses.js';
import { sesleriYukle, sesSec, sesAdi, sesleriDene, durdur as okumaDurdur } from '../systems/SesliOkuma.js';

const SIRA = (liste, deger) => liste[(liste.indexOf(deger) + 1) % liste.length];

// Ayarlar penceresi (CLAUDE.md §10.6, §10.8, §5 zor mod)
export function ayarlarAc(sahne) {
  const satirlar = [
    {
      ad: 'Görsel kalite',
      aciklama: 'Eski akıllı tahtalarda “Düşük” daha akıcı çalışır.',
      deger: () => KADEMELER[kademeAdi()].ad,
      degistir: () => sonrakiKademe()
    },
    {
      ad: 'Hareketi azalt',
      aciklama: 'Kamera sarsıntısı, flaş ve bozulma efekti kapanır.',
      deger: () => (ayarlar.hareketiAzalt ? 'Açık' : 'Kapalı'),
      degistir: () => (ayarlar.hareketiAzalt = !ayarlar.hareketiAzalt)
    },
    {
      ad: 'Yazı tipi',
      aciklama: 'Yönergeler, konuşmalar, altyazılar ve defter OpenDyslexic ile yazılır.',
      deger: () => (ayarlar.yaziTipi === 'disleksi' ? 'Disleksiye uygun' : 'Standart'),
      degistir: () => (ayarlar.yaziTipi = ayarlar.yaziTipi === 'disleksi' ? 'sistem' : 'disleksi'),
      yaziTipi: true
    },
    {
      ad: 'Altyazı boyutu',
      aciklama: 'Ara sahne altyazıları ve ARGE ile Elif’in konuşmaları.',
      deger: () => ({ normal: 'Normal', buyuk: 'Büyük', cokBuyuk: 'Çok büyük' }[ayarlar.altyazi] || 'Normal'),
      degistir: () => (ayarlar.altyazi = SIRA(['normal', 'buyuk', 'cokBuyuk'], ayarlar.altyazi))
    },
    {
      ad: 'Sesli okuma',
      aciklama: 'Konuşmaları tarayıcının Türkçe sesi okur. Altyazı her zaman açıktır.',
      deger: () => ({ acik: 'Açık', sahneler: 'Yalnızca ara sahneler', kapali: 'Kapalı' }[ayarlar.sesliOkuma] || 'Açık'),
      degistir: () => {
        ayarlar.sesliOkuma = SIRA(['acik', 'sahneler', 'kapali'], ayarlar.sesliOkuma || 'acik');
        if (ayarlar.sesliOkuma === 'kapali') okumaDurdur();
      }
    },
    {
      ad: 'Müzik',
      aciklama: 'Ortam müziği; geri sayım yaklaştıkça nabız hızlanır.',
      deger: () => (ayarlar.muzik === false ? 'Kapalı' : 'Açık'),
      degistir: () => (ayarlar.muzik = ayarlar.muzik === false)
    },
    {
      ad: 'Ses efektleri',
      aciklama: 'Kilit, gövde titreşimi ve dokunma sesleri.',
      deger: () => (ayarlar.efekt === false ? 'Kapalı' : 'Açık'),
      degistir: () => (ayarlar.efekt = ayarlar.efekt === false)
    },
    {
      ad: 'Zor mod (fen lisesi)',
      aciklama: 'Bileşenlere ayırmada açı ve sin/cos verilir (Bölüm 4 ve 7).',
      deger: () => (ayarlar.zorMod ? 'Açık' : 'Kapalı'),
      degistir: () => (ayarlar.zorMod = !ayarlar.zorMod)
    }
  ];

  return modalAc(sahne, 'AYARLAR', (kap, alan) => {
    satirlar.forEach((s, i) => {
      const y = alan.ust + 22 + i * 62;
      kap.add(sahne.add.text(alan.sol, y - 13, s.ad, { fontFamily: YAZI, fontSize: '20px', fontStyle: 'bold', color: '#D8F6FF' }).setOrigin(0, 0.5));
      kap.add(sahne.add.text(alan.sol, y + 13, s.aciklama, { fontFamily: YAZI, fontSize: '14px', color: '#8A96A6', wordWrap: { width: alan.genislik - 300 } }).setOrigin(0, 0.5));
      const d = dugme(sahne, alan.sol + alan.genislik - 130, y, s.deger(), async () => {
        s.degistir();
        kaydet();
        sesSeviyesiUygula();
        d.yaziAyarla(s.deger());
        // Okuma yazi tipi sonraki metinlerde kullanilir; once dosya yuklenir
        if (s.yaziTipi) await yaziTipiYukle();
      }, { genislik: 280, yukseklik: 52, boyut: 17 });
      kap.add(d);
    });

    // Bu cihazdaki Turkce sesler: ogretmen derse girmeden tahtada bir kez kontrol eder
    const sy = alan.ust + 22 + satirlar.length * 62 + 4;
    const bilgi = sahne.add.text(alan.sol, sy, 'Türkçe sesler aranıyor…', { fontFamily: YAZI, fontSize: '15px', color: '#9FE9EC', wordWrap: { width: alan.genislik - 300 }, lineSpacing: 3 }).setOrigin(0, 0.5);
    kap.add(bilgi);
    kap.add(dugme(sahne, alan.sol + alan.genislik - 130, sy, '▶  Sesleri dene', () => sesleriDene(), { genislik: 280, yukseklik: 52, boyut: 17 }));
    sesleriYukle().then((liste) => {
      if (!bilgi.active) return;
      if (!liste.length) return bilgi.setText('Bu cihazda Türkçe ses yok: konuşmalar yalnızca altyazıyla gösterilir.');
      const ad = (k) => sesAdi(sesSec(k).ses);
      bilgi.setText(`Elif: ${ad('Elif')} · Kerem, Feza: ${ad('Kerem')} · ARGE: ${ad('ARGE')}
Çevrim içi sesler internet yoksa yerel sese geçer.`);
    });
  }, { genislik: 920, yukseklik: 700 });
}
