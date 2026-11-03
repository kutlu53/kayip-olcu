import { describe, it, expect } from 'vitest';
import { defterBolumleri, onayMetni, pdfDosyaAdi } from '../src/systems/Notebook.js';

describe('Gözlem Defteri', () => {
  const oyuncu = {
    takmaAd: 'Yıldız Avcısı',
    sinifKodu: '9A',
    bolumler: { 2: { tamamlandi: true, yildiz: 2, sureSn: 600 } },
    defter: [
      { bolum: 2, tur: 'kural', metin: 'A', onay: 'beklemede' },
      { bolum: 2, tur: 'kural', metin: 'A', onay: 'onaylandi' },
      { bolum: 2, tur: 'karsilastirma', metin: 'B', onay: 'duzeltilmeli', ogretmenNotu: 'yön?' }
    ]
  };

  it('bolum tekrar oynaninca ayni kayit bir kez, en son haliyle', () => {
    const b2 = defterBolumleri(oyuncu)[1];
    expect(b2).toMatchObject({ bolum: 2, cikti: 'FİZ.9.2.2', tamamlandi: true, yildiz: 2 });
    expect(b2.kayitlar.map((k) => k.onay)).toEqual(['onaylandi', 'duzeltilmeli']);
    expect(defterBolumleri(oyuncu)[0].kayitlar).toEqual([]);
  });

  it('onay metinleri', () => {
    expect(onayMetni({ onay: 'otomatik' })).toBe('');
    expect(onayMetni(oyuncu.defter[2])).toContain('yön?');
  });

  it('PDF dosya adi', () => {
    expect(pdfDosyaAdi(oyuncu)).toBe('gozlem-defteri-yıldız-avcısı-9a.pdf');
  });
});
