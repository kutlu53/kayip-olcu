import { describe, it, expect } from 'vitest';
import { PEDAGOJIK } from '../src/config/colors.js';
import { STILLER } from '../src/systems/VectorDraw.js';
import { renkFarki } from '../src/config/renkKorlugu.js';

// Pedagojik renkler (CLAUDE.md §10.5) renk korlugunde de ayirt edilebilmeli
const TURLER = [null, 'protan', 'deutan', 'tritan'];
const ADLAR = Object.keys(PEDAGOJIK);

describe('Renk körlüğü kontrolü', () => {
  for (const tur of TURLER) {
    it(`${tur || 'normal görme'}: her renk çifti ayırt edilir (ΔE ≥ 20)`, () => {
      for (let i = 0; i < ADLAR.length; i++) {
        for (let j = i + 1; j < ADLAR.length; j++) {
          const fark = renkFarki(PEDAGOJIK[ADLAR[i]], PEDAGOJIK[ADLAR[j]], tur);
          expect(fark, `${ADLAR[i]} - ${ADLAR[j]}`).toBeGreaterThanOrEqual(20);
        }
      }
    });
  }

  it('vektör, bileşke ve bileşen renk olmadan da desenle ayrılır', () => {
    const desen = (s) => `${s.kalinlik}|${!!s.kesikli}`;
    const desenler = ['vektor', 'bileske', 'bilesen'].map((ad) => desen(STILLER[ad]));
    expect(new Set(desenler).size).toBe(3);
  });

  it('benzetim gri renkleri değiştirmez', () => {
    for (const tur of TURLER) expect(renkFarki(0x808080, 0x808080, tur)).toBeCloseTo(0);
  });
});
