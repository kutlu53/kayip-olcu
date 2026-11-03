import { describe, it, expect } from 'vitest';
import { isiHaritasi, yanilgiSiralamasi, csvAyristir, sinifKodu, takmaAd, olayAnahtari, defterSatirlari, ogrenciOzeti } from '../src/systems/Rapor.js';

const olay = (ogrenci, olay, ek = {}) => ({ ogrenci, olay, zaman: '2026-11-03T10:00:00Z', bolum: 4, cikti: 'FİZ.9.2.4', ...ek });

const OLAYLAR = [
  olay('Ay#9A', 'bolumBasla'),
  olay('Ay#9A', 'cevap', { dogru: false, yanilgi: 'M_BILESKE_TOPLAM' }),
  olay('Ay#9A', 'cevap', { dogru: true }),
  olay('Ay#9A', 'ipucu', { ipucuKademesi: 2 }),
  olay('Ay#9A', 'bolumBitir', { sureSn: 540 }),
  olay('Su#9A', 'cevap', { dogru: false, yanilgi: 'M_BILESKE_TOPLAM' }),
  olay('Su#9A', 'cevap', { dogru: false, yanilgi: 'M_BILESKE_FARK' }),
  olay('Su#9A', 'cevap', { dogru: false, yanilgi: 'M_BILESKE_FARK' }),
  olay('Kar#9B', 'cevap', { dogru: true, bolum: 1, cikti: 'FİZ.9.2.1' })
];

describe('Rapor', () => {
  it('kimlikten sinif kodu ve takma ad', () => {
    expect(sinifKodu('Yıldız Avcısı#9A')).toBe('9A');
    expect(takmaAd('Yıldız Avcısı#9A')).toBe('Yıldız Avcısı');
  });

  it('sinif x cikti isi haritasi', () => {
    const [a, b] = isiHaritasi(OLAYLAR);
    expect(a.anahtar).toBe('9A');
    expect(a.ogrenciSayisi).toBe(2);
    const h4 = a.hucreler[3];
    expect(h4.cikti).toBe('FİZ.9.2.4');
    expect(h4.cevap).toBe(5);
    expect(h4.dogruluk).toBeCloseTo(1 / 5);
    expect(h4.tamamlama).toBeCloseTo(1 / 2);
    expect(h4.ipucu).toBeCloseTo(1 / 2);
    expect(a.hucreler[0].bos).toBe(true);
    expect(b.anahtar).toBe('9B');
    expect(b.hucreler[0].dogruluk).toBe(1);
  });

  it('secilen sinifta ogrenci satirlari', () => {
    const satirlar = isiHaritasi(OLAYLAR, { sinif: '9A' });
    expect(satirlar.map((s) => s.etiket)).toEqual(['Ay', 'Su']);
    expect(satirlar[1].hucreler[3].dogruluk).toBe(0);
  });

  it('yanilgilar once ogrenci sayisina gore siralanir', () => {
    const [ilk, ikinci] = yanilgiSiralamasi(OLAYLAR);
    expect(ilk.kod).toBe('M_BILESKE_TOPLAM');
    expect(ilk.ogrenciSayisi).toBe(2);
    expect(ikinci.kod).toBe('M_BILESKE_FARK');
    expect(ikinci.adet).toBe(2);
    expect(ilk.dogrusu).toContain('aynı yönlü');
    expect(yanilgiSiralamasi(OLAYLAR, { sinif: '9B' })).toEqual([]);
  });

  it('ogrenci ozeti', () => {
    const b4 = ogrenciOzeti(OLAYLAR, 'Ay#9A')[3];
    expect(b4).toMatchObject({ cevap: 2, dogru: 1, ipucu: 1, enYuksekIpucu: 2, bitti: true, sureSn: 540 });
  });

  it('kendi CSV bicimini geri okur', () => {
    const csv = '﻿ogrenci;zaman;bolum;olay;dogru;deneme;ayrinti\r\nAy#9A;2026-11-03T10:00:00Z;4;cevap;false;2;"kural: a; ""b"""\r\nSu#9A;2026-11-03T10:01:00Z;1;cevap;true;;\r\n';
    const [a, b] = csvAyristir(csv);
    expect(a).toMatchObject({ ogrenci: 'Ay#9A', bolum: 4, olay: 'cevap', dogru: false, deneme: 2, ayrinti: 'kural: a; "b"' });
    expect(b.deneme).toBeNull();
    expect(b.dogru).toBe(true);
    expect(() => csvAyristir('a;b\r\n1;2')).toThrow();
  });

  it('ayni olayin anahtari ayni', () => {
    expect(olayAnahtari(OLAYLAR[1])).toBe(olayAnahtari({ ...OLAYLAR[1] }));
    expect(olayAnahtari(OLAYLAR[1])).not.toBe(olayAnahtari(OLAYLAR[2]));
  });

  it('defter satirlari', () => {
    const satirlar = defterSatirlari([{ id: 'Ay#9A', sinifKodu: '9A', defter: [{ bolum: 4, tur: 'kural', metin: 'x', onay: 'beklemede', zaman: 'z' }] }]);
    expect(satirlar[0]).toMatchObject({ ogrenci: 'Ay#9A', sinif: '9A', cikti: 'FİZ.9.2.4', onay: 'beklemede', ogretmenNotu: '' });
  });
});
