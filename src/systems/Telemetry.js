import { aktifOyuncu, tumu, yaz, topluEkle } from './SaveSystem.js';
import { olayAnahtari } from './Rapor.js';

// Olay semasi: CLAUDE.md §11 "Telemetri olay semasi"
export const ALANLAR = ['ogrenci', 'zaman', 'bolum', 'cikti', 'olay', 'dogru', 'deneme', 'yanilgi', 'ipucuKademesi', 'sureSn', 'ayrinti'];
export const OLAYLAR = ['bolumBasla', 'cevap', 'ipucu', 'defterKayit', 'bolumBitir', 'sahneAtla'];

export async function olayKaydet(olay, veri = {}) {
  const oyuncu = aktifOyuncu();
  if (!oyuncu) return;
  if (!OLAYLAR.includes(olay)) console.warn('Tanimsiz telemetri olayi:', olay);
  const kayit = { ogrenci: oyuncu.id, zaman: new Date().toISOString(), olay };
  for (const alan of ALANLAR) if (!(alan in kayit)) kayit[alan] = alan in veri ? veri[alan] : null;
  try {
    await yaz('olaylar', kayit);
  } catch (e) {
    console.warn('Telemetri kaydedilemedi', e);
  }
}

// Excel (Turkce) icin ';' ayirici ve UTF-8 BOM
function csvHucre(deger) {
  if (deger === null || deger === undefined) return '';
  const s = String(deger);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const csvMetni = (alanlar, kayitlar) =>
  '﻿' + [alanlar.join(';'), ...kayitlar.map((k) => alanlar.map((a) => csvHucre(k[a])).join(';'))].join('\r\n');

export function dosyaIndir(ad, metin, tur = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(metin instanceof Blob ? metin : new Blob([metin], { type: tur }));
  const a = document.createElement('a');
  a.href = url;
  a.download = ad;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const bugun = () => new Date().toISOString().slice(0, 10);

export async function csvIndir() {
  const olaylar = await tumu('olaylar');
  dosyaIndir(`kayip-olcu-veriler-${bugun()}.csv`, csvMetni(ALANLAR, olaylar));
  return olaylar.length;
}

// Baska cihazlardan gelen olaylar; daha once yuklenmis olanlar atlanir
export async function olaylariEkle(gelen) {
  const anahtarlar = new Set((await tumu('olaylar')).map(olayAnahtari));
  const yeni = [];
  for (const o of gelen) {
    const a = olayAnahtari(o);
    if (anahtarlar.has(a)) continue;
    anahtarlar.add(a);
    const kayit = {};
    for (const alan of ALANLAR) kayit[alan] = alan in o ? o[alan] : null;
    yeni.push(kayit);
  }
  if (yeni.length) await topluEkle('olaylar', yeni);
  return { eklenen: yeni.length, tekrar: gelen.length - yeni.length };
}
