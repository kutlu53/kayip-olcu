import { ayarlar } from '../config/settings.js';
import { guc } from './SaveSystem.js';
import { muzikKis } from './Ses.js';

// Sesli okuma: tarayicinin konusma motoru (Web Speech API). Kayit ya da dosya gerekmez.
// Sesler cihaza baglidir: Edge cevrim ici "Natural" sesler (Emel kadin, Ahmet erkek), Windows'ta cevrim disi Tolga,
// Android'de Google Turkce sesleri. Turkce ses yoksa ya da ayar kapaliysa altyazi tek basina kalir.

const destek = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
const cevrimici = () => typeof navigator === 'undefined' || navigator.onLine !== false;

// ---------------- Metni konusmaya hazirlama (saf fonksiyon, tests/SesliOkuma.test.js) ----------------
const UST = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
// Uzun olan once: "kg·m/s²" "m/s"den once eslesmeli
const BILESIK = [
  ['kg·m²/s²', 'kilogram çarpı metre kare bölü saniye kare'],
  ['kg·m/s²', 'kilogram çarpı metre bölü saniye kare'],
  ['N·m', 'newton çarpı metre'],
  ['km/h', 'kilometre bölü saat'],
  ['km/s', 'kilometre bölü saniye'],
  ['m/s²', 'metre bölü saniye kare'],
  ['m/s', 'metre bölü saniye'],
  ['N/m²', 'newton bölü metre kare'],
  ['J/s', 'jul bölü saniye'],
  ['kg/m³', 'kilogram bölü metreküp']
];
// Tek basina belirsiz birimler yalnizca bir sayidan sonra cevrilir ("5 N" -> "5 newton", ama "A oku" degismez)
const SAYIDAN_SONRA = { kN: 'kilonewton', km: 'kilometre', kg: 'kilogram', 'm²': 'metrekare', 'm³': 'metreküp', Pa: 'paskal', mol: 'mol', cd: 'kandela', dk: 'dakika', m: 'metre', s: 'saniye', N: 'newton', J: 'jul', W: 'vat', K: 'kelvin', A: 'amper' };
const kacir = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

export function konusmaMetni(metin) {
  let s = String(metin || '');
  s = s.replace(/\[[^\]]*\]/g, ' '); // [sinyal kesildi] gibi sahne notlari okunmaz
  for (const [b, o] of BILESIK) s = s.replace(new RegExp(kacir(b), 'g'), o);
  // Ust simgeler: 10⁻¹⁵ -> 10 üzeri eksi 15
  s = s.replace(/(\d)\s?([⁻]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, d, eksi, us) => `${d} üzeri ${eksi ? 'eksi ' : ''}${[...us].map((c) => UST[c]).join('')}`);
  // Binlik bosluk: "101 300" -> "101300"
  s = s.replace(/(\d) (\d{3})(?!\d)/g, '$1$2');
  s = s.replace(/%\s?(\d)/g, 'yüzde $1');
  const birimler = Object.keys(SAYIDAN_SONRA).sort((a, b) => b.length - a.length).map(kacir).join('|');
  s = s.replace(new RegExp(`(\\d)\\s?(${birimler})(?![\\p{L}\\d²³])`, 'gu'), (_, d, b) => `${d} ${SAYIDAN_SONRA[b]}`);
  s = s.replace(/(\d)\s?°/g, '$1 derece');
  s = s
    .replace(/≈/g, ' yaklaşık ')
    .replace(/÷/g, ' bölü ')
    .replace(/×/g, ' çarpı ')
    .replace(/[→←]/g, ', ')
    .replace(/·/g, ', ')
    .replace(/[“”"«»]/g, '');
  return s.replace(/\s+/g, ' ').replace(/\s+([,.!?…])/g, '$1').trim();
}

// ---------------- Sesler ve karakterler ----------------
let sesler = [];
const bozukSesler = new Set();
let dinleniyor = false;

export function sesleriYukle() {
  if (!destek()) return Promise.resolve([]);
  const al = () => (sesler = speechSynthesis.getVoices().filter((v) => /^tr/i.test(v.lang)));
  // Edge cevrim ici sesleri yerel seslerden sonra ikinci bir voiceschanged ile gelir: surekli dinlenir
  if (!dinleniyor) {
    speechSynthesis.addEventListener('voiceschanged', al);
    dinleniyor = true;
  }
  return new Promise((coz) => {
    if (al().length) return coz(sesler);
    const bitti = () => coz(al());
    speechSynthesis.addEventListener('voiceschanged', bitti, { once: true });
    setTimeout(bitti, 3000);
  });
}

// tercih: ses adinda aranan sozcukler. yedek: tercih edilen ses yoksa ayni ses farkli hiz/perdeyle ayrissin
const PROFILLER = {
  Elif: { tercih: ['Emel', 'Filiz', 'Yelda', 'Seda'], hiz: 1, perde: 1.05, yedek: { hiz: 1, perde: 1.3 } },
  Kerem: { tercih: ['Ahmet'], hiz: 1.12, perde: 1.1, yedek: { hiz: 1.2, perde: 1.15 } },
  Feza: { tercih: ['Ahmet'], hiz: 0.95, perde: 0.92, yedek: { hiz: 0.92, perde: 0.9 } },
  // ARGE: Tolga'nin mekanik tinisi; sistemler acildikca (guc) hizi ve perdesi dogallasir (CLAUDE.md §4, §10.2)
  ARGE: { tercih: ['Tolga'], hiz: 0.9, perde: 0.75, yedek: { hiz: 0.9, perde: 0.7 } }
};

export const ADLAR = { Elif: 'Elif', Kerem: 'Kerem', Feza: 'Dr. Feza', ARGE: 'ARGE' };

export function sesSec(konusan) {
  const p = PROFILLER[konusan];
  if (!p) return { ses: null };
  const uygun = sesler.filter((v) => !bozukSesler.has(v.name) && (v.localService || cevrimici()));
  for (const t of p.tercih) {
    const v = uygun.find((x) => x.name.toLocaleLowerCase('tr').includes(t.toLocaleLowerCase('tr')));
    if (v) return { ses: v, tercihli: true };
  }
  return { ses: uygun.find((v) => v.localService) || uygun[0] || null, tercihli: false };
}

export const sesAdi = (v) => (v ? `${v.name.replace(/^Microsoft /, '').replace(/ - .*$/, '').replace(/ Online \(Natural\)/, '')}${v.localService ? '' : ' (çevrim içi)'}` : 'yok');

let konusuyor = 0;
const bitti = () => {
  konusuyor = Math.max(0, konusuyor - 1);
  if (!konusuyor) muzikKis(false);
};

// kaynak: 'sahne' (ara sahne altyazisi) | 'bolum' (sag panel) | 'deneme' (ayarlar). kuyruk: oncekini kesmeden sona ekle.
// sureMs verilirse metin o surede bitsin diye hiz gerektigi kadar artar (altyazi zamanlamasi)
export function oku(konusan, metin, { sureMs = null, bozuk = false, kuyruk = false, kaynak = 'bolum' } = {}) {
  if (!destek()) return;
  if (kaynak !== 'deneme' && (ayarlar.sesliOkuma === 'kapali' || (kaynak === 'bolum' && ayarlar.sesliOkuma === 'sahneler'))) return;
  const p = PROFILLER[konusan];
  const temiz = konusmaMetni(metin);
  if (!p || !temiz) return;
  if (!sesler.length) sesleriYukle();
  const { ses, tercihli } = sesSec(konusan);
  if (!ses) return;
  let { hiz, perde } = tercihli ? p : p.yedek;
  if (konusan === 'ARGE') {
    const n = guc();
    hiz += n * 0.02;
    perde = bozuk ? 0.55 : perde + n * 0.035;
  }
  // Turkce konusma motoru hiz 1'de saniyede ~14 harf okur
  if (sureMs) hiz = Math.max(hiz, Math.min(1.45, temiz.length / (sureMs / 1000) / 14));
  if (!kuyruk) durdur();
  const u = new SpeechSynthesisUtterance(temiz);
  u.voice = ses;
  u.lang = ses.lang;
  u.rate = hiz;
  u.pitch = Math.min(2, Math.max(0, perde));
  let basladi = false;
  u.onstart = () => {
    basladi = true;
    konusuyor += 1;
    muzikKis(true);
  };
  u.onend = () => basladi && bitti();
  u.onerror = (e) => {
    if (basladi) bitti();
    // Cevrim ici ses (ag yok) baslayamadiysa bu oturumda birakilir, yerel sesle yeniden denenir
    if (!basladi && !ses.localService && e.error !== 'interrupted' && e.error !== 'canceled') {
      bozukSesler.add(ses.name);
      oku(konusan, metin, { sureMs, bozuk, kuyruk: true, kaynak });
    }
  };
  speechSynthesis.speak(u);
}

export function durdur() {
  if (!destek()) return;
  speechSynthesis.cancel();
  konusuyor = 0;
  muzikKis(false);
}

// Ayarlar penceresindeki "Sesleri dene"
export function sesleriDene() {
  durdur();
  [
    ['ARGE', 'Ben ARGE. Sistemler yeniden çevrim içi.'],
    ['Elif', 'Beni duyuyor musun? 72 saatimiz var.'],
    ['Kerem', 'Stajyer! Kapsül saatte 500 km ile gidiyor, beni bulun!'],
    ['Feza', 'Merhaba, ben Dr. Feza, yer kontrolden.']
  ].forEach(([k, m]) => oku(k, m, { kuyruk: true, kaynak: 'deneme' }));
}
