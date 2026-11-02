import { describe, it, expect } from 'vitest';
import {
  topla, cikar, olcekle, ters, buyukluk, aci, aciFarki, kutupsal, bilesenler, izdusum,
  esitMi, ayniYonlu, zitYonlu, izgarayaOturt, yaz
} from '../src/systems/VectorMath.js';

const yakin = (a, b, t = 1e-9) => expect(esitMi(a, b, t)).toBe(true);

describe('toplama ve cikarma', () => {
  it('uc uca ekleme bilesenleri toplar', () => {
    expect(topla([3, 0], [0, 4])).toEqual([3, 4]);
    expect(topla([4, 1], [1, 3])).toEqual([5, 4]);
    expect(topla([1, 1], [2, 2], [-3, 0])).toEqual([0, 3]);
    expect(topla()).toEqual([0, 0]);
  });
  it('cikarma ve ters', () => {
    expect(cikar([5, 4], [4, 1])).toEqual([1, 3]);
    expect(ters([4, -3])).toEqual([-4, 3]);
    expect(olcekle([2, -1], 3)).toEqual([6, -3]);
  });
});

describe('buyukluk: bileske buyukluklerin toplami degildir (M_BILESKE_TOPLAM)', () => {
  it('dik vektorler: 3 + 4 -> 5', () => {
    const r = topla([3, 0], [0, 4]);
    expect(buyukluk(r)).toBe(5);
    expect(buyukluk([3, 0]) + buyukluk([0, 4])).toBe(7);
  });
  it('ayni yonlu vektorlerde bileske toplama esittir', () => {
    expect(buyukluk(topla([2, 0], [3, 0]))).toBe(5);
  });
  it('zit yonlu buyuk aciyla: 4 ve 5 -> 3', () => {
    expect(buyukluk([-4, 3])).toBe(5);
    expect(buyukluk(topla([4, 0], [-4, 3]))).toBe(3);
  });
  it('ucgen esitsizligi: |A+B| <= |A|+|B|', () => {
    for (const [a, b] of [[[1, 2], [3, -1]], [[-2, 5], [4, 4]], [[0, 0], [1, 1]]]) {
      expect(buyukluk(topla(a, b))).toBeLessThanOrEqual(buyukluk(a) + buyukluk(b) + 1e-12);
    }
  });
});

describe('aci', () => {
  it('eksenler', () => {
    expect(aci([1, 0])).toBe(0);
    expect(aci([0, 1])).toBe(90);
    expect(aci([-1, 0])).toBe(180);
    expect(aci([0, -1])).toBe(270);
  });
  it('aci farki en kucuk aciyi verir', () => {
    expect(aciFarki([1, 0], [0, 1])).toBeCloseTo(90);
    expect(aciFarki([1, 0.01], [1, -0.01])).toBeLessThan(2);
    expect(aciFarki([1, 0], [-1, 0])).toBeCloseTo(180);
  });
  it('ayni ve zit yon', () => {
    expect(ayniYonlu([2, 0], [3, 0])).toBe(true);
    expect(ayniYonlu([2, 0], [0, 3])).toBe(false);
    expect(zitYonlu([4, -3], [-4, 3])).toBe(true);
    expect(ayniYonlu([0, 0], [1, 0])).toBe(false);
  });
});

describe('bilesenlere ayirma (zor mod: sin/cos)', () => {
  it('5 N, -37 derece yaklasik (4, -3)', () => {
    const [x, y] = bilesenler(5, -36.87);
    expect(x).toBeCloseTo(4, 2);
    expect(y).toBeCloseTo(-3, 2);
  });
  it('kutupsal ile buyukluk ve aci geri elde edilir', () => {
    const v = kutupsal(7, 123);
    expect(buyukluk(v)).toBeCloseTo(7);
    expect(aci(v)).toBeCloseTo(123);
  });
  it('bilesenler uc uca eklenince vektorun kendisini verir', () => {
    const v = [4, -3];
    yakin(topla(izdusum(v, [1, 0]), izdusum(v, [0, 1])), v);
  });
  it('izdusum', () => {
    yakin(izdusum([4, -3], [1, 0]), [4, 0]);
    yakin(izdusum([4, -3], [0, 2]), [0, -3]);
    expect(izdusum([1, 1], [0, 0])).toEqual([0, 0]);
  });
});

describe('yardimcilar', () => {
  it('izgaraya oturtma', () => {
    expect(izgarayaOturt([2.4, -2.6])).toEqual([2, -3]);
    expect(izgarayaOturt([2.3, 0.74], 0.5)).toEqual([2.5, 0.5]);
  });
  it('Turkce ondalik yazimi', () => {
    expect(yaz(3.6056)).toBe('3,6');
    expect(yaz(5)).toBe('5');
    expect(yaz(-0.04)).toBe('0');
  });
});
