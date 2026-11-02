import { aktifOyuncu, tumu, yaz } from './SaveSystem.js';

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

export async function csvOlustur() {
  const olaylar = await tumu('olaylar');
  const satirlar = [ALANLAR.join(';'), ...olaylar.map((o) => ALANLAR.map((a) => csvHucre(o[a])).join(';'))];
  return { metin: '﻿' + satirlar.join('\r\n'), adet: olaylar.length };
}

export async function csvIndir() {
  const { metin, adet } = await csvOlustur();
  const tarih = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([metin], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `kayip-olcu-veriler-${tarih}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return adet;
}
