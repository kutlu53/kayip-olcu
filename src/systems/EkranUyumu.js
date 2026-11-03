import { sesDuraklat } from './Ses.js';

// Telefon ve tablet uyumu. Oyun 1280x720 yatay cizilir ve FIT ile olceklenir; dikey ekran icin ayri yerlesim yok:
// - Dikey tutulan telefonda "yan cevir" ekrani cikar, oyun (zamanlayicilar, muzik, konusma) bu sirada durur
// - Dikey tablette oyun oynanabilir boyutta kalir; yan cevirme onerilir, oneri kapatilabilir
// - Telefonda ilk dokunusta tam ekrana gecilir (adres cubugu yer kaplamasin), yonlendirme yataya kilitlenir
// - Kucuk olcekte dugmenin hemen yanina yapilan dokunus en yakin dugmeye gider (dokunma hedefi ~48 px kalsin)

const TELEFON_KISA_KENAR = 600;
const kisaKenar = () => Math.min(window.innerWidth, window.innerHeight);
const dikey = () => window.innerHeight > window.innerWidth;
const telefon = () => kisaKenar() < TELEFON_KISA_KENAR;
const dokunmatik = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
const bagimsiz = () => window.matchMedia && window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;

function cevirEkrani() {
  const el = document.createElement('div');
  el.id = 'yanCevir';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <div class="cihaz"><div class="ekran"></div></div>
    <div class="baslik">Cihazını yan çevir</div>
    <div class="aciklama telefonda">Kayıp Ölçü yatay ekranda oynanır. Oyun, sen çevirene kadar bekliyor.</div>
    <div class="aciklama tablette">Kayıp Ölçü yatay ekranda daha büyük ve rahat görünür. İstersen dikey de oynayabilirsin.</div>
    <button type="button" class="devam">Böyle devam et</button>`;
  document.body.appendChild(el);
  return el;
}

export function ekranUyumuKur(oyun) {
  if (typeof window === 'undefined') return;
  // Sahneler oyun hazir olunca (dokular yuklenince) kurulur
  if (!oyun.scene.isBooted) return oyun.events.once('ready', () => setTimeout(() => ekranUyumuKur(oyun), 0));
  const el = cevirEkrani();
  const devam = el.querySelector('.devam');
  let tabletDikeyKapatildi = false;
  let duraklatildi = false;

  const durakla = (d) => {
    if (d === duraklatildi) return;
    duraklatildi = d;
    if (d) oyun.pause();
    else oyun.resume();
    sesDuraklat(d);
    try {
      if (d) speechSynthesis.pause();
      else speechSynthesis.resume();
    } catch {
      // konusma motoru yok
    }
  };

  const guncelle = () => {
    // Yalnizca dokunmatik cihazlar: masaustunde dar bir tarayici penceresi oyunu durdurmasin
    const goster = dokunmatik() && dikey() && (telefon() || !tabletDikeyKapatildi);
    el.classList.toggle('acik', goster);
    // Tablette dikey oynanabilir: oyuncu isterse devam eder. Telefonda yazilar okunamayacak kadar kucuk olur
    el.classList.toggle('tablet', !telefon());
    durakla(goster);
    // Oyun dururken gelen boyut degisikligi Phaser'a ulasmaz: dondukten sonra olcek yenilenir
    if (!goster) setTimeout(() => oyun.scale.refresh(), 60);
  };
  devam.addEventListener('click', () => {
    tabletDikeyKapatildi = true;
    guncelle();
  });
  window.addEventListener('resize', guncelle);
  window.addEventListener('orientationchange', () => setTimeout(guncelle, 200));
  guncelle();

  // Telefonda tam ekran: tarayicilar yalnizca bir dokunusla izin verir
  const tamEkran = () => {
    if (!telefon() || !dokunmatik() || bagimsiz() || document.fullscreenElement) return;
    const kok = document.documentElement;
    if (!kok.requestFullscreen) return;
    kok
      .requestFullscreen({ navigationUI: 'hide' })
      .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}))
      .catch(() => {});
  };
  document.addEventListener('pointerup', tamEkran);

  dokunmaYardimi(oyun);
}

// Kucuk ekranda bos bir yere dokunulunca yakindaki (en fazla ~14 CSS px) dokunulabilir nesneye iletilir.
// Yalnizca 'pointerup' dinleyen nesneler (dugme, cip, kart); surukleme tutamaklari etkilenmez
function dokunmaYardimi(oyun) {
  const ESIK_CSS = 14;
  // Dokunma alaninin (hitArea) dunya koordinatlarindaki sinir kutusu. getBounds kaplarda yalnizca yazilari sayar
  const alanSiniri = (n) => {
    const a = n.input.hitArea;
    if (!a || a.width === undefined || !n.getWorldTransformMatrix) return null;
    const m = n.getWorldTransformMatrix();
    const x0 = a.x - (n.displayOriginX || 0);
    const y0 = a.y - (n.displayOriginY || 0);
    const koseler = [[x0, y0], [x0 + a.width, y0], [x0, y0 + a.height], [x0 + a.width, y0 + a.height]].map(([x, y]) => m.transformPoint(x, y));
    const xs = koseler.map((k) => k.x);
    const ys = koseler.map((k) => k.y);
    return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  };
  const gorunur = (n) => {
    for (let p = n; p; p = p.parentContainer) if (!p.visible || p.alpha === 0) return false;
    return true;
  };
  const kur = (sahne) => {
    sahne.input.on('pointerup', (isaretci, uzerindekiler) => {
      if (uzerindekiler.length) return;
      const olcek = oyun.scale.displayScale.x ? 1 / oyun.scale.displayScale.x : 1;
      if (olcek >= 0.75) return;
      // Kaydirma/surukleme degil, dokunus
      if (Math.hypot(isaretci.upX - isaretci.downX, isaretci.upY - isaretci.downY) > 12) return;
      const esik = ESIK_CSS / olcek;
      let enYakin = null;
      let enAz = esik;
      const tara = (liste) => {
        for (const n of liste) {
          const b = n.input && n.input.enabled && n.listenerCount('pointerup') > 0 && gorunur(n) ? alanSiniri(n) : null;
          if (b) {
            const dx = Math.max(b.x - isaretci.worldX, 0, isaretci.worldX - (b.x + b.width));
            const dy = Math.max(b.y - isaretci.worldY, 0, isaretci.worldY - (b.y + b.height));
            const d = Math.hypot(dx, dy);
            if (b.width > 0 && d < enAz) {
              enAz = d;
              enYakin = n;
            }
          }
          if (n.list) tara(n.list);
        }
      };
      tara(sahne.children.list);
      if (enYakin) enYakin.emit('pointerup', isaretci, 0, 0, { stopPropagation() {} });
    });
  };
  for (const sahne of oyun.scene.scenes) {
    sahne.sys.events.on('create', () => kur(sahne));
    if (sahne.sys.settings.active) kur(sahne);
  }
}
