# Kayıp Ölçü

9. sınıf fizik dersinin "Kuvvet ve Hareket" ünitesini (FİZ.9.2.1–FİZ.9.2.7) öğreten, tarayıcıda çalışan, hikâye odaklı bir macera-bulmaca oyunu.

Yıl 2071. Göktürk-7 uzay istasyonu bir güneş fırtınasına yakalanır ve istasyonun yapay zekâsı ARGE birimleri, yönleri, kuvvetleri ve hareketi unutur. Oyuncu, ARGE'ye fiziği adım adım yeniden öğreterek istasyonu kurtarır.

**Oyna:** https://kutlu53.github.io/kayip-olcu/

## Durum

Geliştirme aşamasında. Şu an Giriş ara sahnesi oynatılabiliyor. Bölümler yapım aşamasında.

## Özellikler

- Tüm görseller kodla üretilir. Resim dosyası kullanılmaz, oyun küçük ve çevrim dışı çalışmaya uygundur.
- Ara sahneler, metinler ve zamanlamalar `src/data/*.json` dosyalarındadır. Öğretmen kod bilmeden düzenleyebilir.
- Akıllı tahta, bilgisayar, tablet ve telefonda çalışır. Görsel kalite cihaza göre otomatik ayarlanır.
- "Hareketi azalt" ayarı vardır: sarsıntı, flaş ve bozulma efektlerini kapatır.

## Geliştirme

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # dist/ klasörüne derler
```

Bir ara sahneyi doğrudan açmak için: `?sahne=G&panel=3`. Kalite kademesini zorlamak için: `?kalite=yuksek|orta|dusuk`.

Tasarım belgesi: [CLAUDE.md](CLAUDE.md) (öğretim programı eşlemesi, hikâye, bölüm tasarımları, görsel dil, teknik mimari, yol haritası).

## Teknoloji

Phaser 3, Vite, vanilla JavaScript.
