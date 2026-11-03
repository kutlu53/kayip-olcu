import bolumler from '../data/levels.json';
import { YAZI } from '../ui/tipografi.js';

// Gozlem Defteri icerigi ve PDF (CLAUDE.md §6, §9: performans gorevi kaniti).
// PDF sayfalari tuvale sistem yazi tipiyle cizilir ve jsPDF'e resim olarak eklenir: Turkce harfler icin
// yazi tipi dosyasi gerekmez, oyun cevrim disi calismaya devam eder.

export const TUR_ADI = { kural: 'Kural', tanim: 'Tanım', karsilastirma: 'Karşılaştırma' };

export function onayMetni(k) {
  if (k.onay === 'beklemede') return 'öğretmen onayı bekliyor';
  if (k.onay === 'onaylandi') return '✓ öğretmen onayladı';
  if (k.onay === 'duzeltilmeli') return `↺ öğretmen düzeltmeni istedi${k.ogretmenNotu ? `: “${k.ogretmenNotu}”` : ''}`;
  return '';
}

// Bolum bolum defter: ayni metin bolum tekrar oynandiginda yeniden yazilirsa bir kez gosterilir (en son hali)
export function defterBolumleri(oyuncu) {
  const kayitlar = (oyuncu && oyuncu.defter) || [];
  return bolumler.map((b) => {
    const tekil = new Map();
    for (const k of kayitlar.filter((x) => x.bolum === b.bolum)) tekil.set(`${k.tur}|${k.metin}`, k);
    const durum = oyuncu && oyuncu.bolumler ? oyuncu.bolumler[b.bolum] : null;
    return { bolum: b.bolum, ad: b.ad, cikti: b.ciktilar[0], kayitlar: [...tekil.values()], tamamlandi: !!(durum && durum.tamamlandi), yildiz: durum ? durum.yildiz || 0 : 0, sureSn: durum ? durum.sureSn : null };
  });
}

// ---------------- PDF ----------------
const W = 1240; // A4, 150 dpi
const H = 1754;
const KENAR = 110;
const ALT_SINIR = H - 130;
const RENK = { metin: '#14202E', soluk: '#5B6878', vurgu: '#137C82', cizgi: '#C9D3DD', uyari: '#9A6A00' };

class Dizgi {
  constructor() {
    this.sayfalar = [];
    this.yeniSayfa();
  }

  yeniSayfa() {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    this.ctx = c.getContext('2d');
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.textBaseline = 'top';
    this.sayfalar.push(c);
    this.y = KENAR;
  }

  yer(h) {
    if (this.y + h > ALT_SINIR) this.yeniSayfa();
  }

  satirlar(metin, genislik) {
    const sonuc = [];
    for (const paragraf of String(metin).split('\n')) {
      let satir = '';
      for (const sozcuk of paragraf.split(' ')) {
        const dene = satir ? `${satir} ${sozcuk}` : sozcuk;
        if (satir && this.ctx.measureText(dene).width > genislik) {
          sonuc.push(satir);
          satir = sozcuk;
        } else satir = dene;
      }
      sonuc.push(satir);
    }
    return sonuc;
  }

  yaz(metin, { boyut = 26, kalin = false, renk = RENK.metin, girinti = 0, aralik = 1.45, italik = false } = {}) {
    this.ctx.font = `${italik ? 'italic ' : ''}${kalin ? 'bold ' : ''}${boyut}px ${YAZI}`;
    const satirH = Math.round(boyut * aralik);
    for (const s of this.satirlar(metin, W - 2 * KENAR - girinti)) {
      this.yer(satirH);
      this.ctx.font = `${italik ? 'italic ' : ''}${kalin ? 'bold ' : ''}${boyut}px ${YAZI}`;
      this.ctx.fillStyle = renk;
      this.ctx.fillText(s, KENAR + girinti, this.y);
      this.y += satirH;
    }
  }

  bosluk(h) {
    this.y += h;
  }

  cizgi(renk = RENK.cizgi, kalinlik = 2) {
    this.yer(kalinlik + 4);
    this.ctx.fillStyle = renk;
    this.ctx.fillRect(KENAR, this.y, W - 2 * KENAR, kalinlik);
    this.y += kalinlik;
  }

  // Basligin altinda ozet satiri ve ilk kayit da sigsin: baslik sayfanin dibinde yalniz kalmasin
  baslik(metin, boyut, renk) {
    this.yer(boyut * 7);
    this.yaz(metin, { boyut, kalin: true, renk });
  }
}

export function defterSayfalari(oyuncu, { tarih = new Date() } = {}) {
  const d = new Dizgi();
  d.yaz('GÖZLEM DEFTERİ', { boyut: 54, kalin: true, renk: RENK.vurgu, aralik: 1.2 });
  d.yaz('Kayıp Ölçü · Göktürk-7 · 9. sınıf Fizik “Kuvvet ve Hareket”', { boyut: 24, renk: RENK.soluk });
  d.bosluk(18);
  d.yaz(`Stajyer: ${oyuncu.takmaAd} · Sınıf: ${oyuncu.sinifKodu}`, { boyut: 30, kalin: true });
  const bolumListesi = defterBolumleri(oyuncu);
  const acik = bolumListesi.filter((b) => b.tamamlandi).length;
  d.yaz(`Açılan sistemler: ${acik} / 7 · Tarih: ${tarih.toLocaleDateString('tr-TR')}`, { boyut: 24, renk: RENK.soluk });
  d.bosluk(24);
  d.cizgi(RENK.vurgu, 3);
  d.bosluk(24);

  for (const b of bolumListesi) {
    d.baslik(`Bölüm ${b.bolum} · ${b.ad}`, 34, RENK.metin);
    const durum = b.tamamlandi
      ? `Tamamlandı · ${'★'.repeat(b.yildiz)}${'☆'.repeat(3 - b.yildiz)}${b.sureSn ? ` · ${Math.max(1, Math.round(b.sureSn / 60))} dk` : ''}`
      : 'Henüz tamamlanmadı';
    d.yaz(`${b.cikti} · ${durum}`, { boyut: 22, renk: RENK.soluk });
    d.bosluk(10);
    if (!b.kayitlar.length) d.yaz('Bu bölümde deftere yazılmış kayıt yok.', { boyut: 24, renk: RENK.soluk, italik: true, girinti: 24 });
    for (const k of b.kayitlar) {
      d.yer(110);
      d.yaz(TUR_ADI[k.tur] || k.tur, { boyut: 20, kalin: true, renk: RENK.vurgu, girinti: 24 });
      d.yaz(k.metin, { boyut: 27, girinti: 24 });
      const onay = onayMetni(k);
      if (onay) d.yaz(onay, { boyut: 20, renk: k.onay === 'duzeltilmeli' ? RENK.uyari : RENK.soluk, girinti: 24 });
      d.bosluk(14);
    }
    d.bosluk(16);
    d.cizgi();
    d.bosluk(24);
  }

  if (oyuncu.mektup && oyuncu.mektup.metin) {
    d.baslik('ARGE’ye mektup', 34, RENK.metin);
    d.yaz('Ünitede öğrendiklerimi yeni bir yapay zekâya anlatıyorum.', { boyut: 22, renk: RENK.soluk });
    d.bosluk(12);
    d.yaz(oyuncu.mektup.metin, { boyut: 27, girinti: 24, aralik: 1.55 });
  }

  // Alt bilgi: sayfa numarasi; kisisel veri yok (takma ad + sinif kodu)
  d.sayfalar.forEach((c, i) => {
    const ctx = c.getContext('2d');
    ctx.font = `20px ${YAZI}`;
    ctx.fillStyle = RENK.soluk;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${oyuncu.takmaAd} · ${oyuncu.sinifKodu}`, KENAR, H - 70);
    const no = `${i + 1} / ${d.sayfalar.length}`;
    ctx.fillText(no, W - KENAR - ctx.measureText(no).width, H - 70);
  });
  return d.sayfalar;
}

// jsPDF yalnizca PDF istenince yuklenir (ayri parca; PWA onbellegine yine de girer)
export async function defterPdf(oyuncu) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  defterSayfalari(oyuncu).forEach((c, i) => {
    if (i) pdf.addPage();
    pdf.addImage(c.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297);
  });
  pdf.setProperties({ title: `Gözlem Defteri · ${oyuncu.takmaAd} · ${oyuncu.sinifKodu}`, creator: 'Kayıp Ölçü' });
  return pdf.output('blob');
}

export const pdfDosyaAdi = (oyuncu) =>
  `gozlem-defteri-${`${oyuncu.takmaAd}-${oyuncu.sinifKodu}`.toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]+/g, '-')}.pdf`;
