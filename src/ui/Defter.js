import Phaser from 'phaser';
import { modalAc } from './Panel.js';
import { cip } from './Cip.js';
import { dugme } from './Dugme.js';
import { YAZI, OKUMA, okumaBoyutu, aralikli } from './tipografi.js';
import bolumler from '../data/levels.json';
import { defterBolumleri, TUR_ADI, onayMetni, defterPdf, pdfDosyaAdi } from '../systems/Notebook.js';
import { oyuncuKaydet } from '../systems/SaveSystem.js';
import { olayKaydet, dosyaIndir } from '../systems/Telemetry.js';

// Gozlem Defteri simgesi (CLAUDE.md §6, alt kose)
export function defterSimgesi(sahne, x, y, oyuncuGetir, secenek = {}) {
  const kap = sahne.add.container(x, y).setDepth(450);
  const g = sahne.add.graphics();
  g.fillStyle(0x0b1426, 0.9).fillRoundedRect(-36, -36, 72, 72, 12);
  g.lineStyle(2, 0x5fe3e8, 0.7).strokeRoundedRect(-36, -36, 72, 72, 12);
  // Defter cizimi: kapak, sirt, satirlar
  g.fillStyle(0xd8f6ff, 0.12).fillRect(-16, -20, 32, 36);
  g.lineStyle(2, 0xd8f6ff, 0.9).strokeRect(-16, -20, 32, 36);
  g.lineBetween(-10, -20, -10, 16);
  g.lineStyle(1.5, 0xd8f6ff, 0.6);
  for (const yy of [-10, -3, 4]) g.lineBetween(-5, yy, 11, yy);
  const etiket = sahne.add.text(0, 50, aralikli('DEFTER'), { fontFamily: YAZI, fontSize: '12px', color: '#D8F6FF' }).setOrigin(0.5);
  kap.add([g, etiket]);
  // Dokunma alani simgeyle birlikte alttaki DEFTER yazisini da kapsar
  kap.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-36, -36, 72, 100), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  kap.on('pointerup', () => defterAc(sahne, oyuncuGetir(), secenek));
  return kap;
}

// Ara sahne listesi: giris + tamamlanan bolumlerin acilis/kapanis sahneleri
function izlenebilirSahneler(oyuncu) {
  const liste = [];
  if (oyuncu.girisIzlendi) liste.push({ id: 'G', ad: 'Giriş' });
  for (const b of bolumler) {
    if (!oyuncu.sistemler.includes(b.bolum)) continue;
    if (b.acilisSahnesi) liste.push({ id: b.acilisSahnesi, ad: `${b.bolum}. bölüm açılış` });
    if (b.kapanisSahnesi) liste.push({ id: b.kapanisSahnesi, ad: b.kapanisSahnesi === 'F' ? 'Final' : `${b.bolum}. bölüm kapanış` });
  }
  return liste;
}

// ogretmen: ogretmen panosundan salt okunur acilis. sahneIzle: yalnizca istasyon haritasinda verilir
// (bolumun ortasinda ara sahneye gecmek bolum ilerlemesini silerdi)
export function defterAc(sahne, oyuncu, { ogretmen = false, sahneIzle = null } = {}) {
  if (!oyuncu) return null;
  const durum = { sekme: 'b1', baslangic: [0] };
  // Ilk acilista en son yazilan bolum gosterilir
  const son = (oyuncu.defter || []).slice(-1)[0];
  if (son) durum.sekme = `b${son.bolum}`;
  let icerik = null;
  let dom = null;

  const modal = modalAc(sahne, 'GÖZLEM DEFTERİ', (kap, alan) => {
    const sekmeler = [
      ...bolumler.map((b) => ({ id: `b${b.bolum}`, ad: `B${b.bolum}`, genislik: 88 })),
      ...(ogretmen ? [] : [{ id: 'sahne', ad: 'Ara sahneler', genislik: 170 }]),
      { id: 'mektup', ad: 'Mektup', genislik: 130 }
    ];
    const cipler = [];
    let x = alan.sol;
    for (const s of sekmeler) {
      const c = cip(sahne, x + s.genislik / 2, alan.ust + 2, s.ad, () => {
        durum.sekme = s.id;
        durum.baslangic = [0];
        ciz();
      }, { genislik: s.genislik, yukseklik: 50, boyut: 17 });
      c.sekme = s.id;
      cipler.push(c);
      kap.add(c);
      x += s.genislik + 8;
    }
    kap.add(sahne.add.text(alan.sol, alan.ust + alan.yukseklik, `${oyuncu.takmaAd} · ${oyuncu.sinifKodu}`, { fontFamily: YAZI, fontSize: '15px', color: '#8A96A6' }).setOrigin(0, 1));
    const pdfBilgi = sahne.add.text(alan.sol + alan.genislik - 250, alan.ust + alan.yukseklik - 22, '', { fontFamily: YAZI, fontSize: '15px', color: '#8A96A6' }).setOrigin(1, 0.5);
    kap.add(pdfBilgi);
    let hazirlaniyor = false;
    kap.add(
      dugme(sahne, alan.sol + alan.genislik - 110, alan.ust + alan.yukseklik - 22, '⬇  PDF indir', async () => {
        if (hazirlaniyor) return;
        hazirlaniyor = true;
        pdfBilgi.setText('PDF hazırlanıyor…');
        try {
          dosyaIndir(pdfDosyaAdi(oyuncu), await defterPdf(oyuncu));
          if (pdfBilgi.active) pdfBilgi.setText('PDF indirildi.');
        } catch (e) {
          console.warn('PDF olusturulamadi', e);
          if (pdfBilgi.active) pdfBilgi.setText('PDF oluşturulamadı.');
        }
        hazirlaniyor = false;
      }, { genislik: 220, yukseklik: 50, boyut: 17, birincil: true })
    );

    const ust = alan.ust + 50;
    const alt = alan.ust + alan.yukseklik - 60;
    const ciz = () => {
      if (icerik) icerik.destroy();
      if (dom) dom.destroy();
      dom = null;
      icerik = sahne.add.container(0, 0);
      kap.add(icerik);
      for (const c of cipler) c.durumAyarla(c.sekme === durum.sekme ? 'secili' : 'normal');
      const yazi = (x0, y0, m, stil = {}) => {
        const t = sahne.add.text(x0, y0, m, { fontFamily: YAZI, fontSize: '18px', color: '#D8F6FF', wordWrap: { width: alan.genislik }, ...stil });
        icerik.add(t);
        return t;
      };
      if (durum.sekme === 'sahne') return sahneleriCiz(yazi);
      if (durum.sekme === 'mektup') return mektupCiz(yazi);
      bolumCiz(yazi, Number(durum.sekme.slice(1)));
    };

    const bolumCiz = (yazi, no) => {
      const b = defterBolumleri(oyuncu)[no - 1];
      yazi(alan.sol, ust, `Bölüm ${b.bolum} · ${b.ad}`, { fontSize: '22px', fontStyle: 'bold' });
      const ozet = b.tamamlandi ? `Tamamlandı ${'★'.repeat(b.yildiz)}${'☆'.repeat(3 - b.yildiz)}` : 'Henüz tamamlanmadı';
      yazi(alan.sol + alan.genislik, ust + 4, `${b.cikti} · ${ozet}`, { fontSize: '16px', color: '#8A96A6' }).setOrigin(1, 0);
      if (!b.kayitlar.length) {
        yazi(alan.sol, ust + 50, ogretmen ? 'Bu bölümde deftere yazılmış kayıt yok.' : 'Bu bölümde henüz kayıt yok.\n\nKeşiflerinde bulduğun kuralları kendi cümlenle yazınca burada birikecek. Sonraki bölümlerde bu sayfalara geri dönebilirsin.', { color: '#8A96A6', lineSpacing: 6 });
        return;
      }
      // Kayitlar sigdigi kadar; sigmayanlar sonraki sayfada
      const bas = durum.baslangic[durum.baslangic.length - 1];
      let y = ust + 44;
      let i = bas;
      for (; i < b.kayitlar.length; i++) {
        const k = b.kayitlar[i];
        const parca = sahne.add.container(0, 0);
        const tur = sahne.add.text(alan.sol, 0, (TUR_ADI[k.tur] || k.tur).toLocaleUpperCase('tr'), { fontFamily: YAZI, fontSize: '13px', fontStyle: 'bold', color: '#5FE3E8' });
        const metin = sahne.add.text(alan.sol, 20, k.metin, { fontFamily: OKUMA, fontSize: okumaBoyutu(20), color: '#FFFFFF', wordWrap: { width: alan.genislik - 20 }, lineSpacing: 4 });
        parca.add([tur, metin]);
        let h = 20 + metin.height;
        const onay = onayMetni(k);
        if (onay) {
          parca.add(sahne.add.text(alan.sol, h + 4, onay, { fontFamily: YAZI, fontSize: '14px', color: k.onay === 'duzeltilmeli' ? '#E3B341' : k.onay === 'onaylandi' ? '#5FE3E8' : '#8A96A6', wordWrap: { width: alan.genislik - 20 } }));
          h += 24;
        }
        if (y + h > alt - 8 && i > bas) {
          parca.destroy();
          break;
        }
        parca.y = y;
        icerik.add(parca);
        y += h + 18;
      }
      const sayfaDugmesi = (dx, metin, fn) => icerik.add(cip(sahne, alan.sol + alan.genislik / 2 + dx, alt + 4, metin, fn, { genislik: 64, yukseklik: 48, boyut: 18 }));
      if (durum.baslangic.length > 1) {
        sayfaDugmesi(-40, '◂', () => {
          durum.baslangic.pop();
          ciz();
        });
      }
      if (i < b.kayitlar.length) {
        sayfaDugmesi(40, '▸', () => {
          durum.baslangic.push(i);
          ciz();
        });
      }
    };

    const sahneleriCiz = (yazi) => {
      const liste = izlenebilirSahneler(oyuncu);
      yazi(alan.sol, ust, 'Ara sahneler', { fontSize: '22px', fontStyle: 'bold' });
      yazi(alan.sol, ust + 32, sahneIzle ? 'İzlemek istediğin sahneye dokun. Bitince haritaya dönersin.' : 'Ara sahneleri istasyon haritasındayken defterden yeniden izleyebilirsin.', { fontSize: '16px', color: '#8A96A6' });
      if (!liste.length) {
        yazi(alan.sol, ust + 80, 'Henüz izlenmiş ara sahne yok.', { color: '#8A96A6' });
        return;
      }
      liste.forEach((s, i) => {
        const c = cip(sahne, alan.sol + 128 + (i % 4) * 268, ust + 100 + Math.floor(i / 4) * 64, s.ad, () => sahneIzle && sahneIzle(s.id), { genislik: 256, yukseklik: 52, boyut: 17 });
        if (!sahneIzle) c.durumAyarla('pasif');
        icerik.add(c);
      });
    };

    const mektupCiz = (yazi) => {
      yazi(alan.sol, ust, 'ARGE’ye mektup', { fontSize: '22px', fontStyle: 'bold' });
      yazi(alan.sol, ust + 32, 'Yeni bir yapay zekâ istasyona katıldı ve fiziği hiç bilmiyor. Ünitede öğrendiklerini ona kendi cümlelerinle anlat: birimler, vektörler, kuvvetler, hareket.', { fontSize: '16px', color: '#8A96A6', lineSpacing: 4 });
      const mevcut = (oyuncu.mektup && oyuncu.mektup.metin) || '';
      if (ogretmen) {
        yazi(alan.sol, ust + 100, mevcut || 'Henüz yazılmadı.', { fontSize: '19px', color: mevcut ? '#FFFFFF' : '#8A96A6', lineSpacing: 6 });
        return;
      }
      const html = `<form class="giris" style="width:${alan.genislik - 20}px"><textarea rows="7" maxlength="2000" style="box-sizing:border-box;width:100%;font-size:19px;line-height:1.4;padding:12px;color:#EEF3F7;background:rgba(11,20,38,.95);border:2px solid #5FE3E8;border-radius:10px;font-family:inherit;resize:none"></textarea><button type="submit">Mektubu kaydet</button><div class="not"></div></form>`;
      dom = sahne.add.dom(alan.sol + alan.genislik / 2, ust + 250).createFromHTML(html).setDepth(1001);
      const metin = dom.node.querySelector('textarea');
      const not = dom.node.querySelector('.not');
      metin.value = mevcut;
      dom.node.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const yeni = metin.value.trim();
        if (!yeni) return (not.textContent = 'Önce bir şeyler yaz.');
        oyuncu.mektup = { metin: yeni, zaman: new Date().toISOString() };
        await oyuncuKaydet(oyuncu);
        olayKaydet('defterKayit', { ayrinti: `mektup: ${yeni}` });
        not.textContent = 'Kaydedildi. PDF’e de eklenir.';
      });
    };

    ciz();
  }, { genislik: 1120, yukseklik: 640 });

  modal.kap.once('destroy', () => dom && dom.destroy());
  return modal;
}
