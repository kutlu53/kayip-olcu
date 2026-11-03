import { ayarlar } from '../config/settings.js';

// Kodla uretilen ses (CLAUDE.md §10.8): WebAudio ile ortam muzigi ve fiziksel efektler. Ses dosyasi yok,
// cevrim disi calisir. Uzayda ses yayilmaz (§10.7): dis sahnelerde itici/patlama sesi yerine govdeden gelen
// titresim, kilit ve telsiz sesleri. Seslendirme dosyalari (public/assets/audio) varsa seslendirmeCal ile calar.

let ctx = null;
let ana = null;
let muzikKazanc = null;
let efektKazanc = null;
let gurultuTamponu = null;

function baglam() {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  ctx = new AC();
  ana = ctx.createGain();
  ana.connect(ctx.destination);
  muzikKazanc = ctx.createGain();
  efektKazanc = ctx.createGain();
  muzikKazanc.connect(ana);
  efektKazanc.connect(ana);
  sesSeviyesiUygula();
  return ctx;
}

// Tarayicilar sesi ilk dokunustan once baslatmaz: ilk dokunusta baglam acilir
export function sesKilidiAc() {
  if (typeof document === 'undefined') return;
  const ac = () => {
    const c = baglam();
    if (c && c.state === 'suspended') c.resume();
    if (bekleyenMuzik !== undefined) muzikBaslat(bekleyenMuzik);
  };
  document.addEventListener('pointerdown', ac, { once: true });
  document.addEventListener('keydown', ac, { once: true });
}

// Sesli okuma sirasinda muzik kisilir (SesliOkuma.js)
let kisik = false;
export function muzikKis(durum) {
  if (kisik === durum) return;
  kisik = durum;
  sesSeviyesiUygula();
}

export function sesSeviyesiUygula() {
  if (!ctx) return;
  const t = ctx.currentTime;
  muzikKazanc.gain.setTargetAtTime(ayarlar.muzik === false ? 0 : kisik ? 0.1 : 0.32, t, 0.3);
  efektKazanc.gain.setTargetAtTime(ayarlar.efekt === false ? 0 : 0.7, t, 0.05);
}

const hazir = () => ctx && ctx.state === 'running';

function gurultu() {
  if (!gurultuTamponu) {
    gurultuTamponu = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = gurultuTamponu.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const k = ctx.createBufferSource();
  k.buffer = gurultuTamponu;
  k.loop = true;
  return k;
}

// Zarf: hizli giris, ustel sonum
function zarf(dugum, t, tepe, giris, sonum) {
  dugum.gain.setValueAtTime(0.0001, t);
  dugum.gain.exponentialRampToValueAtTime(tepe, t + giris);
  dugum.gain.exponentialRampToValueAtTime(0.0001, t + giris + sonum);
}

function ton(frekans, t, { tip = 'sine', tepe = 0.2, giris = 0.005, sonum = 0.3, kayma = null, hedef = efektKazanc } = {}) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = tip;
  o.frequency.setValueAtTime(frekans, t);
  if (kayma) o.frequency.exponentialRampToValueAtTime(kayma, t + giris + sonum);
  zarf(g, t, tepe, giris, sonum);
  o.connect(g).connect(hedef);
  o.start(t);
  o.stop(t + giris + sonum + 0.05);
}

function hisirti(t, { frekans = 1000, q = 1, tip = 'bandpass', tepe = 0.2, giris = 0.005, sonum = 0.2 } = {}) {
  const k = gurultu();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  f.type = tip;
  f.frequency.value = frekans;
  f.Q.value = q;
  zarf(g, t, tepe, giris, sonum);
  k.connect(f).connect(g).connect(efektKazanc);
  k.start(t);
  k.stop(t + giris + sonum + 0.05);
}

const EFEKTLER = {
  // Arayuz dokunusu: kisa, yumusak
  tik: (t) => ton(1500, t, { tepe: 0.05, sonum: 0.04 }),
  // Dogru: iki notali yumusak cinlama
  dogru: (t) => {
    ton(659, t, { tepe: 0.12, sonum: 0.35 });
    ton(988, t + 0.09, { tepe: 0.1, sonum: 0.5 });
  },
  // Yanlis: "Yanlis!" uyarisi yok (CLAUDE.md §0); hikayedeki sonuc gibi boguk bir metal tok sesi
  yanlis: (t) => {
    ton(140, t, { tip: 'triangle', tepe: 0.25, sonum: 0.35, kayma: 70 });
    hisirti(t, { frekans: 600, q: 3, tepe: 0.08, sonum: 0.12 });
  },
  // Kenetlenme kilidi: metal tik + govdeden gelen tok
  kilit: (t) => {
    hisirti(t, { frekans: 2600, q: 6, tepe: 0.25, sonum: 0.06 });
    ton(90, t + 0.02, { tip: 'triangle', tepe: 0.3, sonum: 0.25, kayma: 55 });
    hisirti(t + 0.12, { frekans: 1800, q: 8, tepe: 0.12, sonum: 0.05 });
  },
  // Govdeye yayilan titresim (itici atesi, carpma, sarsinti): alcak geciren gurultu
  gumbur: (t, { siddet = 0.008 } = {}) => {
    const tepe = Math.min(0.6, 0.15 + siddet * 30);
    hisirti(t, { frekans: 90, q: 0.7, tip: 'lowpass', tepe, giris: 0.02, sonum: 0.7 });
    ton(48, t, { tip: 'sine', tepe: tepe * 0.6, sonum: 0.6, kayma: 35 });
  },
  itici: (t) => {
    hisirti(t, { frekans: 140, q: 0.6, tip: 'lowpass', tepe: 0.35, giris: 0.15, sonum: 1.6 });
    ton(42, t, { tip: 'sine', tepe: 0.2, giris: 0.15, sonum: 1.5 });
  },
  // Guc kesilmesi / gelmesi: inen ve cikan ugultu
  gucKesik: (t) => ton(220, t, { tip: 'sawtooth', tepe: 0.05, giris: 0.02, sonum: 1.2, kayma: 40 }),
  gucAcik: (t) => ton(60, t, { tip: 'sawtooth', tepe: 0.04, giris: 0.3, sonum: 0.9, kayma: 240 }),
  // Sistem acildi: yukselen dort nota
  basari: (t) => [523, 659, 784, 1047].forEach((f, i) => ton(f, t + i * 0.12, { tepe: 0.1, sonum: 0.6 }))
};

export function efekt(ad, secenek) {
  baglam();
  if (!hazir() || ayarlar.efekt === false || !EFEKTLER[ad]) return;
  EFEKTLER[ad](ctx.currentTime + 0.01, secenek);
}

// ---------------- Ortam muzigi ----------------
// guc (0-7) katmanlari belirler (CLAUDE.md §10.3): dusuk gucte karanlik dron ve hizlanan nabiz (geri sayim
// yaklasiyor), guc arttikca akor isinir; 7'de nabiz durur, yavas bir tema motifi calar
const KOK = 55; // A1
let muzik = null;
let bekleyenMuzik;

export function muzikBaslat(guc) {
  bekleyenMuzik = guc;
  baglam();
  if (!hazir()) return;
  if (muzik && muzik.guc === guc) return;
  muzikDurdur();
  const t = ctx.currentTime;
  const kat = ctx.createGain();
  kat.gain.setValueAtTime(0.0001, t);
  kat.gain.exponentialRampToValueAtTime(1, t + 2.5);
  kat.connect(muzikKazanc);
  const filtre = ctx.createBiquadFilter();
  filtre.type = 'lowpass';
  filtre.frequency.value = 300 + (guc || 0) * 90;
  filtre.connect(kat);
  // Filtre kesimini yavasca dalgalandiran LFO
  const lfo = ctx.createOscillator();
  const lfoG = ctx.createGain();
  lfo.frequency.value = 0.07;
  lfoG.gain.value = 120;
  lfo.connect(lfoG).connect(filtre.frequency);
  const kaynaklar = [lfo];
  const g = guc === null || guc === undefined ? 3 : guc;
  // Dron: kok + bese; guc arttikca uclu (karanliktan aydinliga: minor -> major)
  const araliklar = [1, 1.5, 2];
  if (g >= 3) araliklar.push(g >= 7 ? 2.5 : 2.4);
  if (g >= 5) araliklar.push(3);
  araliklar.forEach((a, i) => {
    for (const sapma of [-3, 3]) {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = i === 0 ? 'sawtooth' : 'triangle';
      o.frequency.value = KOK * a;
      o.detune.value = sapma;
      og.gain.value = 0.06 / (i + 1);
      o.connect(og).connect(filtre);
      kaynaklar.push(o);
    }
  });
  kaynaklar.forEach((o) => o.start(t));
  muzik = { guc, kat, kaynaklar, zamanlayici: null };

  // Nabiz: geri sayim yaklastikca hizlanir; istasyon guvendeyken (7) yerini tema motifine birakir
  let sonraki = t + 1;
  const TEMA = [440, 554, 659, 554, 494, 440];
  let adim = 0;
  muzik.zamanlayici = setInterval(() => {
    if (!hazir()) return;
    while (sonraki < ctx.currentTime + 0.3) {
      if (g >= 7) {
        ton(TEMA[adim % TEMA.length], sonraki, { tip: 'sine', tepe: 0.05, giris: 0.08, sonum: 1.6, hedef: kat });
        sonraki += 1.4;
      } else {
        ton(KOK, sonraki, { tip: 'sine', tepe: 0.18, sonum: 0.25, kayma: 40, hedef: kat });
        ton(KOK, sonraki + 0.22, { tip: 'sine', tepe: 0.1, sonum: 0.2, kayma: 40, hedef: kat });
        sonraki += 60 / (48 + g * 7);
      }
      adim += 1;
    }
  }, 100);
}

export function muzikDurdur() {
  if (!muzik || !ctx) return;
  const { kat, kaynaklar, zamanlayici } = muzik;
  clearInterval(zamanlayici);
  const t = ctx.currentTime;
  kat.gain.cancelScheduledValues(t);
  kat.gain.setValueAtTime(Math.max(kat.gain.value, 0.0001), t);
  kat.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  kaynaklar.forEach((o) => o.stop(t + 1.3));
  muzik = null;
}

// Seslendirme dosyasi: ara sahne altyazisindaki "ses" alani (ör. "assets/audio/G-6.mp3"). Dosya yoksa sessizce gecilir.
// Dosya verilmeyen satirlari tarayici sesi okur (SesliOkuma.js)
let seslendirme = null;
export function seslendirmeCal(yol) {
  seslendirmeDurdur();
  if (!yol || typeof Audio === 'undefined' || ayarlar.sesliOkuma === 'kapali') return;
  seslendirme = new Audio(yol);
  seslendirme.play().catch(() => {});
}
export function seslendirmeDurdur() {
  if (seslendirme) seslendirme.pause();
  seslendirme = null;
}

// Hata ayiklama ve otomatik test icin durum
export const sesDurumu = () => ({ baglam: ctx ? ctx.state : 'yok', muzik: muzik ? muzik.guc : 'yok' });
