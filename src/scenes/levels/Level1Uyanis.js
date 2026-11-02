import Phaser from 'phaser';
import BolumTemel from './BolumTemel.js';
import veri from '../../data/bolum1.json';
import { secenekler } from '../../ui/Secenekler.js';
import { cumleKurucu } from '../../ui/CumleKurucu.js';
import { cip } from '../../ui/Cip.js';
import { dugme } from '../../ui/Dugme.js';
import { YAZI, MONO, aralikli } from '../../ui/tipografi.js';
import { kontrolOdasiDokusu } from '../../art/Interiors.js';
import { kivilcimYayici } from '../../fx/Particles.js';
import { karistir } from '../../art/Rastgele.js';

const doldur = (sablon, degerler) => sablon.replace(/\{(\w+)\}/g, (_, k) => (k in degerler ? degerler[k] : `{${k}}`));
const buyukHarf = (s) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
const ayniKume = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

// Bolum 1 · Uyanis (FİZ.9.2.1): birim-nicelik eslestirme -> birimleri parcalama -> genelleme -> SI cekirdegi.
// "Temel" ve "turetilmis" adlari ancak iki keşiften sonra verilir (CLAUDE.md §1, §7)
export default class Level1Uyanis extends BolumTemel {
  constructor() {
    super('Level1Uyanis', 1, 4);
  }

  arkaPlan() {
    this.add.image(470, 410, kontrolOdasiDokusu(this)).setAlpha(0.14);
  }

  basla(adim) {
    this.gorevHata = 0;
    this.cozulenler = [];
    if (adim === 'kesif2') this.kesif2();
    else if (adim === 'genelleme' || adim === 'gorev') {
      this.cozulenler = veri.kesif2.birimler;
      if (adim === 'genelleme') this.genelleme();
      else this.gorev();
    } else {
      this.kesif1();
      this.diyalog.oynat(veri.giris);
    }
  }

  // ---------------- KESIF 1: sensor ekranlari ----------------
  kesif1() {
    const k = veri.kesif1;
    this.adimBaslat({ no: 0, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'kesif1' });
    this.yonerge(k.yonerge);
    let secSensor = null;
    let secBirim = null;
    let kalan = k.sensorler.length;

    const ekranlar = k.sensorler.map((s, i) => {
      const x = 40 + (i % 4) * 217 + 102;
      const y = 205 + Math.floor(i / 4) * 106;
      const kap = this.ekle(this.add.container(x, y));
      const g = this.add.graphics();
      const baslik = this.add.text(-92, -36, s.ad, { fontFamily: MONO, fontSize: '12px', color: '#8A96A6' });
      const deger = this.add.text(-92, -8, `${s.deger} ??`, { fontFamily: MONO, fontSize: '26px', fontStyle: 'bold', color: '#FF6B6B' });
      kap.add([g, baslik, deger]);
      kap.ciz = (d) => {
        const kenar = { bos: [0x3a4656, 1], secili: [0x5fe3e8, 1], dogru: [0x5fe3e8, 0.5], yanlis: [0xd64545, 1] }[d];
        g.clear();
        g.fillStyle(0x04080d, 0.95).fillRoundedRect(-102, -46, 205, 92, 8);
        g.lineStyle(d === 'secili' ? 3 : 2, kenar[0], kenar[1]).strokeRoundedRect(-102, -46, 205, 92, 8);
      };
      kap.durum = 'bos';
      kap.ciz('bos');
      kap.deger = deger;
      kap.setSize(205, 92).setInteractive({ useHandCursor: true });
      kap.on('pointerup', () => {
        if (kap.durum === 'dogru') return;
        secSensor = i;
        ekranlar.forEach((e, j) => e.durum !== 'dogru' && e.ciz(j === i ? 'secili' : e.durum));
        if (secBirim) ata(i, secBirim.birim, secBirim);
      });
      return kap;
    });

    const birimler = Object.keys(veri.birimler);
    const cipler = karistir(birimler).map((b, i) =>
      this.ekle(
        cip(this, 63 + 46 + i * 106, 430, b, (c) => {
          if (secSensor !== null) return ata(secSensor, b, c);
          secBirim = { birim: b, cip: c };
          cipler.forEach((d) => d.durum !== 'pasif' && d.durumAyarla(d === c ? 'secili' : 'normal'));
        }, { genislik: 92 })
      )
    );

    const ata = (i, birim) => {
      const s = k.sensorler[i];
      const e = ekranlar[i];
      secSensor = null;
      secBirim = null;
      cipler.forEach((d) => d.durum === 'secili' && d.durumAyarla('normal'));
      e.deger.setText(`${s.deger} ${birim}`);
      if (birim === s.birim) {
        e.durum = 'dogru';
        e.ciz('dogru');
        e.deger.setColor('#5FE3E8');
        e.disableInteractive();
        this.cevap({ dogru: true, ayrinti: `sensor ${s.nicelik}: ${birim}` });
        this.diyalog.soyle('ARGE', doldur(k.dogru, { deger: s.deger, birim }));
        kalan -= 1;
        if (kalan === 0) this.time.delayedCall(1200, () => newtonSorusu());
        return;
      }
      e.durum = 'yanlis';
      e.ciz('yanlis');
      e.deger.setColor('#FF8A8A');
      this.cevap({ dogru: false, ayrinti: `sensor ${s.nicelik}: ${birim}` });
      const ozel = k.ozelYanlis[`${s.nicelik}:${birim}`];
      this.diyalog.soyle(
        'ARGE',
        ozel || doldur(k.yanlisSablon, { ad: buyukHarf(s.ad.toLocaleLowerCase('tr')), deger: s.deger, secilen: birim, secilenNicelik: veri.birimler[birim], nicelik: buyukHarf(s.nicelik) })
      );
    };

    const newtonSorusu = () => {
      const n = k.newton;
      cipler.forEach((c) => c.setVisible(false));
      this.ekle(
        secenekler(this, 160, 400, n.soru, n.secenekler, (s) => {
          this.cevap({ dogru: s.dogru, yanilgi: s.yanilgi, ayrinti: `newton: ${s.metin}` });
          this.diyalog.soyle('ARGE', s.dogru ? n.dogru : n.yanlis);
          this.devam('Keşif 2  ▸', () => this.kesif2());
        }, { genislik: 600, yukseklik: 54 })
      );
    };
  }

  // ---------------- KESIF 2: birim cozucu ----------------
  kesif2() {
    const k = veri.kesif2;
    this.adimBaslat({ no: 1, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'kesif2' });
    this.yonerge(k.yonerge);
    this.cozulenler = [];

    const g = this.ekle(this.add.graphics());
    g.fillStyle(0x04080d, 0.9).fillRoundedRect(40, 160, 500, 180, 10);
    g.lineStyle(2, 0x5fe3e8, 0.5).strokeRoundedRect(40, 160, 500, 180, 10);
    const nicelik = this.yazi(64, 176, '', { fontFamily: MONO, fontSize: '15px', color: '#8A96A6' });
    const birim = this.yazi(290, 238, '', { fontSize: '64px', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
    const arsiv = this.yazi(64, 296, '', { fontSize: '17px', color: '#D8F6FF' });

    // Sag: iki kume kendiliginden olusur (adlari henuz verilmez)
    const lg = this.ekle(this.add.graphics());
    lg.fillStyle(0x04080d, 0.85).fillRoundedRect(570, 160, 350, 300, 10);
    lg.lineStyle(1, 0x5fe3e8, 0.35).strokeRoundedRect(570, 160, 350, 300, 10).lineBetween(745, 170, 745, 450);
    this.yazi(658, 172, 'BAŞKA BİRİMLERDEN\nOLUŞANLAR', { fontFamily: MONO, fontSize: '12px', color: '#5FE3E8', align: 'center' }).setOrigin(0.5, 0);
    this.yazi(833, 172, 'PARÇALANAMAYANLAR', { fontFamily: MONO, fontSize: '12px', color: '#5FE3E8' }).setOrigin(0.5, 0);
    const listeler = [this.yazi(658, 220, '', { fontSize: '19px', align: 'center', lineSpacing: 10 }).setOrigin(0.5, 0), this.yazi(833, 220, '', { fontSize: '19px', align: 'center', lineSpacing: 10 }).setOrigin(0.5, 0)];

    let sira = 0;
    const secim = new Set();
    const parcalar = k.parcalar.map((p, i) => {
      const genis = p === 'Parçalanamaz';
      return this.ekle(
        cip(this, genis ? 140 : 85 + i * 90, genis ? 460 : 390, p, (c) => {
          if (secim.has(p)) secim.delete(p);
          else secim.add(p);
          c.durumAyarla(secim.has(p) ? 'secili' : 'normal');
        }, { genislik: genis ? 200 : 80, boyut: genis ? 18 : 20 })
      );
    });
    const coz = this.ekle(dugme(this, 440, 460, 'ÇÖZ', () => kontrol(), { genislik: 180, yukseklik: 56, birincil: true, boyut: 20 }));

    const goster = () => {
      const b = k.birimler[sira];
      nicelik.setText(aralikli(b.nicelik.toLocaleUpperCase('tr')));
      birim.setText(b.birim);
      arsiv.setText(b.arsiv);
      secim.clear();
      parcalar.forEach((c) => c.durumAyarla('normal'));
    };
    const listeYaz = () => {
      listeler[0].setText(this.cozulenler.filter((b) => !b.cevap.includes('Parçalanamaz')).map((b) => b.acilim).join('\n'));
      listeler[1].setText(this.cozulenler.filter((b) => b.cevap.includes('Parçalanamaz')).map((b) => b.acilim).join('\n'));
    };

    const kontrol = () => {
      const b = k.birimler[sira];
      const secilen = [...secim];
      if (!secilen.length) return this.diyalog.soyle('Elif', 'Önce parçaları seç.');
      if (ayniKume(secilen, b.cevap)) {
        this.cevap({ dogru: true, ayrinti: `cozucu ${b.birim}: ${secilen.join('+')}` });
        this.cozulenler.push(b);
        listeYaz();
        this.diyalog.soyle('ARGE', doldur(k.dogru, { acilim: b.acilim }));
        sira += 1;
        if (sira < k.birimler.length) return this.time.delayedCall(900, goster);
        coz.destroy();
        parcalar.forEach((c) => c.durumAyarla('pasif'));
        this.time.delayedCall(1800, () => this.diyalog.soyle('ARGE', k.kapanis));
        return this.devam('Kuralını yaz  ▸', () => this.genelleme());
      }
      const temelSandi = b.temelSanilirsa && ayniKume(secilen, ['Parçalanamaz']);
      this.cevap({ dogru: false, yanilgi: temelSandi ? b.temelSanilirsa : null, ayrinti: `cozucu ${b.birim}: ${secilen.join('+')}` });
      const kurulan = secilen.includes('Parçalanamaz') ? (secilen.length > 1 ? 'çelişkili bir birim' : 'parçalanamayan bir birim') : secilen.join('·');
      this.diyalog.soyle('ARGE', temelSandi ? k.kuvvetTemel : doldur(k.yanlis, { secim: kurulan, birim: b.birim }));
    };
    goster();
  }

  // ---------------- GENELLEME ----------------
  genelleme() {
    const k = veri.genelleme;
    this.adimBaslat({ no: 2, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'genelleme' });
    this.yonerge(k.yonerge);
    const olusan = this.cozulenler.filter((b) => !b.cevap.includes('Parçalanamaz')).map((b) => b.birim);
    const olusmayan = this.cozulenler.filter((b) => b.cevap.includes('Parçalanamaz')).map((b) => b.birim);
    this.kumeOzeti = `Başka birimlerden oluşanlar: ${olusan.join(', ')} · Parçalanamayanlar: ${olusmayan.join(', ')}`;
    this.yazi(120, 168, `Başka birimlerden oluşanlar:  ${olusan.join('   ')}`, { fontSize: '19px', color: '#D8F6FF' });
    this.yazi(120, 200, `Parçalanamayanlar:  ${olusmayan.join('   ')}`, { fontSize: '19px', color: '#D8F6FF' });
    this.kurucu = this.ekle(
      cumleKurucu(this, { x: 120, y: 240, genislik: 800, parcalar: karistir([...k.parcalar, ...k.celdiriciler]), kontrol: (c) => this.genellemeKontrol(c) })
    );
  }

  genellemeKontrol(c) {
    const k = veri.genelleme;
    if (c.tur === 'parca') {
      if (k.kabul.some((d) => d.length === c.parcalar.length && d.every((p, i) => p === c.parcalar[i]))) return this.kuralKabul(c.metin, 'otomatik');
      const kuvvet = c.parcalar.includes('kuvvet gibi');
      const kisa = c.parcalar.includes('birimi kısa olan');
      this.cevap({ dogru: false, yanilgi: kuvvet ? 'M_KUVVET_TEMEL' : null, ayrinti: `kural: ${c.metin}` });
      this.diyalog.soyle('ARGE', kuvvet ? k.kuvvetTemel : kisa ? k.kisaUzun : k.eksik);
      return;
    }
    const m = c.metin.toLocaleLowerCase('tr');
    if (k.serbestAnahtarlar.every((grup) => grup.some((a) => m.includes(a)))) return this.kuralKabul(c.metin, 'beklemede');
    this.cevap({ dogru: false, ayrinti: `serbest kural: ${c.metin}` });
    this.diyalog.soyle('Elif', k.serbestEksik);
  }

  kuralKabul(metin, onay) {
    this.cevap({ dogru: true, ayrinti: `kural (${onay}): ${metin}` });
    this.defterYaz({ tur: 'tablo', metin: this.kumeOzeti });
    this.defterYaz({ tur: 'kural', metin, onay });
    if (this.kurucu) this.kurucu.destroy();
    this.yazi(120, 300, `“${metin}”`, { fontSize: '23px', color: '#FFFFFF', fontStyle: 'italic', wordWrap: { width: 800 } });
    this.yazi(120, 400, onay === 'beklemede' ? 'Deftere yazıldı · öğretmen onayı bekliyor' : 'Deftere yazıldı', { fontSize: '15px', color: '#8A96A6' });
    this.diyalog.soyle('ARGE', veri.genelleme.kabulMesaji);
    this.devam('Göreve geç  ▸', () => this.gorev());
  }

  // ---------------- GOREV: SI cekirdegi ----------------
  gorev() {
    const k = veri.gorev;
    this.adimBaslat({ no: 3, baslik: k.baslik, ipuclari: k.ipuclari, ad: 'gorev' });
    this.yonerge(k.yonerge);
    this.input.dragDistanceThreshold = 8;
    const M = { x: 650, y: 418 };
    const IC = 112;
    const DIS = 220;
    const g = this.ekle(this.add.graphics());
    g.lineStyle(2, 0x5fe3e8, 0.25).strokeCircle(M.x, M.y, DIS).strokeCircle(M.x, M.y, IC);
    g.fillStyle(0x5fe3e8, 0.05).fillCircle(M.x, M.y, IC + 44);
    this.yazi(M.x, M.y - 48, 'İÇ HALKA · TEMEL', { fontFamily: MONO, fontSize: '11px', color: '#5FE3E8' }).setOrigin(0.5);
    this.yazi(M.x + DIS + 6, M.y + DIS - 20, 'DIŞ HALKA\nTÜRETİLMİŞ', { fontFamily: MONO, fontSize: '11px', color: '#5FE3E8' }).setOrigin(0, 0.5);

    // Yuvalar
    const yuvalar = [];
    for (let i = 0; i < 7; i++) yuvalar.push({ halka: 'ic', aci: -90 + (i * 360) / 7, r: IC });
    for (let i = 0; i < 5; i++) yuvalar.push({ halka: 'dis', aci: -90 + 36 + i * 72, r: DIS });
    const yg = this.ekle(this.add.graphics());
    for (const y of yuvalar) {
      const a = (y.aci * Math.PI) / 180;
      y.x = M.x + Math.cos(a) * y.r;
      y.y = M.y + Math.sin(a) * y.r;
      y.kart = null;
      y.alan = this.ekle(this.add.zone(y.x, y.y, 80, 80).setInteractive({ useHandCursor: true }));
      y.alan.on('pointerup', () => this.secili && this.yerlestir(this.secili, y));
    }
    this.yuvalar = yuvalar;
    this.yuvaCiz = () => {
      yg.clear();
      for (const y of yuvalar) {
        if (y.kart) continue;
        yg.lineStyle(2, 0x8a96a6, 0.5).strokeCircle(y.x, y.y, 36);
        yg.fillStyle(0x04080d, 0.7).fillCircle(y.x, y.y, 35);
      }
    };
    this.yuvaCiz();
    this.kivilcim = this.ekle(kivilcimYayici(this, 0, 0));

    // Kartlar (karisik sirada tepside)
    this.kartlar = karistir(k.nicelikler).map((n, j) => this.kartKur(n, 125 + (j % 2) * 175, 205 + Math.floor(j / 2) * 64));
    this.baslat = this.ekle(dugme(this, M.x, M.y, 'BAŞLAT', () => this.cekirdekBaslat(), { genislik: 130, yukseklik: 56, birincil: true, boyut: 18 }));
  }

  kartKur(n, x, y) {
    const kap = this.ekle(this.add.container(x, y));
    const kart = this.add.graphics();
    const jeton = this.add.graphics();
    const ad = this.add.text(-74, -18, n.ad, { fontFamily: YAZI, fontSize: '14px', color: '#D8F6FF' });
    const birim = this.add.text(-74, 1, n.aciklama ? `${n.birim}  (${n.aciklama})` : n.birim, { fontFamily: YAZI, fontSize: '17px', fontStyle: 'bold', color: '#FFFFFF' });
    const jBirim = this.add.text(0, -6, n.birim, { fontFamily: YAZI, fontSize: '20px', fontStyle: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
    const jAd = this.add.text(0, 15, n.ad, { fontFamily: YAZI, fontSize: '10px', color: '#D8F6FF', align: 'center', wordWrap: { width: 70 } }).setOrigin(0.5, 0.5);
    kap.add([kart, jeton, ad, birim, jBirim, jAd]);
    kap.n = n;
    kap.ev = [x, y];
    kap.yuva = null;
    kap.ciz = (vurgu = null) => {
      const renk = vurgu === 'yanlis' ? 0xd64545 : vurgu === 'secili' ? 0xffffff : 0x5fe3e8;
      kart.clear();
      jeton.clear();
      const yerde = !!kap.yuva;
      kart.setVisible(!yerde);
      ad.setVisible(!yerde);
      birim.setVisible(!yerde);
      jeton.setVisible(yerde);
      jBirim.setVisible(yerde);
      jAd.setVisible(yerde);
      if (yerde) {
        jeton.fillStyle(vurgu === 'yanlis' ? 0x2a1214 : 0x0f2230, 1).fillCircle(0, 0, 37);
        jeton.lineStyle(vurgu ? 3 : 2, renk, 1).strokeCircle(0, 0, 37);
      } else {
        kart.fillStyle(0x0b1426, 0.95).fillRoundedRect(-82, -27, 164, 54, 10);
        kart.lineStyle(vurgu === 'secili' ? 3 : 2, renk, vurgu ? 1 : 0.55).strokeRoundedRect(-82, -27, 164, 54, 10);
      }
    };
    kap.ciz();
    kap.setSize(164, 54).setInteractive({ useHandCursor: true, draggable: true });
    kap.on('dragstart', () => {
      kap.suruklendi = true;
      kap.setDepth(100);
      if (kap.yuva) this.cikar(kap);
    });
    kap.on('drag', (p) => kap.setPosition(p.x, p.y));
    kap.on('dragend', () => {
      kap.setDepth(0);
      const hedef = this.yuvalar.filter((y) => !y.kart).sort((a, b) => Phaser.Math.Distance.Between(kap.x, kap.y, a.x, a.y) - Phaser.Math.Distance.Between(kap.x, kap.y, b.x, b.y))[0];
      if (hedef && Phaser.Math.Distance.Between(kap.x, kap.y, hedef.x, hedef.y) < 55) this.yerlestir(kap, hedef);
      else this.eveDon(kap);
    });
    kap.on('pointerdown', () => (kap.suruklendi = false));
    kap.on('pointerup', () => {
      if (kap.suruklendi) return;
      // Dokun-dokun yerlestirme: once kart, sonra yuva (akilli tahta icin)
      if (kap.yuva) {
        this.cikar(kap);
        return this.eveDon(kap);
      }
      if (this.secili) this.secili.ciz();
      this.secili = this.secili === kap ? null : kap;
      if (this.secili) kap.ciz('secili');
    });
    return kap;
  }

  yerlestir(kart, yuva) {
    if (yuva.kart) return this.eveDon(kart);
    const n = kart.n;
    // Bagimlilik kilidi: turetilmis nicelik dis halkaya ancak temel parcalari ic halkadayken takilir
    if (yuva.halka === 'dis' && n.gerekli) {
      const ictekiler = this.yuvalar.filter((y) => y.halka === 'ic' && y.kart).map((y) => y.kart.n.id);
      const eksik = n.gerekli.filter((id) => !ictekiler.includes(id));
      if (eksik.length) {
        const adlar = eksik.map((id) => veri.gorev.nicelikler.find((q) => q.id === id)).map((q) => `${q.ad.toLocaleLowerCase('tr')} (${q.birim})`);
        this.diyalog.soyle('ARGE', doldur(veri.gorev.kilitli, { ad: n.ad, eksik: adlar.join(', ') }));
        return this.eveDon(kart);
      }
    }
    if (this.secili) this.secili = null;
    yuva.kart = kart;
    kart.yuva = yuva;
    kart.setPosition(yuva.x, yuva.y);
    this.boyut(kart, 76, 76);
    kart.ciz();
    this.yuvaCiz();
  }

  cikar(kart) {
    const yuva = kart.yuva;
    if (!yuva) return;
    yuva.kart = null;
    kart.yuva = null;
    this.boyut(kart, 164, 54);
    kart.ciz();
    this.yuvaCiz();
    // Temel parca cekilince ona bagli turetilmis nicelikler dis halkadan duser
    if (yuva.halka === 'ic') {
      for (const y of this.yuvalar) {
        if (y.halka === 'dis' && y.kart && (y.kart.n.gerekli || []).includes(kart.n.id)) {
          const dusen = y.kart;
          this.cikar(dusen);
          this.eveDon(dusen);
          this.diyalog.soyle('ARGE', `${kart.n.ad} çekilince ${dusen.n.ad.toLocaleLowerCase('tr')} dış halkadan düştü.`);
        }
      }
    }
  }

  // Kapsayicinin dokunma alani setSize ile kendiliginden guncellenmez
  boyut(kart, w, h) {
    kart.setSize(w, h);
    if (kart.input) kart.input.hitArea.setTo(0, 0, w, h);
  }

  eveDon(kart) {
    kart.ciz();
    this.tweens.add({ targets: kart, x: kart.ev[0], y: kart.ev[1], duration: 250, ease: 'Quad.easeOut' });
  }

  cekirdekBaslat() {
    const k = veri.gorev;
    const dolu = this.yuvalar.filter((y) => y.kart).length;
    if (dolu < this.yuvalar.length) return this.diyalog.soyle('ARGE', `Çekirdekte ${this.yuvalar.length - dolu} boş yuva var. Önce hepsini doldur.`);
    const yanlislar = this.yuvalar.filter((y) => (y.halka === 'ic') !== (y.kart.n.tur === 'temel'));
    const dogruSayisi = this.yuvalar.length - yanlislar.length;
    const basari = dogruSayisi >= k.enAzDogru;
    const kuvvetIcte = yanlislar.find((y) => y.kart.n.temeldeYanilgi && y.halka === 'ic');
    this.cevap({
      dogru: basari,
      yanilgi: !basari && kuvvetIcte ? kuvvetIcte.kart.n.temeldeYanilgi : null,
      ayrinti: `cekirdek ${dogruSayisi}/12; yanlis: ${yanlislar.map((y) => `${y.kart.n.ad}→${y.halka}`).join(', ') || 'yok'}`
    });
    if (!basari) {
      this.gorevHata += 1;
      // Sonuc: yanlis yuvalar kivilcim cikarir, cekirdek titrer
      for (const y of yanlislar) {
        y.kart.ciz('yanlis');
        this.kivilcim.explode(10, y.x, y.y);
      }
      this.cameras.main.shake(300, 0.004);
      this.diyalog.soyle('ARGE', kuvvetIcte ? k.kuvvetTemel : doldur(k.basarisiz, { yanlis: yanlislar.map((y) => y.kart.n.ad).join(', ') }));
      this.time.delayedCall(1800, () => yanlislar.forEach((y) => y.kart && y.kart.ciz()));
      return;
    }
    this.baslat.destroy();
    for (const kart of this.kartlar) kart.disableInteractive();
    const parilti = this.ekle(this.add.graphics());
    this.yuvalar.forEach((y, i) =>
      this.time.delayedCall(i * 140, () => parilti.lineStyle(3, 0x5fe3e8, 0.9).strokeCircle(y.x, y.y, 42))
    );
    this.diyalog.soyle('ARGE', doldur(k.basari, { dogru: dogruSayisi }));
    const yildiz = this.gorevHata === 0 ? 3 : this.gorevHata <= 2 ? 2 : 1;
    this.time.delayedCall(2000, () => {
      this.yazi(650, 418, '★'.repeat(yildiz) + '☆'.repeat(3 - yildiz), { fontSize: '40px', color: '#FFD79A' }).setOrigin(0.5);
    });
    this.time.delayedCall(4200, () => this.bitir(yildiz));
  }
}
