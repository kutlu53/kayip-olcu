import { yildizDokusu, gunesDokusu, gunesOlustur } from './Starfield.js';
import { dunyaDokusu, auroraDokusu, auroraOlustur } from './Earth.js';
import { istasyonDokusu, istasyonOlustur, kapsullerOlustur } from './Station.js';
import { kontrolOdasiDokusu, kontrolOdasiOlustur, pencereCercevesiDokusu } from './Interiors.js';
import { elifDokusu, ekranElifOlustur, keremDokusu, keremVideoOlustur } from './Characters.js';
import { Arge } from './Arge.js';
import { geriSayimOlustur, parcacikAkisiOlustur } from './Hud.js';
import { navKoprusuDokusu, navKonsolOlustur } from './Navigasyon.js';
import { tibbiKapsulDokusu, tibbiKapsulOlustur, istasyonPortuDokusu, istasyonPortuOlustur } from './Port.js';

// scenes.json'daki "tip" degerleri. hazirla: dokulari onceden ciz; olustur: oyun nesnesini kur.
// Nesne istege bagli olarak guncelle(zaman, delta) ve olay(ad, veri) yontemleri tasir.
export const KATMANLAR = {
  yildizlar: { hazirla: yildizDokusu, olustur: (s, a) => s.add.image(0, 0, yildizDokusu(s, a)) },
  gunes: { hazirla: gunesDokusu, olustur: gunesOlustur },
  dunyaUfku: { hazirla: dunyaDokusu, olustur: (s, a) => s.add.image(0, 0, dunyaDokusu(s, a)) },
  aurora: { hazirla: auroraDokusu, olustur: auroraOlustur },
  istasyon: { hazirla: istasyonDokusu, olustur: istasyonOlustur },
  kapsuller: { olustur: kapsullerOlustur },
  kontrolOdasi: { hazirla: kontrolOdasiDokusu, olustur: kontrolOdasiOlustur },
  pencereCercevesi: { hazirla: pencereCercevesiDokusu, olustur: (s) => s.add.image(0, 0, pencereCercevesiDokusu(s)) },
  arge: { olustur: (s, a) => new Arge(s, 0, 0, a) },
  keremVideo: { hazirla: keremDokusu, olustur: keremVideoOlustur },
  ekranElif: { hazirla: (s, a) => elifDokusu(s, a.ifade), olustur: ekranElifOlustur },
  geriSayim: { olustur: geriSayimOlustur },
  parcacikAkisi: { olustur: parcacikAkisiOlustur },
  tibbiKapsul: { hazirla: tibbiKapsulDokusu, olustur: tibbiKapsulOlustur },
  istasyonPortu: { hazirla: istasyonPortuDokusu, olustur: istasyonPortuOlustur },
  navKonsol: { hazirla: navKoprusuDokusu, olustur: navKonsolOlustur }
};
