import bolumler from '../data/levels.json';
import yanilgiSozlugu from '../data/misconceptions.json';

// Ogretmen panosunun hesaplari (CLAUDE.md §9). Saf fonksiyonlar: tests/Rapor.test.js

export const BOLUMLER = bolumler.map((b) => ({ bolum: b.bolum, cikti: b.ciktilar[0], ad: b.ad }));

// Ogrenci kimligi "takmaad#SINIFKODU"; takma adda '#' olamaz (MenuScene)
export const sinifKodu = (ogrenci) => (ogrenci && ogrenci.includes('#') ? ogrenci.slice(ogrenci.lastIndexOf('#') + 1) : '?');
export const takmaAd = (ogrenci) => (ogrenci && ogrenci.includes('#') ? ogrenci.slice(0, ogrenci.lastIndexOf('#')) : ogrenci || '');

const sirala = (a, b) => a.localeCompare(b, 'tr', { numeric: true });

export function siniflar(olaylar, oyuncular = []) {
  const s = new Set();
  for (const o of olaylar) if (o.ogrenci) s.add(sinifKodu(o.ogrenci));
  for (const o of oyuncular) s.add(o.sinifKodu);
  return [...s].sort(sirala);
}

// Satirlar sinif (ya da secilen sinifta ogrenci), sutunlar bolum/ogrenme ciktisi.
// dogruluk: dogru cevap / cevap (kesif tahminleri dahil), tamamlama: bolumu bitiren / satirdaki ogrenci,
// ipucu: istenen ipucu / bolumde olayi olan ogrenci
export function isiHaritasi(olaylar, { sinif = null } = {}) {
  const grup = sinif ? 'ogrenci' : 'sinif';
  const satirlar = new Map();
  for (const o of olaylar) {
    if (!o.ogrenci) continue;
    const s = sinifKodu(o.ogrenci);
    if (sinif && s !== sinif) continue;
    const anahtar = grup === 'sinif' ? s : o.ogrenci;
    if (!satirlar.has(anahtar)) satirlar.set(anahtar, { ogrenciler: new Set(), hucreler: {} });
    const satir = satirlar.get(anahtar);
    satir.ogrenciler.add(o.ogrenci);
    const b = Number(o.bolum);
    if (!b) continue;
    const h = satir.hucreler[b] || (satir.hucreler[b] = { cevap: 0, dogru: 0, ipucu: 0, ogrenciler: new Set(), bitirenler: new Set() });
    h.ogrenciler.add(o.ogrenci);
    if (o.olay === 'cevap') {
      h.cevap += 1;
      if (o.dogru === true) h.dogru += 1;
    } else if (o.olay === 'ipucu') h.ipucu += 1;
    else if (o.olay === 'bolumBitir') h.bitirenler.add(o.ogrenci);
  }
  return [...satirlar.keys()].sort(sirala).map((anahtar) => {
    const satir = satirlar.get(anahtar);
    const ogrenciSayisi = satir.ogrenciler.size;
    return {
      anahtar,
      etiket: grup === 'sinif' ? anahtar : takmaAd(anahtar),
      ogrenciSayisi,
      hucreler: BOLUMLER.map(({ bolum, cikti }) => {
        const h = satir.hucreler[bolum];
        if (!h) return { bolum, cikti, bos: true };
        return {
          bolum,
          cikti,
          cevap: h.cevap,
          dogruluk: h.cevap ? h.dogru / h.cevap : null,
          bitiren: h.bitirenler.size,
          tamamlama: h.bitirenler.size / ogrenciSayisi,
          ipucu: h.ipucu / h.ogrenciler.size
        };
      })
    };
  });
}

// En yaygin yanilgilar: once kac farkli ogrencide goruldugu, esitse toplam tekrar sayisi
export function yanilgiSiralamasi(olaylar, { sinif = null, ogrenci = null } = {}) {
  const sayac = new Map();
  for (const o of olaylar) {
    if (o.olay !== 'cevap' || !o.yanilgi) continue;
    if (sinif && sinifKodu(o.ogrenci) !== sinif) continue;
    if (ogrenci && o.ogrenci !== ogrenci) continue;
    const s = sayac.get(o.yanilgi) || { adet: 0, ogrenciler: new Set() };
    s.adet += 1;
    s.ogrenciler.add(o.ogrenci);
    sayac.set(o.yanilgi, s);
  }
  return [...sayac.entries()]
    .map(([kod, s]) => ({ kod, adet: s.adet, ogrenciSayisi: s.ogrenciler.size, ...(yanilgiSozlugu[kod] || { yanilgi: kod, dogrusu: '', bolum: null }) }))
    .sort((a, b) => b.ogrenciSayisi - a.ogrenciSayisi || b.adet - a.adet || sirala(a.kod, b.kod));
}

// Bir ogrencinin bolum bolum ozeti (ogrenci ayrinti penceresi)
export function ogrenciOzeti(olaylar, ogrenci) {
  return BOLUMLER.map(({ bolum, cikti, ad }) => {
    const ilgili = olaylar.filter((o) => o.ogrenci === ogrenci && Number(o.bolum) === bolum);
    const cevaplar = ilgili.filter((o) => o.olay === 'cevap');
    const bitis = ilgili.filter((o) => o.olay === 'bolumBitir').pop();
    return {
      bolum,
      cikti,
      ad,
      basladi: ilgili.length > 0,
      cevap: cevaplar.length,
      dogru: cevaplar.filter((o) => o.dogru === true).length,
      ipucu: ilgili.filter((o) => o.olay === 'ipucu').length,
      enYuksekIpucu: Math.max(0, ...ilgili.map((o) => Number(o.ipucuKademesi) || 0)),
      bitti: !!bitis,
      sureSn: bitis ? bitis.sureSn : null
    };
  });
}

// Ayni olay iki kez yuklenirse (ayni CSV tekrar ice aktarilirsa) bir kez sayilir
export const olayAnahtari = (o) => [o.ogrenci, o.zaman, o.bolum, o.olay, o.dogru, o.deneme, o.yanilgi, o.ipucuKademesi, o.ayrinti].join('|');

// ---------- CSV (Telemetry.csvMetni bicimi: ';' ayirici, UTF-8 BOM, "" kacisli tirnak) ----------
function csvSatirlari(metin) {
  const satirlar = [];
  let satir = [];
  let hucre = '';
  let tirnak = false;
  for (let i = 0; i < metin.length; i++) {
    const c = metin[i];
    if (tirnak) {
      if (c !== '"') hucre += c;
      else if (metin[i + 1] === '"') {
        hucre += '"';
        i += 1;
      } else tirnak = false;
    } else if (c === '"') tirnak = true;
    else if (c === ';') {
      satir.push(hucre);
      hucre = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && metin[i + 1] === '\n') i += 1;
      satir.push(hucre);
      satirlar.push(satir);
      satir = [];
      hucre = '';
    } else hucre += c;
  }
  if (hucre !== '' || satir.length) {
    satir.push(hucre);
    satirlar.push(satir);
  }
  return satirlar;
}

const SAYISAL = ['bolum', 'deneme', 'ipucuKademesi', 'sureSn'];
function donustur(alan, d) {
  if (d === undefined || d === '') return null;
  if (SAYISAL.includes(alan)) return Number.isFinite(Number(d)) ? Number(d) : null;
  if (alan === 'dogru') {
    const k = d.toLocaleLowerCase('tr');
    return k === 'true' || k === 'doğru' ? true : k === 'false' || k === 'yanlış' ? false : null;
  }
  return d;
}

export function csvAyristir(metin) {
  const satirlar = csvSatirlari(metin.replace(/^﻿/, ''));
  const baslik = satirlar[0] || [];
  if (!baslik.includes('ogrenci') || !baslik.includes('olay')) throw new Error('Bu dosya bir Kayıp Ölçü olay dosyası değil.');
  return satirlar
    .slice(1)
    .filter((s) => s.some((h) => h !== ''))
    .map((s) => {
      const o = {};
      baslik.forEach((alan, i) => (o[alan] = donustur(alan, s[i])));
      return o;
    })
    .filter((o) => o.ogrenci && o.olay);
}

// Defter disa aktarimi: her satir bir defter kaydi
export const DEFTER_ALANLARI = ['ogrenci', 'sinif', 'bolum', 'cikti', 'tur', 'metin', 'onay', 'ogretmenNotu', 'zaman'];
export function defterSatirlari(oyuncular) {
  const satirlar = [];
  for (const o of [...oyuncular].sort((a, b) => sirala(a.id, b.id))) {
    for (const k of o.defter || []) {
      const b = BOLUMLER.find((x) => x.bolum === k.bolum);
      satirlar.push({ ogrenci: o.id, sinif: o.sinifKodu, bolum: k.bolum, cikti: b ? b.cikti : '', tur: k.tur, metin: k.metin, onay: k.onay, ogretmenNotu: k.ogretmenNotu || '', zaman: k.zaman });
    }
  }
  return satirlar;
}
