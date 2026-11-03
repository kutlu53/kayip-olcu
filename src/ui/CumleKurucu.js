import { dugme } from './Dugme.js';
import { YAZI } from './tipografi.js';

// Gozlem Defteri genellemesi: cumle parcalarina dokunarak kural kurma ya da serbest metin (CLAUDE.md §6)
export function cumleKurucu(sahne, { x, y, genislik, parcalar, kontrol, serbestMetin = true, bosMetin = 'Parçalara dokunarak kuralını kur…' }) {
  const kap = sahne.add.container(0, 0);
  const secilen = [];
  const g = sahne.add.graphics();
  const cizgiY = y + 70;
  g.fillStyle(0x05070d, 0.7).fillRoundedRect(x, y, genislik, 110, 10);
  g.lineStyle(2, 0xd8f6ff, 0.35).strokeRoundedRect(x, y, genislik, 110, 10);
  const cumle = sahne.add.text(x + 18, y + 16, '', { fontFamily: YAZI, fontSize: '22px', color: '#FFFFFF', wordWrap: { width: genislik - 36 }, lineSpacing: 6 });
  const bos = sahne.add.text(x + 18, y + 16, bosMetin, { fontFamily: YAZI, fontSize: '20px', color: '#8A96A6', fontStyle: 'italic' });
  kap.add([g, cumle, bos]);

  // Parca havuzu: dokununca cumleye eklenir, tekrar dokununca geri doner.
  // Parcalar cok satira tasarsa alttaki dugmeler ekrandan cikmasin diye yazi kuculur
  const havuzY = cizgiY + 70;
  const yerlesim = (boyut, bosluk) => {
    let px = x;
    let py = havuzY;
    const yerler = parcalar.map((metin) => {
      const w = Math.max(64, olc(metin, boyut) + bosluk);
      if (px + w > x + genislik) {
        px = x;
        py += 62;
      }
      const yer = { x: px + w / 2, y: py + 26, w };
      px += w + 10;
      return yer;
    });
    return { yerler, altY: py + 100 };
  };
  const olc = (metin, boyut) => {
    const t = sahne.add.text(0, 0, metin, { fontFamily: YAZI, fontSize: `${boyut}px` });
    const w = t.width;
    t.destroy();
    return w;
  };
  let boyut = 19;
  let duzen = yerlesim(19, 32);
  if (duzen.altY > 680) {
    boyut = 17;
    duzen = yerlesim(17, 24);
  }
  const cipler = parcalar.map((metin, i) => {
    const { x: cx, y: cy, w } = duzen.yerler[i];
    const yazi = sahne.add.text(0, 0, metin, { fontFamily: YAZI, fontSize: `${boyut}px`, color: '#E6F7FA' }).setOrigin(0.5);
    const cip = sahne.add.container(cx, cy);
    const zemin = sahne.add.graphics();
    zemin.fillStyle(0x0b1426, 0.9).fillRoundedRect(-w / 2, -26, w, 52, 26);
    zemin.lineStyle(2, 0x5fe3e8, 0.6).strokeRoundedRect(-w / 2, -26, w, 52, 26);
    cip.add([zemin, yazi]);
    cip.setSize(w, 52).setInteractive({ useHandCursor: true });
    cip.on('pointerup', () => {
      const i = secilen.indexOf(metin);
      if (i >= 0) secilen.splice(i, 1);
      else secilen.push(metin);
      cip.setAlpha(secilen.includes(metin) ? 0.35 : 1);
      yenile();
    });
    kap.add(cip);
    return cip;
  });
  const yenile = () => {
    cumle.setText(secilen.join(' '));
    bos.setVisible(secilen.length === 0);
  };

  const altY = Math.min(duzen.altY, 684);
  const temizleG = Math.min(240, genislik * 0.36);
  const yazG = Math.min(280, genislik * 0.5);
  const temizle = dugme(sahne, x + temizleG / 2 + 10, altY, 'Temizle', () => {
    secilen.length = 0;
    cipler.forEach((c) => c.setAlpha(1));
    yenile();
  }, { genislik: temizleG, yukseklik: 52, boyut: 17 });
  // Bos cumle yanlis cevap sayilmaz: once parcalara dokunmasi hatirlatilir
  const yaz = dugme(sahne, x + genislik - yazG / 2 - 10, altY, 'Deftere yaz  ▸', () => {
    if (!secilen.length) {
      sahne.tweens.add({ targets: bos, alpha: { from: 0.3, to: 1 }, duration: 220, repeat: 2 });
      return;
    }
    kontrol({ tur: 'parca', parcalar: [...secilen], metin: secilen.join(' ') });
  }, { genislik: yazG, yukseklik: 56, birincil: true, boyut: 19 });
  kap.add([temizle, yaz]);

  if (serbestMetin) {
    // Bosluk varsa baglanti iki dugmenin arasinda, yoksa altinda durur
    const ortaBosluk = genislik - temizleG - yazG - 40;
    const sx = ortaBosluk >= 220 ? x + temizleG + 20 + ortaBosluk / 2 + 10 : x + genislik / 2;
    const sy = ortaBosluk >= 220 ? altY : altY + 50;
    const serbest = sahne.add
      .text(sx, sy, 'ya da kendi cümlenle yaz', { fontFamily: YAZI, fontSize: '16px', color: '#5FE3E8' })
      .setOrigin(0.5, ortaBosluk >= 220 ? 0.5 : 0)
      .setPadding(16, 12)
      .setInteractive({ useHandCursor: true });
    // Serbest metin acikken parcalar gizlenir: formun dugmesi parcalarin ustune binmesin, dokunus alttaki parcaya gecmesin
    const parcaOgeleri = [g, cumle, bos, ...cipler, temizle, yaz];
    const parcalaraDon = () => {
      if (kap.serbestAlan) kap.serbestAlan.destroy();
      kap.serbestAlan = null;
      parcaOgeleri.forEach((o) => o.setVisible(true));
      yenile();
      serbest.setText('ya da kendi cümlenle yaz');
    };
    serbest.on('pointerup', () => {
      if (kap.serbestAlan) return parcalaraDon();
      parcaOgeleri.forEach((o) => o.setVisible(false));
      serbest.setText('◂ parçalara dön');
      const html = `<form class="giris" style="width:${genislik - 20}px"><textarea name="metin" rows="3" maxlength="200" style="box-sizing:border-box;width:100%;font-size:20px;padding:10px;color:#EEF3F7;background:rgba(11,20,38,.95);border:2px solid #5FE3E8;border-radius:10px;font-family:inherit"></textarea><button type="submit">Deftere yaz</button></form>`;
      // DOM ogeleri kapsayiciya eklenmez; kapsayici yok edilince birlikte kaldirilir
      const dom = sahne.add.dom(x + genislik / 2, y + 110).createFromHTML(html);
      kap.once('destroy', () => dom.destroy());
      const alan = dom.node.querySelector('textarea');
      alan.focus();
      dom.node.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const metin = alan.value.trim();
        if (metin) kontrol({ tur: 'serbest', metin });
      });
      kap.serbestAlan = dom;
    });
    kap.add(serbest);
  }
  return kap;
}
