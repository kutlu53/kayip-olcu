// Kayit: IndexedDB, yoksa localStorage (CLAUDE.md §11).
// Kisisel veri yok: oyuncu kimligi "takmaad#SINIFKODU" (CLAUDE.md §0)

const DB_ADI = 'kayipOlcu';
const SURUM = 1;
const DEPOLAR = { oyuncular: { keyPath: 'id' }, olaylar: { autoIncrement: true } };
const AKTIF_ANAHTARI = 'kayipOlcu.aktifOyuncu';

let dbSozu = null;

function db() {
  if (!dbSozu) {
    dbSozu = new Promise((coz) => {
      if (typeof indexedDB === 'undefined') return coz(null);
      try {
        const istek = indexedDB.open(DB_ADI, SURUM);
        istek.onupgradeneeded = () => {
          for (const [ad, ayar] of Object.entries(DEPOLAR)) {
            if (!istek.result.objectStoreNames.contains(ad)) istek.result.createObjectStore(ad, ayar);
          }
        };
        istek.onsuccess = () => coz(istek.result);
        istek.onerror = () => coz(null);
      } catch (e) {
        coz(null);
      }
    });
  }
  return dbSozu;
}

// ---------- localStorage yedegi ----------
const yedekOku = (depo) => {
  try {
    return JSON.parse(localStorage.getItem(`kayipOlcu.${depo}`)) || [];
  } catch (e) {
    return [];
  }
};
const yedekYaz = (depo, liste) => {
  try {
    localStorage.setItem(`kayipOlcu.${depo}`, JSON.stringify(liste));
  } catch (e) {
    // depolama dolu ya da kapali: veri yalnizca bu oturumda kalir
  }
};

function islem(d, depo, kip, fn) {
  return new Promise((coz, red) => {
    const tx = d.transaction(depo, kip);
    const sonuc = fn(tx.objectStore(depo));
    tx.oncomplete = () => coz(sonuc && sonuc.result);
    tx.onerror = () => red(tx.error);
  });
}

export async function tumu(depo) {
  const d = await db();
  if (!d) return yedekOku(depo);
  return islem(d, depo, 'readonly', (s) => s.getAll());
}

// Anahtarli depoda ekler ya da gunceller; anahtarsiz depoda yeni kayit ekler
export async function yaz(depo, kayit) {
  const d = await db();
  if (d) return islem(d, depo, 'readwrite', (s) => s.put(kayit));
  const liste = yedekOku(depo);
  const anahtar = DEPOLAR[depo].keyPath;
  const i = anahtar ? liste.findIndex((k) => k[anahtar] === kayit[anahtar]) : -1;
  if (i >= 0) liste[i] = kayit;
  else liste.push(kayit);
  yedekYaz(depo, liste);
}

// Cok kaydi tek islemde ekler (ogretmen panosunda CSV ice aktarimi)
export async function topluEkle(depo, kayitlar) {
  const d = await db();
  if (d) return islem(d, depo, 'readwrite', (s) => kayitlar.forEach((k) => s.put(k)));
  yedekYaz(depo, [...yedekOku(depo), ...kayitlar]);
}

// ---------- Oyuncu ----------
export const oyuncuKimligi = (takmaAd, sinifKodu) => `${takmaAd}#${sinifKodu}`;

let aktif = null;
export const aktifOyuncu = () => aktif;

export async function oyuncuGetir(id) {
  return (await tumu('oyuncular')).find((o) => o.id === id) || null;
}

export async function sonOyuncu() {
  let id = null;
  try {
    id = localStorage.getItem(AKTIF_ANAHTARI);
  } catch (e) {
    id = null;
  }
  return id ? oyuncuGetir(id) : null;
}

// Ayni takma ad + sinif kodu girilirse eski ilerleme yuklenir (paylasilan okul bilgisayarlari)
export async function oyuncuAc(takmaAd, sinifKodu) {
  const id = oyuncuKimligi(takmaAd, sinifKodu);
  let oyuncu = await oyuncuGetir(id);
  const yeni = !oyuncu;
  if (yeni) {
    oyuncu = { id, takmaAd, sinifKodu, olusturma: new Date().toISOString(), girisIzlendi: false, sistemler: [], bolumler: {} };
    await yaz('oyuncular', oyuncu);
  }
  aktifAyarla(oyuncu);
  return { oyuncu, yeni };
}

export function aktifAyarla(oyuncu) {
  aktif = oyuncu;
  try {
    localStorage.setItem(AKTIF_ANAHTARI, oyuncu.id);
  } catch (e) {
    // yalnizca bu oturumda hatirlanir
  }
}

export async function aktifiKaydet() {
  if (!aktif) return;
  aktif.guncelleme = new Date().toISOString();
  await yaz('oyuncular', aktif);
}

// Baska bir oyuncunun kaydini gunceller (ogretmen onayi). Aktif oyuncuysa bellekteki kopya da guncellenir,
// yoksa sonraki aktifiKaydet onayi ezerdi
export async function oyuncuKaydet(oyuncu) {
  if (aktif && aktif.id === oyuncu.id && aktif !== oyuncu) Object.assign(aktif, oyuncu);
  await yaz('oyuncular', oyuncu);
}

// Acilan sistem sayisi = guc (0-7): istasyonun aydinlanmasi ve ARGE'nin durumu (CLAUDE.md §10.3)
export const guc = (oyuncu = aktif) => (oyuncu ? oyuncu.sistemler.length : 0);
