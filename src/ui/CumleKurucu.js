import { dugme } from './Dugme.js';
import { YAZI } from './tipografi.js';

// Gozlem Defteri genellemesi: cumle parcalarina dokunarak kural kurma ya da serbest metin (CLAUDE.md §6)
export function cumleKurucu(sahne, { x, y, genislik, parcalar, kontrol, serbestMetin = true }) {
  const kap = sahne.add.container(0, 0);
  const secilen = [];
  const g = sahne.add.graphics();
  const cizgiY = y + 70;
  g.fillStyle(0x05070d, 0.7).fillRoundedRect(x, y, genislik, 110, 10);
  g.lineStyle(2, 0xd8f6ff, 0.35).strokeRoundedRect(x, y, genislik, 110, 10);
  const cumle = sahne.add.text(x + 18, y + 16, '', { fontFamily: YAZI, fontSize: '22px', color: '#FFFFFF', wordWrap: { width: genislik - 36 }, lineSpacing: 6 });
  const bos = sahne.add.text(x + 18, y + 16, 'Parçalara dokunarak kuralını kur…', { fontFamily: YAZI, fontSize: '20px', color: '#8A96A6', fontStyle: 'italic' });
  kap.add([g, cumle, bos]);

  // Parca havuzu: dokununca cumleye eklenir, tekrar dokununca geri doner
  const havuzY = cizgiY + 70;
  let px = x;
  let py = havuzY;
  const cipler = parcalar.map((metin) => {
    const yazi = sahne.add.text(0, 0, metin, { fontFamily: YAZI, fontSize: '19px', color: '#E6F7FA' }).setOrigin(0.5);
    const w = Math.max(64, yazi.width + 32);
    if (px + w > x + genislik) {
      px = x;
      py += 62;
    }
    const cip = sahne.add.container(px + w / 2, py + 26);
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
    px += w + 10;
    kap.add(cip);
    return cip;
  });
  const yenile = () => {
    cumle.setText(secilen.join(' '));
    bos.setVisible(secilen.length === 0);
  };

  const altY = py + 100;
  kap.add(
    dugme(sahne, x + 130, altY, 'Temizle', () => {
      secilen.length = 0;
      cipler.forEach((c) => c.setAlpha(1));
      yenile();
    }, { genislik: 240, yukseklik: 52, boyut: 17 })
  );
  kap.add(dugme(sahne, x + genislik - 150, altY, 'Deftere yaz  ▸', () => kontrol({ tur: 'parca', parcalar: [...secilen], metin: secilen.join(' ') }), { genislik: 280, yukseklik: 56, birincil: true, boyut: 19 }));

  if (serbestMetin) {
    const serbest = sahne.add
      .text(x + genislik / 2, altY + 50, 'ya da kendi cümlenle yaz', { fontFamily: YAZI, fontSize: '16px', color: '#5FE3E8' })
      .setOrigin(0.5, 0)
      .setPadding(16, 12)
      .setInteractive({ useHandCursor: true });
    serbest.on('pointerup', () => {
      const html = `<form class="giris" style="width:${genislik - 20}px"><textarea name="metin" rows="3" maxlength="200" style="box-sizing:border-box;width:100%;font-size:20px;padding:10px;color:#EEF3F7;background:rgba(11,20,38,.95);border:2px solid #5FE3E8;border-radius:10px;font-family:inherit"></textarea><button type="submit">Deftere yaz</button></form>`;
      if (kap.serbestAlan) return;
      // DOM ogeleri kapsayiciya eklenmez; kapsayici yok edilince birlikte kaldirilir
      const dom = sahne.add.dom(x + genislik / 2, y + 90).createFromHTML(html);
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
