import { describe, it, expect } from 'vitest';
import { konusmaMetni } from '../src/systems/SesliOkuma.js';

describe('Sesli okuma metni', () => {
  it('birimler Türkçe okunur', () => {
    expect(konusmaMetni('Newton… kilogram: 1 N = 1 kg·m/s²')).toBe('Newton… kilogram: 1 newton = 1 kilogram çarpı metre bölü saniye kare');
    expect(konusmaMetni('Kapsül saatte 500 km/h ile gidiyor, 30 dk sonra 250 km uzakta.')).toBe('Kapsül saatte 500 kilometre bölü saat ile gidiyor, 30 dakika sonra 250 kilometre uzakta.');
    expect(konusmaMetni('g = 9,8 m/s², sürat 7660 m/s, 293 K, 3 A')).toBe('g = 9,8 metre bölü saniye kare, sürat 7660 metre bölü saniye, 293 kelvin, 3 amper');
    expect(konusmaMetni('6 kN ileri, 2 m²')).toBe('6 kilonewton ileri, 2 metrekare');
  });

  it('tek harf birimler yalnızca sayıdan sonra çevrilir', () => {
    expect(konusmaMetni('A oku ile B oku')).toBe('A oku ile B oku');
    expect(konusmaMetni('3 m + 4 m')).toBe('3 metre + 4 metre');
    expect(konusmaMetni('4 metre')).toBe('4 metre');
  });

  it('üsler, yüzde, açı ve semboller', () => {
    expect(konusmaMetni('≈10⁻¹⁵ m')).toBe('yaklaşık 10 üzeri eksi 15 metre');
    expect(konusmaMetni('%90')).toBe('yüzde 90');
    expect(konusmaMetni('2,8 kN, 45°')).toBe('2,8 kilonewton, 45 derece');
    expect(konusmaMetni('101 300 Pa')).toBe('101300 paskal');
    expect(konusmaMetni('3 600 000 J')).toBe('3600000 jul');
    expect(konusmaMetni('Fx = 5 · cos 37°')).toBe('Fx = 5 çarpı cos 37 derece');
  });

  it('birimden sonraki ekler okunan sözcüğe uyar', () => {
    expect(konusmaMetni("400 km'de")).toBe('400 kilometrede');
    expect(konusmaMetni("6 kN'den fazla")).toBe('6 kilonewtondan fazla');
    expect(konusmaMetni("5 N'lik kuvvet")).toBe('5 newtonluk kuvvet');
    expect(konusmaMetni("400 m'lik")).toBe('400 metrelik');
    expect(konusmaMetni('293 K mı?')).toBe('293 kelvin mi?');
    expect(konusmaMetni("12 s'de")).toBe('12 saniyede');
  });

  it('sahne notları okunmaz', () => {
    expect(konusmaMetni('[sinyal kesildi]')).toBe('');
    expect(konusmaMetni('Stajyer! Sen ve Komutan… [parazit]')).toBe('Stajyer! Sen ve Komutan…');
  });
});
