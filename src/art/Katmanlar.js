import { yildizDokusu, gunesDokusu, gunesOlustur } from './Starfield.js';
import { dunyaDokusu, auroraDokusu, auroraOlustur } from './Earth.js';
import { istasyonDokusu, istasyonOlustur, kapsullerOlustur } from './Station.js';
import { kontrolOdasiDokusu, kontrolOdasiOlustur, pencereCercevesiDokusu } from './Interiors.js';
import { elifDokusu, ekranElifOlustur, keremDokusu, keremVideoOlustur } from './Characters.js';
import { Arge } from './Arge.js';
import { geriSayimOlustur, parcacikAkisiOlustur } from './Hud.js';
import { navKoprusuDokusu, navKonsolOlustur } from './Navigasyon.js';
import { reaktorDokusu, reaktorOlustur } from './Reaktor.js';
import { fezaDokusu, fezaVideoOlustur, kuvvetHalkalariOlustur } from './YerKontrol.js';
import { uyariKaydiOlustur } from './Halka.js';
import { atmosferParlamaOlustur, iticiAtesiOlustur, yorungeDiyagramiOlustur, rozetlerOlustur } from './SonOnarim.js';
import { gunesPaneliDokusu, dronDokusu, kopukPanelOlustur } from './Panel.js';
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
  tibbiKapsul: { hazirla: (s, a) => tibbiKapsulDokusu(s, a.govdeYazi), olustur: tibbiKapsulOlustur },
  istasyonPortu: { hazirla: istasyonPortuDokusu, olustur: istasyonPortuOlustur },
  navKonsol: { hazirla: navKoprusuDokusu, olustur: navKonsolOlustur },
  reaktor: { hazirla: reaktorDokusu, olustur: reaktorOlustur },
  fezaVideo: { hazirla: fezaDokusu, olustur: fezaVideoOlustur },
  kuvvetHalkalari: { olustur: kuvvetHalkalariOlustur },
  uyariKaydi: { olustur: uyariKaydiOlustur },
  atmosferParlama: { olustur: atmosferParlamaOlustur },
  iticiAtesi: { olustur: iticiAtesiOlustur },
  yorungeDiyagrami: { olustur: yorungeDiyagramiOlustur },
  rozetler: { olustur: rozetlerOlustur },
  kopukPanel: { hazirla: (s) => { gunesPaneliDokusu(s); dronDokusu(s); }, olustur: kopukPanelOlustur }
};
