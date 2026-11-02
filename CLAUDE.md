# Kayıp Ölçü — Proje Bilgi Dosyası (Claude Code için)

> Bu dosya projenin tek kaynak belgesidir. Repo köküne `CLAUDE.md` adıyla koyarsan Claude Code her oturumda otomatik okur.
> Son güncelleme: 2 Kasım 2026

---

## 0. Claude Code için çalışma kuralları

- Arayüz metinleri, diyaloglar ve yorumlar **Türkçe** olacak. Kod tanımlayıcıları (değişken, fonksiyon adları) İngilizce veya ASCII Türkçe olabilir (ç, ğ, ı, ö, ş, ü kullanma).
- Oyun **tamamen çevrim dışı** çalışabilmeli (PWA + service worker). Harici CDN'e bağımlılık olmamalı; tüm varlıklar repo içinde olmalı.
- İçerik (bölüm, diyalog, soru, kavram yanılgısı) **koddan ayrı**, `src/data/*.json` dosyalarında tutulacak. Öğretmen kod bilmeden metinleri düzenleyebilmeli.
- Fizik **doğru** olmalı. Bilim kurgu yalnızca mekandır, fizik kuralları gerçek dünyadakiyle aynıdır.
- "Yanlış!" ekranı, can kaybı veya "oyun bitti" ekranı **yok**. Yanlış cevabın sonucu hikâye içinde gösterilir (bkz. §6).
- Hedef cihazlar: akıllı tahta (eski Chromium tabanlı tarayıcılar), okul bilgisayarı, tablet, telefon. Dokunma hedefleri en az 48 px.
- Kişisel veri toplanmaz. Öğrenci adı yerine sınıf kodu ve takma ad kullanılır.
- Her yeni özellikten sonra bir önceki bölümün oynanabilir kaldığını kontrol et.

---

## 1. Genel bakış

Kayıp Ölçü, tarayıcıda çalışan, ara sahneli, hikâye odaklı bir macera-bulmaca oyunudur. 9. sınıf fizik dersinin "Kuvvet ve Hareket" ünitesindeki 7 öğrenme çıktısını tek bir bilim kurgu hikâyesi içinde, 7 bölümde öğretir.

| Alan | Karar |
|---|---|
| Tür | Hikâye odaklı macera + fizik bulmacası, ara sahneli |
| Hedef kitle | 9. sınıf öğrencileri (14–15 yaş); fen lisesi için zor mod |
| Öğretim programı | Türkiye Yüzyılı Maarif Modeli Fizik, 9. sınıf 2. ünite, FİZ.9.2.1–FİZ.9.2.7 |
| Ünite süresi | 24 ders saati; oyun bunun yaklaşık 4 saatini kapsar |
| Oynanış süresi | 7 bölüm × 8–10 dk ≈ 70 dk (tek ders saatinde 2 bölüm) |
| Platform | Tarayıcı + çevrim dışı PWA |
| Oyuncu | Tek kişilik; isteğe bağlı ikili oyun (sürücü + navigatör) |
| Dil | Türkçe; seslendirmeli ara sahneler + her zaman açık altyazı |

**Tasarım sütunları**

1. **Önce deneyim, sonra tanım:** Oyuncu kavramı örneklerden kendisi çıkarır (programdaki "tümevarımsal akıl yürütebilme" fiili). Tanım asla önce verilmez.
2. **Hata hikâyede sonuç doğurur:** İstasyon sallanır, kapsül ıskalar, oyuncu tekrar dener.
3. **Her bölüm bir öğrenme çıktısı:** Bölüm sonu görevi, o çıktının kanıtıdır.
4. **Kısa ve sinematik:** Her bölüm bir ara sahneyle açılır ve kapanır; oynanış 8–10 dakikayı geçmez.

---

## 2. Öğretim programı: 9. Sınıf "Kuvvet ve Hareket" ünitesi

Kaynak: MEB Fizik Dersi Öğretim Programı (2026), tymm.meb.gov.tr. 24 ders saati, 7 öğrenme çıktısı.

**İçerik çerçevesi:** Temel ve Türetilmiş Nicelikler · Skaler ve Vektörel Nicelikler · Vektörler · Doğadaki Temel Kuvvetler · Hareket ve Hareket Türleri

| Kod | Öğrenme çıktısı (kısaltılmış olabilir; resmî metin tymm.meb.gov.tr'de) |
|---|---|
| FİZ.9.2.1 | SI birim sisteminde birimleri verilen temel ve türetilmiş nicelikleri sınıflandırabilme |
| FİZ.9.2.2 | Skaler ve vektörel nicelikleri karşılaştırabilme |
| FİZ.9.2.3 | Aynı doğrultudaki vektörlerin yönü ve büyüklüğü hakkında çıkarım yapabilme |
| FİZ.9.2.4 | Vektörlerin uç uca ekleme ve paralelkenar yöntemleriyle toplanması ve bileşenlerine ayrılması hakkında genelleme yapabilme |
| FİZ.9.2.5 | Doğadaki temel kuvvetleri karşılaştırabilme |
| FİZ.9.2.6 | Hareketin temel kavramlarının tanımlarına yönelik tümevarımsal akıl yürütebilme |
| FİZ.9.2.7 | Hareket türlerini (öteleme, dönme, titreşim) sınıflandırabilme |

**Fizik içeriği referansı (oyun içi doğrulama için)**

- **7 SI temel niceliği:** uzunluk (m), kütle (kg), zaman (s), elektrik akımı (A), sıcaklık (K), madde miktarı (mol), ışık şiddeti (cd).
- **Türetilmiş nicelik örnekleri:** hız/sürat (m/s), ivme (m/s²), kuvvet (N = kg·m/s²), basınç (Pa = N/m²), enerji/iş (J = N·m), güç (W = J/s), alan (m²), hacim (m³), özkütle (kg/m³).
- **Skaler:** kütle, zaman, sıcaklık, alınan yol, sürat, enerji, hacim, özkütle.
- **Vektörel:** yer değiştirme, hız, ivme, kuvvet, ağırlık, konum.
- **Dört temel kuvvet** (şiddet sırası, güçlüden zayıfa): güçlü nükleer > elektromanyetik > zayıf nükleer > kütle çekimi.
  - Menzil: kütle çekimi ve elektromanyetik sonsuz; güçlü ve zayıf nükleer çekirdek boyutunda (≈10⁻¹⁵ m ve daha kısa).
  - Örnekler: yörünge → kütle çekimi; kutup ışıkları, sürtünme, normal kuvvet → elektromanyetik (sürtünme temel kuvvet DEĞİLDİR); çekirdeği bir arada tutma → güçlü nükleer; beta bozunması → zayıf nükleer.
- **Hareket kavramları:** referans noktası, konum, yer değiştirme (son konum − ilk konum, vektörel), alınan yol (skaler), sürat = alınan yol / süre, hız = yer değiştirme / süre.
- **Hareket türleri:** öteleme, dönme, titreşim; bir cisim birden fazlasını aynı anda yapabilir (örn. yuvarlanan teker: öteleme + dönme).

---

## 3. Hikâye ve dünya

Yıl 2071. Türkiye'nin alçak yörüngedeki araştırma istasyonu **Göktürk-7** beklenmedik bir güneş fırtınasına yakalanır. Fırtına, istasyonun yapay zekâsı **ARGE**'nin bellek çekirdeğini siler: ARGE birimleri, yönleri, kuvvetleri ve hareketi "unutmuştur". Mürettebatın çoğu kurtarma kapsülüyle Dünya'ya iner. İstasyonda yalnızca ilk görevindeki stajyer mühendis (oyuncu) ile yaralı istasyon şefi Komutan Elif Aydın kalır.

- **Ana kurgu:** İstasyon 72 saat içinde yörünge düzeltmesi yapmazsa atmosfere girip yanacaktır. Oyuncu ARGE'ye fiziği adım adım yeniden öğreterek sistemleri geri açar. Her geri açılan sistem ARGE'nin kişiliğinden de bir parçayı geri getirir.
- **Gizem katmanı:** Fırtına uyarısı bir vektör hatası yüzünden yanlış yöne gönderilmiştir. Yere göre hesaplanan bir yön, istasyonun dönen referans çerçevesine çevrilmemiştir. Bu gizem 6. bölümde (referans noktası) çözülür.
- **Son:** 7. bölümde oyuncu iticileri doğru yöne ve doğru bileşke kuvvetle ateşler, istasyon güvenli yörüngeye oturur. ARGE tam belleğiyle uyanır ve oyuncuya ilk kez adıyla seslenir. TUA ve TÜBİTAK kurtarma ekibi istasyona yanaşır; oyuncuya bir kariyer önerisi sunulur (1. ünitedeki kariyer keşfine köprü).
- **Dünya kuralı:** Mikro yerçekimi ortamı, sürtünmesiz harekette vektörlerin etkisini net gösterir. Not: Yörüngede yerçekimi VARDIR; istasyon serbest düşmededir. "Uzayda yerçekimi yok" yanılgısı 5. bölümde düzeltilir.

---

## 4. Karakterler

| Karakter | Rol | Kişilik ve işlev |
|---|---|---|
| Oyuncu (stajyer mühendis) | Ana karakter | Adını ve görünümünü oyuncu seçer. Konuşmaz, seçimleriyle konuşur. |
| ARGE | İstasyonun yapay zekâsı | Başta çocuksu ve karışık konuşur ("Bir kilogram ne kadar uzun?"). Her bölümde bir sistemi geri gelir, dili netleşir. Öğrencinin öğrettiklerini kendi ağzından tekrar eder: öğreterek öğrenme. Görünüm: dalga formu / ışık halkası; bozukken titrek, düzeldikçe kararlı. |
| Komutan Elif Aydın | İstasyon şefi, yaralı | Sakin, deneyimli. Telsizden yönlendirir ama cevabı vermez, soru sorar. İpucu sisteminin sesi. |
| Kerem | Yaşıt stajyer, kurtarma kapsülünde | Aceleci ve kendinden emin. Kavram yanılgılarını o dile getirir ("Yol ile yer değiştirme aynı şey!"); oyuncu onu düzeltir. |
| Dr. Feza | Yer kontrol merkezindeki fizikçi | Ara sahnelerde görünür; bilimsel bağlam ve Türk bilim insanlarına kısa göndermeler (adı Feza Gürsey'e selamdır). |

Kerem'in yanlışları bilinçli bir tasarım aracıdır: Yanılgıyı bir karaktere söyletmek, öğrencinin kendi yanılgısını savunmaya geçmeden düzeltmesini kolaylaştırır.

---

## 5. Pedagojik tasarım

Her bölüm aynı üç adımı izler:

1. **Keşfet:** Örneklerle oyna, sonuçları gör.
2. **Genelle:** Kuralı Gözlem Defteri'ne kendi cümlenle yaz.
3. **Uygula:** Kuralı yeni bir durumda kullanarak bölümü bitir.

| Bölüm | Öğrenme çıktısı | Beceri | Kavram yanılgısı kodları |
|---|---|---|---|
| 1. Uyanış | FİZ.9.2.1 | Sınıflandırma | `M_KUVVET_TEMEL`, `M_BIRIM_NICELIK` |
| 2. Kör Pusula | FİZ.9.2.2 | Karşılaştırma | `M_SURAT_HIZ_AYNI`, `M_KUTLE_YONLU`, `M_SKALER_YONLU`, `M_YON_ONEMSIZ` |
| 3. Römorkör | FİZ.9.2.3 | Bilimsel çıkarım | `M_ZIT_HEP_SIFIR` |
| 4. Kenetlenme | FİZ.9.2.4 | Tümevarımsal akıl yürütme | `M_BILESKE_TOPLAM`, `M_BILESKE_FARK`, `M_BUYUK_KUVVET_YONU` |
| 5. Dört Kuvvet | FİZ.9.2.5 | Karşılaştırma | `M_UZAY_YERCEKIMI_YOK`, `M_SURTUNME_TEMEL` |
| 6. Kim Hareket Ediyor? | FİZ.9.2.6 | Tümevarımsal akıl yürütme | `M_YOL_YERDEG_AYNI`, `M_HAREKET_MUTLAK` |
| 7. Son Onarım | FİZ.9.2.7 | Sınıflandırma | `M_TEK_HAREKET_TURU` |

**Kavram yanılgısı sözlüğü** (`src/data/misconceptions.json`)

| Kod | Yanılgı | Doğrusu |
|---|---|---|
| `M_KUVVET_TEMEL` | Kuvvet temel bir niceliktir | Kuvvet türetilmiştir (kg·m/s²) |
| `M_BIRIM_NICELIK` | Birim ile nicelik aynı şeydir | Nicelik ölçülen özellik, birim ölçü standardıdır |
| `M_SURAT_HIZ_AYNI` | Sürat ile hız aynıdır | Sürat skaler, hız vektöreldir |
| `M_KUTLE_YONLU` | Kütlenin yönü vardır | Kütle skalerdir; ağırlık vektöreldir |
| `M_SKALER_YONLU` | Sıcaklık, enerji gibi skaler niceliklerin de yönü vardır | Skaler nicelikler yalnızca büyüklükle (sayı ve birim) tam anlatılır |
| `M_YON_ONEMSIZ` | Kuvvet, yer değiştirme gibi niceliklerde yön sonucu değiştirmez | Vektörel niceliklerde aynı büyüklük farklı yönde farklı sonuç verir |
| `M_ZIT_HEP_SIFIR` | Zıt yönlü kuvvetler her zaman birbirini yok eder | Yalnızca büyüklükler eşitse bileşke sıfırdır |
| `M_BILESKE_TOPLAM` | Bileşkenin büyüklüğü, büyüklüklerin toplamıdır | Yalnızca aynı yönlü vektörlerde böyledir |
| `M_BILESKE_FARK` | Bileşkenin büyüklüğü, büyüklüklerin farkıdır | Yalnızca zıt yönlü vektörlerde böyledir; aradaki açı bileşkeyi belirler |
| `M_BUYUK_KUVVET_YONU` | Cisim, büyük olan kuvvetin yönünde hareket eder | Cisim bileşke kuvvetin yönünde hareket eder |
| `M_UZAY_YERCEKIMI_YOK` | Uzayda yerçekimi yoktur | Yörüngede kütle çekimi vardır; istasyon serbest düşmededir |
| `M_SURTUNME_TEMEL` | Sürtünme temel bir kuvvettir | Sürtünme elektromanyetik kökenlidir |
| `M_YOL_YERDEG_AYNI` | Alınan yol ile yer değiştirme aynıdır | Yol skaler ve rotaya bağlı, yer değiştirme vektörel ve yalnızca ilk/son konuma bağlı |
| `M_HAREKET_MUTLAK` | Hareket mutlaktır | Hareket referans noktasına göre tanımlanır |
| `M_TEK_HAREKET_TURU` | Bir cisim aynı anda tek tür hareket yapar | Hareketler birleşik olabilir (öteleme + dönme) |

**Farklılaştırma**

- **Destek:** Komutan Elif'in 3 kademeli ipucu: (1) yönlendirici soru → (2) benzer bir örnek → (3) çözümün ilk adımı. İpucu kullanımı öğretmene raporlanır ama puan düşürmez.
- **Zenginleştirme (fen lisesi modu):** Bileşenlere ayırmada açı değerleri ve sin/cos açılır; süre baskılı bonus görevler eklenir.

**Programlar arası bileşenler:** sabır ve sorumluluk (istasyonu terk etmeme seçimi), dijital ve veri okuryazarlığı (Gözlem Defteri tabloları), kariyer farkındalığı (TUA, ASELSAN, TÜBİTAK göndermeleri).

---

## 6. Temel oynanış ve arayüz

**Bölüm döngüsü (8–10 dk)**

1. Açılış ara sahnesi (20–40 sn): arıza ve tehlike.
2. Keşif: 3–5 kısa etkileşimli örnek; oyuncu dener, sonucu görür.
3. Genelleme: Gözlem Defteri'ne kural yazma (cümle parçalarından kurma veya serbest metin).
4. Bölüm görevi: kuralı yeni bir durumda uygulayan ana bulmaca. Başarı, ilgili sistemi geri açar.
5. Kapanış ara sahnesi (15–30 sn): ARGE'nin bir yeteneği geri gelir, gizem ipucu verilir.

**Ekran düzeni**

- Üst çubuk: yörünge geri sayımı (yalnızca hikâye gerilimi için, gerçek süre baskısı yok), istasyon sağlığı, açılan sistemler.
- Orta alan: etkileşim sahnesi (sürükle-bırak, vektör çizme, döndürme).
- Sağ panel: ARGE konuşma balonu + Komutan Elif'in telsizi (ipucu düğmesi).
- Alt köşe: Gözlem Defteri simgesi.

**Gözlem Defteri:** Oyuncunun kaydettiği veriler, kurduğu tanımlar ve çizdiği vektörler burada birikir. Oyun boyunca açıktır ve sonraki bölümlerde kaynak olarak kullanılır. Oyun sonunda PDF olarak indirilebilir; öğretmen bunu performans görevi kanıtı olarak kullanır.

**Geri bildirim kuralları**

- Yanlış cevap → fiziksel sonuç animasyonu (örn. kapsül rotadan sapar) + ARGE'nin "neden?" diye soran bir cümlesi. Can kaybı veya oyun sonu yok.
- İki ardışık hata → Komutan Elif ilk ipucunu kendiliğinden önerir.
- Doğru cevap → sistem açılır, kısa bir görsel ödül; ARGE kuralı oyuncunun kendi cümlesiyle tekrar eder.

**Ödül yapısı:** Puan yerine 7 "sistem rozeti" ve isabet yıldızları (ilk denemede doğru = 3 yıldız). Liderlik tablosu yok; öne çıkan şey rekabet değil iş birliği.

---

## 7. Bölüm tasarımları

### Bölüm 1 — Uyanış (FİZ.9.2.1)
- **Sahne:** Karanlık kontrol odası. Ekranlarda "3,2 ??", "9,8 ??/??²" gibi birimsiz sayılar.
- **Keşif:** Sensör okumaları (sıcaklık, kütle, uzunluk, zaman, hız, kuvvet, basınç, enerji) incelenir. Bazı birimlerin başka birimlerden oluştuğu fark edilir (m/s = m ÷ s).
- **Görev:** "SI Tablosu" yeniden kurulur. 7 temel nicelik çekirdek yuvalara, türetilmiş nicelikler dış halkaya yerleştirilir. Türetilmiş bir niceliği yerleştirmek için onu oluşturan temel niceliklerin yuvaları önce dolu olmalıdır.
- **Başarı:** 12 nicelikten en az 11'i doğru yuvada.
- **Diyalog:** ARGE: "Newton… Bu bir bilim insanı mı, bir birim mi? İkisi de mi? Kafam karıştı."
- **Uygulanan akış (`bolum1.json`):**
  - *Keşif 1 · Sensör ekranları:* 8 ölçüme (293 K, 7200 kg, 12 m, 5520 s, 7660 m/s, 400 N, 101 300 Pa, 3 600 000 J) birim verilir; önce ekran sonra birim ya da tersi. Yanlış birimde ARGE ölçümü o birimle okur ("Kapsülün kütlesi 7200 metre mi? Bir kilogram ne kadar uzun?"). Ardından "N nedir: nicelik mi, birim mi?" kartı (`M_BIRIM_NICELIK`).
  - *Keşif 2 · Birim çözücü:* m/s, m², N, kg, J ve K için parçalar seçilir. N ve J için arşiv satırı verilir. N'ye "Parçalanamaz" demek `M_KUVVET_TEMEL`. Sonuçlar "başka birimlerden oluşanlar / parçalanamayanlar" diye iki sütunda kendiliğinden ayrışır; "temel/türetilmiş" adları henüz verilmez.
  - *Genelleme:* Adlar bu adımda verilir, kuralı öğrenci kurar. "kuvvet gibi" çeldiricisi `M_KUVVET_TEMEL`.
  - *Görev · SI çekirdeği:* 7 iç yuva (temel), 5 dış yuva (türetilmiş), 12 kart (birimleri ve N, Pa, J'nin açılımları verilir). Sürükle-bırak ya da dokun-dokun. Bağımlılık kilidi: türetilmiş nicelik dış halkaya ancak gerekli temel nicelikler iç halkadayken takılır; temel nicelik çekilince ona bağlı türetilmişler düşer. 12 yuva dolunca BAŞLAT; yanlış yuvalar kıvılcım çıkarır. Yıldız kuralı Bölüm 4 ile aynı (görev hataları).
  - *1K:* Işıklar geri gelir, ekranlar birimleriyle okunur, ARGE'nin halkası bir anlığına tam daire olur (sonra haritada durum = açılan sistem sayısı).

### Bölüm 2 — Kör Pusula (FİZ.9.2.2)
- **Sahne:** Navigasyon köprüsü; istasyon yavaşça sürükleniyor.
- **Keşif:** Kerem telsizden "Kapsül saatte 500 km ile gidiyor, beni bulun!" der. Oyuncu bu bilgiyle kapsülü bulamaz; yön eklenince bulur.
- **Görev:** Tarayıcıyla 10 nicelik "yön gerekir / gerekmez" diye etiketlenir. Her yanlış etiket rota çiziminde sapma olarak geri döner.
- **Başarı:** Etiketlemeyi tamamlamak + bir sürat–hız çiftini kendi cümlesiyle karşılaştırmak.
- **Diyalog:** Kerem: "Sürat, hız, ne fark eder?" — Elif: "Sana 'beni 5 km ötede bul' desem, nereye giderdin?"
- **Uygulanan akış (`bolum2.json`):**
  - *Keşif 1 · Kerem'i bul:* "500 km/h, 30 dk" bilgisiyle tahmin kartı (`M_SURAT_HIZ_AYNI`). ARGE uzaklığı (250 km) hesaplar; radarda olası konumlar bir çember olarak çizilir. 3 arama dronu çemberde rastgele noktaları dener (şans eseri bulma da mümkün ve dürüstçe söylenir). Ardından Kerem yön verir (kuzeydoğu); turuncu hız oku çizilir, dron tek noktaya gönderilir. "Hız" adı bu anda verilir.
  - *Keşif 2 · Yön ekle:* Kuvvet, kütle, yer değiştirme, sıcaklık için "kuzeye / güneye" karşılaştırması; tahmin (değişir/değişmez), sonra canlandırma. Kuvvet: durgun kapsül hızlanır; yer değiştirme: kapsül 3 km gider; kütle ve sıcaklık: iki kapsül aynı ("="). Yanlış tahminler: `M_YON_ONEMSIZ`, `M_KUTLE_YONLU`, `M_SKALER_YONLU`.
  - *Genelleme:* "Skaler" ve "vektörel" adları burada verilir; "kütle gibi" çeldiricisi `M_KUTLE_YONLU`.
  - *Görev · Rota tarayıcısı:* 10 nicelik (5 skaler, 5 vektörel) dokunarak YÖNLÜ/YÖNSÜZ etiketlenir (renk + desen: turuncu ok / gri nokta). ROTAYI ÇİZ: her nicelik rotanın bir parçası; yanlış etiketli parça 28° sapar ve kırmızı noktayla adı yazılır. Hatasız rota Kerem'e ulaşınca Kerem "Sürat, hız, ne fark eder?" diye sorar; öğrenci kendi cümlesiyle cevaplar (anahtar sözcük: yön + sürat/hız; deftere öğretmen onayı bekler).
  - *2A/2K:* Navigasyon köprüsü; istasyon sürüklenirken ön camdan Dünya yatar (kamera `roll`, yalnızca `yuvarlan: true` katmanlar), pusula hologramı rastgele döner. 2K'da pusula durulur, radar Kerem'i gösterir, Kerem'in görüntüsü netleşir.

### Bölüm 3 — Römorkör (FİZ.9.2.3)
- **Sahne:** Kopmuş bir güneş paneli modülü ve iki tamir dron'u.
- **Keşif:** Dronlar aynı ve zıt yönde, farklı güçlerde konumlanır; modülün hareketi gözlenir. Kuvvetler ok olarak görünür.
- **Görev:** Modülü yuvasına verilen hızda taşımak için kuvvetleri ayarlamadan önce bileşke tahmin edilir, sonra test edilir. Son aşamada üçüncü dron eklenir.
- **Başarı:** 3 senaryonun üçünde de tahmin ile sonuç uyumlu.

### Bölüm 4 — Kenetlenme (FİZ.9.2.4) ★ ilk prototip bölümü
- **Sahne:** Yaralı Komutan Elif'e ilaç ve tıbbi ekipman getiren insansız tıbbi kapsül istasyona yanaşmalı. (Elif sonraki bölümlerde ve finalde istasyonda olduğu için kapsül onu taşımaz, ona malzeme getirir.)
- **Fizik notu:** Kapsülü çapraz iten kuvvet, delinmiş yakıt hattından sızan gazın tepkisidir. Gaz geriye-yukarı püskürür, kapsül ileri-aşağı itilir. Güneş rüzgârının bir kapsüle uyguladığı kuvvet nanonewton mertebesindedir; bu yüzden kuvvet kaynağı olarak kullanılmaz.
- **Keşif 1 (uç uca ekleme):** 3 örnek: dik (3 m + 4 m → 5 m), aynı yönlü (2 m + 3 m → 5 m), neredeyse zıt (4 m + 5 m → 3 m). Önce tahmin kartı (yanlış seçenekler `M_BILESKE_TOPLAM` / `M_BILESKE_FARK`), sonra B okunun kuyruğu A'nın ucuna sürüklenir. Kapsül rotayı izler, mavi bileşke çizilir. "Bileşke" adı ilk kez bu anda verilir. Sonuçlar veri tablosuna yazılır.
- **Keşif 2 (paralelkenar):** Doğrultuları sabit, güçleri ayarlanabilir iki itici. Önce yön tahmini (`M_BUYUK_KUVVET_YONU`), sonra kapsülü hedef halkasına gönderme. Paralelkenar ve bileşke canlı çizilir; durgun kapsül bileşke yönünde hızlanır.
- **Genelleme:** Cümle parçalarından kural kurma (çeldiriciler: "her zaman", "eşittir,") ya da serbest metin (anahtar sözcük + öğretmen onayı). ARGE kuralı oyuncunun cümlesiyle tekrar eder; 4K'da da söyler.
- **Görev:** (a) Sızıntı kuvvetini (4 N, −3 N) bileşenlerine ayır. Yanlışsa bileşenler uç uca eklenip ulaşılan nokta gösterilir. (b) Yatay ve dikey iticiyi ayarla, KENETLEN. Net kuvvet sabit ivme verir; sonuçlar: portun üstünden/altından geçme, hızlı çarpıp sekme, yavaşlayıp ulaşamama, kenetlenme.
- **Başarı:** Kenetlenme (eksenden sapma ±5 px, hız farkı ±12 px/s) + deftere genelleme: "Bileşke, büyüklüklerin toplamı değildir, çünkü…"
- **Yıldız:** Görevde (bileşen + kenetlenme) hiç hata yoksa 3, en fazla 2 hata 2, daha fazlası 1. Keşif tahminleri yıldızı etkilemez; keşifte yanılmak beklenen bir şeydir.
- **Zor mod:** Izgara soluklaşır; sızıntı "5 N, 37°" ve sin/cos değerleriyle verilir.

### Bölüm 5 — Dört Kuvvet (FİZ.9.2.5)
- **Sahne:** Reaktör bölmesi; dört arıza aynı anda alarm veriyor.
- **Keşif:** Dört olay yaşanır: yörüngenin alçalması, pencereden görünen kutup ışıkları, reaktör yakıtında çekirdeği bir arada tutan kuvvetin zayıflama uyarısı, radyoaktif bozunma sensörü. Her olay için kuvvet kartı seçilir.
- **Görev:** Dört kuvvet menzil ve şiddet eksenli bir panoya yerleştirilir; ardından iki kuvveti karşılaştıran bir cümle kurulur.
- **Başarı:** Eşleştirme + panoda doğru sıralama.
- **Ara bilgi:** Dr. Feza, Feza Gürsey'in temel kuvvetleri birleştirme çalışmalarına kısa bir gönderme yapar.

### Bölüm 6 — Kim Hareket Ediyor? (FİZ.9.2.6)
- **Sahne:** İstasyonun dönen halkası ve sabit merkez modülü; Kerem ile ARGE tartışıyor.
- **Keşif:** Bir kargo robotunun yolculuğu üç farklı gözlemciden (merkez modül, dönen halka, Dünya) izlenir. Konum, alınan yol, yer değiştirme ve süre verileri tabloya kaydedilir.
- **Görev:** Verilerden konum, yer değiştirme, alınan yol, sürat, hız ve referans noktası tanımları oyuncu tarafından kurulur. Ardından gizem çözülür: Fırtına uyarısı yanlış referans çerçevesiyle hesaplanmıştır.
- **Başarı:** 6 tanımdan en az 5'i kabul edilir (anahtar sözcük eşleştirmesi + öğretmen onayı).
- **Diyalog:** Kerem: "Robot 40 metre yol aldı, demek ki 40 metre uzakta." Oysa robot başladığı yere dönmüştür.

### Bölüm 7 — Son Onarım (FİZ.9.2.7)
- **Sahne:** Yörünge düzeltmesine 10 dakika kala, istasyonun dış gövdesi.
- **Keşif:** Hareketli parçalar: dönen halka, titreşen anten, raylarda kayan kargo, dönerek ilerleyen tamir robotu (birleşik hareket).
- **Görev:** Her parçanın hareket türü belirlenir ve doğru onarım modülü takılır. Final: İticiler doğru yön ve bileşkeyle ateşlenerek istasyon kurtarılır. Bu, önceki bölümlerin hepsini kullanan bir sınavdır.
- **Başarı:** Sınıflama + final manevrası.

---

## 8. Sinematik ara sahneler

Toplam 15 ara sahne, yaklaşık 8,5 dakika.

**Üretim yöntemi (karar, 2 Kasım 2026): kodla üretilen hareketli paneller.**

- Her ara sahne 3–6 panelden oluşur. Panel bir resim dosyası değil, `src/data/cutscenes.json` içinde tanımlanan bir **sahne kompozisyonudur**: arka plan katmanları + karakter + efektler + kamera hareketi + altyazı (şema: §11).
- Hiçbir görsel dosya (webp/png/mp4) kullanılmaz; tüm görüntü çalışma anında kodla çizilir (bkz. §10). Dosya boyutu küçük kalır, sahneler ve metinler JSON'dan düzenlenebilir.
- **Sinematik çerçeve:** Ara sahne başlarken üstten ve alttan 2.39:1 sinema şeritleri kayarak girer, oyuna dönerken açılır. Altyazı şeridin içinde, her zaman açık.
- Yapay zekâ videosu kapsam dışıdır. İleride istenirse `"tip": "video"` paneli olarak eklenebilir.
- Tüm ara sahneler atlanabilir ve Gözlem Defteri'nden tekrar izlenebilir.

**Sinematik dil (efekt kütüphanesi, `src/fx/`)**

| Grup | Efektler |
|---|---|
| Kamera | `zoomIn`, `zoomOut`, `pan` (4 yön), `dolly` (parallax katmanları farklı hızda kayar → derinlik), `shake` (hafif/sert), `focusPull` (ön/arka plan bulanıklığı yer değiştirir), `roll` (sürüklenen istasyonda hafif yatma) |
| Geçiş | `fadeBlack`, `flashWhite`, `glitch` (ARGE bozukluğu: kromatik sapma + yatay kayma), `crossDissolve`, `iris`, `wipe`, `powerOn` (eski ekran gibi tek çizgiden açılma) |
| Atmosfer | yıldız alanı, güneş rüzgârı parçacıkları, kıvılcım, süzülen toz/nesneler, duman, kutup ışığı, alarm döner ışığı, ışık titremesi, lens parlaması, ışık huzmesi (god rays) |
| Ekran dokusu | film greni, tarama çizgisi (hologram), sinyal gürültüsü (video bağlantısı), vinyet, bloom |

**Hikâye tahtası**

| ID | Süre | İçerik | Görsel anlatım |
|---|---|---|---|
| `G` | 60 sn | Güneş fırtınası, tahliye, ARGE'nin çöküşü, 72 saatlik geri sayım | Panel panel aşağıda |
| `1A` | 30 sn | Birimsiz ekranlar | Karanlık oda, el feneri huzmesi tozu kesiyor; ekranlarda "3,2 ??" yanıp sönüyor; ARGE kopuk yay parçaları halinde |
| `1K` | 20 sn | Işıklar yanar, ARGE ilk cümlesini kurar | Bölmelerin ışıkları domino gibi sırayla yanar; ARGE halkası ilk kez tam daire olur |
| `2A` | 30 sn | İstasyon sürüklenir | Pencerede Dünya ufku yavaşça yatar (`roll`); pusula hologramı rastgele döner; Kerem'in kapsülü radar gürültüsünde kaybolur |
| `2K` | 20 sn | Navigasyon açılır, Kerem'in kapsülü bulunur | Navigasyon hologramı açılır, rota çizgisi kapsüle uzanır; Kerem'in görüntüsü gürültüden netleşir |
| `3A` | 25 sn | Panel kopar | Metal gerilmesi, panel kopar ve sabit hızla dönerek uzaklaşır; enerji göstergesi düşer, ışıklar kararır |
| `3K` | 20 sn | Panel yerine oturur | Kilitlenme kıvılcımı; panel hücreleri güneşi yakalar (parıltı dalgası), enerji çubuğu dolar |
| `4A` | 40 sn | Elif yaralanır | Mikro meteor çarpması (`shake`), hologramı gürültülü; tıbbi kapsül yakıt sızıntısıyla yalpalıyor (sızıntı gazı görünür) |
| `4K` | 30 sn | Tıbbi kapsül kenetlenir | Kenetlenme kilitleri sırayla yanar, basınç dengeleme buharı; Elif'in hologramı netleşir ve gülümser |
| `5A` | 30 sn | Reaktör alarmı | Reaktör bölmesi mor-kırmızı, dört uyarı paneli aynı anda; pencerede kutup ışıkları, yörünge göstergesi düşüyor |
| `5K` | 25 sn | Dr. Feza'nın konuşması | Yer kontrol video bağlantısı; dört kuvvet hologramda dört halka olarak döner, menzillerine göre büyüyüp küçülür |
| `6A` | 30 sn | Kerem–ARGE tartışması | Bölünmüş ekran; aynı koridor önce halkayla dönen kameradan, sonra merkezden izlenir (iki gözlemci) |
| `6K` | 40 sn | Gizemin çözülmesi | Fırtına uyarısının kaydı oynatılır: ok yer çerçevesinde doğru, dönen çerçevede yanlış yöne döner |
| `7A` | 30 sn | Atmosfere girişe dakikalar kala | Dış gövde; alt kenarda üst atmosferin kızıl parıltısı, geri sayım 00:10:00 |
| `F` | 75 sn | İstasyon kurtulur | Panel panel aşağıda |

**`G` — Giriş (60 sn)**

1. Uzay, sessizlik. Kamera yavaşça kayar: Dünya'nın gece-gündüz sınırı, Anadolu'nun şehir ışıkları. Altyazı: "2071. Alçak Dünya yörüngesi. Göktürk-7 araştırma istasyonu." (8 sn)
2. Göktürk-7 silüeti, dönen halka. Güneş'te bir parlama. ARGE (net, sakin sesle): "Güneş etkinliği normal. Mürettebat uyku döngüsünde." (8 sn)
3. Fırtına: parçacık dalgası istasyonu yalar, `flashWhite`; Dünya'nın kutbunda kutup ışıkları dalgalanır. (8 sn)
4. Kontrol odası: ışıklar söner, kırmızı acil durum ışığı, süzülen nesneler, kıvılcım. ARGE `glitch`: "Bir… bir-birim… tanımsız… yön… tanımsız…" (12 sn)
5. Pencereden kurtarma kapsülleri: itici ışıkları Dünya'ya doğru küçülür. Kerem (telsiz): "Stajyer! Kapsülde yer kalmadı, sen ve Komutan…" Sinyal kesilir. (10 sn)
6. Karanlık. Tek ekran `powerOn`: Elif'in hologramı, kolu askıda. "Beni duyuyor musun? 72 saatimiz var. ARGE'ye ihtiyacımız var… ARGE'nin de sana." Geri sayım 72:00:00 belirir. (14 sn)

**`F` — Final (75 sn)**

1. Dış gövde. İticiler ateşlenir. Oyuncunun final görevinde kurduğu bileşke vektör sahnede gerçek açısıyla çizilir (kişiselleştirme). Hafif `shake`. (10 sn)
2. Yörünge diyagramı: alçalan kırmızı eğri güvenli yörüngeye oturur, geri sayım durur. (10 sn)
3. İstasyonun bütün ışıkları yanar (güç 7/7), halka dönmeye başlar; Dünya ufkunda gün doğumu, ışık huzmeleri. (15 sn)
4. ARGE tam parlaklıkta, kararlı. İlk kez oyuncunun takma adını söyler: "Teşekkür ederim, [ad]. Artık bir kilogramın uzunluğu olmadığını biliyorum." (15 sn)
5. Kurtarma aracı yanaşır, kenetlenme ışıkları. Elif'in hologramı selam verir. (12 sn)
6. Pencereden Anadolu. "Göktürk-7 güvende." 7 sistem rozeti sırayla parlar, kariyer kartı açılır. (13 sn)

---

## 9. Ölçme ve değerlendirme

**Oyunun kaydettiği veriler (her öğrenme çıktısı için)**

| Veri | Ne gösterir |
|---|---|
| İlk denemede doğruluk | Hazır bulunuşluk düzeyi |
| Deneme sayısı ve hata türü | Hangi kavram yanılgısının sürdüğü (her yanlış seçenek bir yanılgı koduna eşlenir) |
| İpucu kademesi | Gereken destek miktarı |
| Bölümde geçen süre | Zorlanma göstergesi |
| Gözlem Defteri tanımları | Genelleme becerisinin nitel kanıtı |

**Öğretmen panosu:** Sınıf × öğrenme çıktısı ısı haritası; en yaygın 3 kavram yanılgısı; öğrenci bazında defter görüntüleme ve tanım onaylama; CSV dışa aktarım.

**Performans görevi:** Gözlem Defteri PDF'i + "ARGE'ye mektup": Öğrenci ünitede öğrendiklerini yeni bir yapay zekâya anlatan kısa bir metin yazar. Dereceli puanlama anahtarı, öğrenme çıktılarına göre 7 ölçütlüdür.

**Araştırma için ek ölçme araçları:** başarı testi (20–25 soru: ön test, son test, 4 hafta sonra kalıcılık testi); iki aşamalı kavram yanılgısı testi (cevap + gerekçe); tutum ve motivasyon ölçekleri (geçerlik-güvenirliği yapılmış Türkçe ölçekler); odak grup görüşmesi.

---

## 10. Görsel ve ses tasarımı

### 10.1 Görsel yaklaşım: "ışıkla anlatım"

**Karar (2 Kasım 2026):** Bütün görseller (arka planlar, karakterler, ara sahneler, arayüz) **kodla** üretilir: SVG, Phaser Graphics, parçacık sistemi ve WebGL efektleri. Stil **yarı gerçekçi bilim kurgudur**. Gerçekçilik çizgi ayrıntısıyla değil, **ışık, derinlik ve atmosferle** sağlanır. Okunabilirlik her zaman estetikten önce gelir.

Kurallar:

1. **Derinlik:** Her sahnede en az 4 parallax katmanı bulunur: uzay → Dünya/uzak yapı → orta plan → ön plan silüeti.
2. **Tek ana ışık:** Her sahnenin bir ana ışık kaynağı vardır (Güneş, alarm, ekran, reaktör, ARGE). Nesnelere bu kaynağın yönünden kenar ışığı (rim light) düşer, gölgeler buna uyar.
3. **Durgun kare yok:** Her sahnede en az bir yavaş hareket bulunur: süzülen toz, dönen halka, titreşen ekran, yavaş kayan Dünya.
4. **Silüet ve ekran:** Karakterler ya kenar ışıklı silüet ya da ekran/hologram görüntüsü olarak çizilir. Bu kodla üretime uygundur ve hikâyede de gerekçesi vardır: istasyonda yalnızca oyuncu ve başka bölmedeki yaralı Elif kalmıştır, diğerleri uzaktadır.
5. **3 tonlu gölgeleme:** Portre ve nesneler ışık, orta ton ve gölge olmak üzere üç tonla, gradyan geçişlerle çizilir.

### 10.2 Karakterlerin görünümü

| Karakter | Görünüm | Ayrıntı |
|---|---|---|
| Oyuncu | Kasklı uzay giysisi; yüz vizörün arkasında görünmez | Oyuncu kendini karaktere koyabilsin diye yüz yok. Menüde giysi rengi (4 seçenek), kask şeridi ve takma adın yazdığı isim yaması seçilir. Ara sahnelerde çoğunlukla eller, vizör yansıması ve arkadan silüet görünür. |
| ARGE | Işık halkası + dalga formu | Konuşurken dalga genliği sese göre değişir. Görünümü açılan sistem sayısına bağlıdır (aşağıdaki tablo). |
| Komutan Elif | Hologram büst | Camgöbeği-beyaz renk, tarama çizgileri, hafif titreme; kolu askıda. Görüntüsü 4K'dan sonra kararlı hale gelir. İfadeler: nötr, endişeli, düşünceli, gülümseme. |
| Kerem | Kapsül kamerasından video karesi | Sinyal gürültüsü ve kesintiler var; kask lambası yüzünü alttan aydınlatır. Kadraja fazla yaklaşan, hareketli bir görüntü (aceleci kişiliğine uygun). İfadeler: kendinden emin, şaşkın, mahcup, sevinçli. |
| Dr. Feza | Yer kontrolden video bağlantısı | Sıcak iç ışık, arkada ekranlar ve "YER KONTROL – ANKARA" yazısı. Gerçek kurum logosu kullanılmaz. |

**ARGE'nin görsel evrimi**

| Açılan sistem | Görünüm |
|---|---|
| 0 | Kırık yatay çizgi, ara sıra kıvılcım; ses bozuk |
| 1–2 | Kopuk yay parçaları, sert `glitch`, soluk renk |
| 3–4 | Tam halka ama titrek, kromatik sapma; dalga formu düzensiz |
| 5–6 | Kararlı halka, düzenli dalga formu; içinde basit bir desen belirir |
| 7 | Nefes alır gibi parlayan kararlı halka; iç desen ARGE'nin "yüzü" olur |

### 10.3 İstasyonun aydınlanması (`guc` parametresi)

Açılan sistem sayısı (0–7) global bir `guc` değeridir. Ortam ışığının yoğunluğunu, renk sıcaklığını (soğuk lacivert → sıcak beyaz), açık ekran sayısını, Hub haritasında yanan modülleri ve müzik katmanlarını bu değer belirler.

- **0:** Yalnızca kırmızı acil durum ışığı ve el feneri.
- **3–4:** Koridor ışıkları yarım güçte, ekranların bir kısmı açık.
- **7:** Tam aydınlık, bütün ekranlar açık, halka dönüyor.

### 10.4 Mekanlar ve bölümlerin görsel kimliği

| Bölüm | Mekan | Ana ışık | Baskın renk | İmza efekti |
|---|---|---|---|---|
| Hub | İstasyonun yan kesit haritası | Modül ışıkları | Gece laciverti | Açılan modüller yanar, aralarında enerji akışı |
| 1 | Kontrol odası | El feneri + acil durum kırmızısı | Koyu lacivert / kırmızı | Süzülen toz, birimsiz yanıp sönen ekranlar |
| 2 | Navigasyon köprüsü | Dünya'dan yansıyan ışık | Soluk petrol mavisi | Yavaş yatan manzara, radar taraması |
| 3 | Dış gövde, panel kolu | Doğrudan Güneş, sert gölgeler | Siyah + gümüş | Dronların kısa itici püskürmeleri |
| 4 | Kenetlenme portu | Kenetlenme projektörleri | Çelik grisi + beyaz kılavuz ışıkları | Kapsülün sızıntı gazı: görevdeki çapraz kuvvetin kaynağı gözle görülür |
| 5 | Reaktör bölmesi | Reaktör çekirdeğinin mor-beyaz ışığı | Mor / eflatun | Pencerede kutup ışıkları, uyarı panelleri |
| 6 | Dönen halka + merkez modül | Halka boyunca sıralı lambalar | Sıcak beyaz | Halkanın dönüşü, üç gözlemci kadrajı |
| 7 | Dış gövde (final) | Üst atmosferin kızıl parıltısı → gün doğumu | Kızıl → altın | Atmosfer parıltısı, finalde güneş doğuşu |

### 10.5 Renk sistemi

**Pedagojik renkler (oyun boyunca sabit, `src/config/colors.js`):**

- skaler nicelik: beyaz-gri `#E6E8EB`
- vektör: turuncu ok `#F28C28`
- bileşke: kalın mavi ok `#2F7DE1`
- bileşen: kesikli yeşil `#3BB273`
- Renk körlüğü için bu renkler ayrıca desenle (kesikli/kalın) ve etiketle ayırt edilir.

**Ayrılmış renk kuralı:** Oynanış sahnelerinde turuncu, doygun mavi ve yeşil **yalnızca vektörler** için kullanılır. Arka planlar düşük doygunlukta tutulur. Bir arka plan efekti bu renklere yaklaşıyorsa (ör. 7. bölümdeki atmosfer parıltısı) oynanış sırasında doygunluğu düşürülür ya da vektör katmanının altına yarı saydam koyu bir zemin konur. Ara sahnelerde vektör çizilmediği için bu kısıt yoktur.

**Ortam paleti:**

| Ad | Renk | Kullanım |
|---|---|---|
| Uzay siyahı | `#05070D` | Arka plan |
| Gece laciverti | `#0B1426` | İç mekan gölgeleri |
| Çelik | `#3A4656` | Gövde, duvar |
| Panel grisi | `#8A96A6` | Ayrıntı, kenar ışığı |
| ARGE camgöbeği | `#5FE3E8` | ARGE, hologramlar |
| Hologram beyazı | `#D8F6FF` | Elif hologramı, arayüz metni |
| Acil kırmızı | `#D64545` | Alarm, acil durum ışığı |
| Reaktör moru | `#8E6CF0` | 5. bölüm |
| Güneş beyazı | `#FFF6E0` | Doğrudan güneş ışığı |

### 10.6 Performans ve erişilebilirlik

- WebGL'de Phaser 3 postFX (bloom, glow, vinyet, bulanıklık, renk matrisi) ve özel shader'lar (tarama çizgisi, kromatik sapma, film greni) kullanılır. Canvas modunda bu efektler kapanır, sahne yine okunur kalır.
- **Kalite kademeleri:** İlk açılışta 3 saniyelik FPS ölçümüyle kademe otomatik seçilir, ayarlardan değiştirilebilir.

| | Yüksek | Orta | Düşük |
|---|---|---|---|
| Parçacık üst sınırı | 400 | 150 | 40 |
| Parallax katmanı | 5 | 4 | 2 |
| Yıldız sayısı | 600 | 300 | 120 |
| postFX / shader | Açık | Yalnızca bloom + vinyet | Kapalı |

- Durağan katmanlar (yıldız alanı, Dünya, iç mekan duvarları) sahne açılırken bir kez çizilip dokuya (RenderTexture) dönüştürülür, her karede yeniden çizilmez.
- **Hareketi azalt** ayarı kamera sarsıntısını, flaşı ve `glitch` efektini kapatır.
- Işığa duyarlı epilepsi riskine karşı flaş saniyede en fazla 3 kez olur ve ekranın tamamını kaplayan yüksek kontrastlı yanıp sönme kullanılmaz.

### 10.7 Görsellerde fizik doğruluğu

Bilim kurgu yalnızca mekandır; görseller de gerçek fiziğe uyar (§0):

- Uzayda yıldızlar göz kırpmaz. Titreme atmosferden kaynaklanır, bu yüzden yıldızlar sabit parlaklıkta çizilir.
- Uzayda ses yayılmaz. Dış sahnelerde patlama ya da itici sesi yoktur; sesler gövdeden gelen titreşim, telsiz ve müzikle verilir.
- Alçak yörüngeden (~400 km) Dünya küçük bir top gibi değil, kadrajın büyük kısmını kaplayan kavisli bir ufuk olarak görünür.
- Mikro yerçekiminde süzülen nesneler, çarpmadıkça istasyona göre düz çizgide ve sabit hızla hareket eder. Kopan panel sabit hızla ilerler ve sabit hızla döner.
- İtici püskürmesi alev değil, kısa ve soluk bir gaz bulutudur. Araç, püskürmenin tersi yönde hızlanır.
- İç mekanda duman yukarı yükselmez, her yöne yayılır (mikro yerçekiminde "yukarı" yoktur).
- Kutup ışıkları kutup bölgelerinde, atmosferin üst katmanında görünür.
- Güneş'in yönü bir sahne boyunca tutarlıdır; gölgeler ve kenar ışığı ona göre düşer.
- Güneş rüzgârı (yüklü parçacıklar) gözle görülmez. Ekranda gösterildiğinde "SENSÖR GÖRÜNTÜSÜ" etiketiyle, bir ölçüm görselleştirmesi olarak çizilir.
- Mikro yerçekiminde kıvılcımlar aşağı düşmez, düz çizgide ilerler.
- Bir parlamanın (flare) ardından kutup ışıklarına yol açan fırtına Dünya'ya ancak 1–3 gün sonra ulaşır. Bu yüzden Giriş sahnesinde "ERTESİ GÜN" kartı vardır.

### 10.8 Arayüz ve ses

- **Arayüz:** Yarı saydam hologram cam paneller, ince camgöbeği kenarlar. Dokunma hedefleri en az 48 px, yüksek kontrast, disleksiye uygun yazı tipi seçeneği.
- **Müzik:** Sakin ambient keşif müziği; geri sayım yaklaştıkça tempo artar; finalde tema müziği.
- **Ses efektleri:** Sert alarm yerine fiziksel sesler (kenetlenme kilidi, motor homurtusu, metal gerilmesi).
- **Seslendirme:** ARGE için hafif işlenmiş bir ses; diğer karakterleri öğrenciler ve öğretmenler seslendirir. Tüm diyaloglarda altyazı var.
- **Telif:** Müzik ve efektler telifsiz kütüphanelerden veya özgün üretim; görseller kodla üretildiği için görsel telif sorunu yoktur.

---

## 11. Teknik mimari

**Seçilen yığın: Phaser 3 + Vite + vanilla JavaScript (ES modules), PWA.**
(Alternatif: Flutter Web + Flame. Mevcut Flutter bilgisini kullanmak için tercih edilebilir; o durumda aynı JSON veri yapısı kullanılır.)

| Katman | Karar |
|---|---|
| Oyun motoru | Phaser 3 |
| Derleme | Vite |
| Görseller | Tamamen kodla üretilir: SVG + Phaser Graphics + parçacıklar + postFX/shader (bkz. §10) |
| Ara sahneler | Kodla çizilen panel kompozisyonları (`cutscenes.json`) |
| İçerik | `src/data/*.json` |
| Kayıt | IndexedDB (yedek olarak localStorage) |
| Öğretmen panosu | Varsayılan olarak CSV dışa/içe aktarım; sınıf koduyla isteğe bağlı senkronizasyon (Supabase/Firebase, sonraki sürüm) |
| Çevrim dışı | `vite-plugin-pwa` (Workbox) — tüm varlıklar önbelleğe alınır |
| Dağıtım | GitHub Pages veya Netlify |
| PDF | Gözlem Defteri için jsPDF (yerel paket) |

**Önerilen klasör yapısı**

```
kayip-olcu/
├─ CLAUDE.md                  ← bu dosya
├─ index.html
├─ vite.config.js
├─ public/
│  ├─ manifest.webmanifest
│  └─ assets/
│     ├─ audio/  (muzik, efekt, seslendirme)
│     └─ fonts/                ← (resim klasörü yok; görseller kodla çizilir)
├─ src/
│  ├─ main.js                 ← Phaser config, sahne kaydı
│  ├─ config/
│  │  ├─ colors.js
│  │  └─ settings.js          ← zor mod, ses, yazı tipi
│  ├─ scenes/
│  │  ├─ BootScene.js
│  │  ├─ MenuScene.js         ← takma ad + sınıf kodu
│  │  ├─ CutsceneScene.js     ← JSON'dan panel oynatıcı
│  │  ├─ HubScene.js          ← istasyon haritası, bölüm seçimi
│  │  ├─ levels/
│  │  │  ├─ BolumTemel.js     ← ortak iskelet: üst çubuk, panel, ipucu, adım, telemetri, bitiş
│  │  │  ├─ Level1Uyanis.js
│  │  │  ├─ Level2KorPusula.js
│  │  │  ├─ Level3Romorkor.js
│  │  │  ├─ Level4Kenetlenme.js
│  │  │  ├─ Level5DortKuvvet.js
│  │  │  ├─ Level6KimHareketEdiyor.js
│  │  │  └─ Level7SonOnarim.js
│  │  └─ TeacherScene.js      ← öğretmen panosu (PIN korumalı)
│  ├─ systems/
│  │  ├─ VectorMath.js        ← toplama, bileşen, büyüklük, açı (saf fonksiyonlar, test edilebilir)
│  │  ├─ VectorDraw.js        ← ok çizimi, sürükleyerek vektör oluşturma
│  │  ├─ DialogueSystem.js    ← ARGE/Elif/Kerem balonları
│  │  ├─ HintSystem.js        ← 3 kademeli ipucu
│  │  ├─ Notebook.js          ← Gözlem Defteri + PDF
│  │  ├─ Telemetry.js         ← olay kaydı (bkz. olay şeması)
│  │  └─ SaveSystem.js        ← IndexedDB
│  ├─ art/                    ← kodla çizim (prosedürel görseller)
│  │  ├─ Katmanlar.js         ← scenes.json'daki "tip" adlarını çizim fonksiyonlarına bağlayan kayıt
│  │  ├─ Tuval.js, Rastgele.js← çizim yardımcıları, tohumlu rastgele (her açılışta aynı görüntü)
│  │  ├─ Starfield.js         ← yıldız katmanları, Samanyolu, Güneş + objektif parlaması
│  │  ├─ Earth.js             ← Dünya ufku (gece), şehir ışıkları, atmosfer, şafak, kutup ışığı
│  │  ├─ Station.js           ← Göktürk-7 dış görünüş (kenar ışığı, dönen halka), kurtarma kapsülleri
│  │  ├─ Interiors.js         ← kontrol odası (karartma, acil ışık, süzülen nesneler), lomboz
│  │  ├─ Characters.js        ← Elif (hologram), Kerem (video bağlantısı); ifadeler
│  │  ├─ Arge.js              ← ışık halkası + dalga formu, 0–7 evrim durumu
│  │  └─ Hud.js               ← geri sayım, sensör görüntüsü
│  ├─ fx/
│  │  ├─ CameraFX.js          ← sarsıntı, flaş, bozulma (hareketi azalt ayarına uyar)
│  │  ├─ Transitions.js       ← ışık titremesi eğrisi, ekran açılma (powerOn)
│  │  ├─ Particles.js         ← kıvılcım (mikro yerçekimi), parçacık akısı
│  │  ├─ Shaders.js           ← SinemaFX: film greni, vinyet, bozulma (kromatik sapma)
│  │  └─ Quality.js           ← FPS ölçümü, kalite kademesi
│  ├─ ui/                     ← Dugme, Cip, Panel (cam zemin, açılır pencere), UstCubuk, DiyalogPaneli, Defter, Secenekler, CumleKurucu, tipografi
│  └─ data/
│     ├─ levels.json
│     ├─ dialogues.json
│     ├─ cutscenes.json       ← ara sahneler: paneller, altyazılar, olay zamanlaması
│     ├─ scenes.json          ← sahne kompozisyonları (katmanlar, derinlik, konum)
│     ├─ characters.json      ← konuşan adı ve altyazı rengi
│     ├─ bolum1.json          ← Bölüm 1 içeriği: sensörler, birim çözücü, kural parçaları, SI çekirdeği kartları
│     ├─ bolum2.json          ← Bölüm 2 içeriği: Kerem araması, yön deneyleri, kural parçaları, rota nicelikleri
│     ├─ bolum4.json          ← Bölüm 4 içeriği: örnekler, tahmin kartları, kural parçaları, ipuçları, ARGE replikleri
│     ├─ misconceptions.json
│     └─ quantities.json      ← SI nicelik listesi (ad, birim, temel/türetilmiş, skaler/vektörel)
└─ tests/
   └─ VectorMath.test.js      ← Vitest
```

**Bölüm veri şeması (örnek: `levels.json` içindeki bir öğe)**

```json
{
  "bolum": 4,
  "id": "kenetlenme",
  "ad": "Kenetlenme",
  "ciktilar": ["FİZ.9.2.4"],
  "acilisSahnesi": "4A",
  "kapanisSahnesi": "4K",
  "kesif": [
    { "tip": "ucUcaEkle", "vektorler": [[3, 0], [0, 4]] },
    { "tip": "paralelkenar", "vektorler": [[4, 1], [1, 3]] }
  ],
  "genelleme": {
    "tip": "cumleKur",
    "parcalar": ["Bileşke,", "büyüklüklerin toplamı", "değildir,", "çünkü", "vektörlerin yönü de", "hesaba katılır."],
    "anahtarlar": ["yön", "bileşke"]
  },
  "gorev": {
    "tip": "bilesenAyir",
    "ruzgar": { "buyukluk": 5, "aci": 37 },
    "tolerans_px": 5
  },
  "secenekler": [
    { "id": "A", "dogru": true },
    { "id": "B", "dogru": false, "yanilgi": "M_BILESKE_TOPLAM" }
  ],
  "zorMod": { "aciGoster": true, "trigonometri": true }
}
```

**Telemetri olay şeması (`Telemetry.js`)**

```json
{
  "ogrenci": "takmaad#sinifkodu",
  "zaman": "2026-11-02T10:15:00Z",
  "bolum": 4,
  "cikti": "FİZ.9.2.4",
  "olay": "cevap",            
  "dogru": false,
  "deneme": 2,
  "yanilgi": "M_BILESKE_TOPLAM",
  "ipucuKademesi": 1,
  "sureSn": 74
}
```
`olay` değerleri: `bolumBasla`, `cevap`, `ipucu`, `defterKayit`, `bolumBitir`, `sahneAtla`. Ek alan `ayrinti`: serbest açıklama (ör. `sahneAtla` için `G panel 3/6`). CSV dışa aktarım `;` ayırıcılı ve UTF-8 BOM'ludur (Türkçe Excel'de doğrudan açılır); menüdeki "Öğretmen: verileri indir" düğmesiyle o cihazdaki tüm olaylar indirilir.

**Ara sahne şeması (`cutscenes.json`)**

```json
{
  "id": "G",
  "paneller": [
    {
      "sahne": "istasyonDis",
      "gecis": "kesme",
      "sureMs": 8000,
      "kamera": { "hareket": "zoom", "yon": "sol", "mesafe": 160, "zoom": [1.06, 1.14] },
      "ekKatmanlar": [{ "id": "arge", "tip": "arge", "sabit": true, "ayar": { "x": -560, "y": -210, "yaricap": 30 } }],
      "katmanAyar": { "istasyon": { "olcek": 0.9 } },
      "basliklar": [{ "metin": "ERTESİ GÜN · 03.40", "ms": 300, "sureMs": 1800 }],
      "altyazilar": [{ "konusan": "ARGE", "metin": "Uyarı… parçacık akısı…", "ms": 3600, "sureMs": 3400, "bozuk": true }],
      "olaylar": [
        { "ms": 800, "hedef": "akis", "olay": "baslat" },
        { "ms": 2600, "fx": "sars", "sure": 900, "siddet": 0.006 },
        { "ms": 3000, "hedef": "istasyon", "olay": "isiklariSondur" }
      ]
    }
  ]
}
```

- `sahne`: `scenes.json` içindeki kompozisyon. Kompozisyon katmanları sıralar; her katmanın `tip`, `derinlik` (0 uzak – 1 yakın, parallax miktarı), `sabit` (kamera hareketinden etkilenmez), `min` (en düşük kalite kademesi) ve `ayar` (konum `x`/`y` ekran merkezine göre, `olcek`, `alfa` ve tipe özel değerler) alanları vardır. Aynı kompozisyon ilgili bölümün oynanış arka planı olarak da kullanılacak.
- `gecis` (panele giriş): `kesme`, `fadeBlack`, `crossDissolve`, `flashWhite`, `glitch`.
- `kamera`: `yon` (`sag`/`sol`/`yukari`/`asagi`) ve `mesafe` ile kayma, `zoom: [başlangıç, bitiş]`. Yakın katmanlar daha çok kayar ve büyür.
- `olaylar`: `fx` (`sars`, `flas`, `bozulma`) ya da `hedef` + `olay` (katman kimliği ve o katmanın olay adı). `ms` panel başından itibaren.
- `konusan` değerleri `characters.json` içindeki anahtarlardır. `bozuk: true` ARGE'nin bozuk konuşmasıdır.
- Ses alanı (`ses`) seslendirme eklendiğinde kullanılacak.

**Geliştirme kısayolları:** `npm run dev` → `http://localhost:5173`; `npm test` vektör matematiği testlerini çalıştırır. Bir bölümü doğrudan açmak için `?bolum=4` (adım: `&adim=kesif2|genelleme|gorev`; aktif oyuncu yoksa "Deneme#SUNUM" oluşturulur), bir ara sahneyi doğrudan açmak için `?sahne=G&panel=3`, kalite kademesini zorlamak için `?kalite=yuksek|orta|dusuk`, WebGL'siz (Canvas) çiziciyi denemek için `?cizici=canvas`, karışık sıraları (çipler, kartlar) sabitlemek için `?sabit=1` (otomatik test). Canvas çizicide `setTint` çalışmaz: renkli katmanlar dokuya işlenerek çizilir.

**Kayıt modeli (`SaveSystem.js`):** IndexedDB `kayipOlcu` veritabanı, `oyuncular` ve `olaylar` depoları; IndexedDB yoksa localStorage. Oyuncu kimliği `takmaad#SINIFKODU`; aynı takma ad + sınıf kodu girilince eski ilerleme yüklenir (paylaşılan okul bilgisayarları). Oyuncu kaydı: `girisIzlendi`, `sistemler` (tamamlanan bölüm numaraları; sayısı `guc` değeridir), `bolumler`, `defter`. Hub'da bir bölüm, kendinden önceki *hazır* (`hazir: true`) bölümlerin hepsi tamamlanınca açılır; henüz yapılmamış bölümler sırayı kilitlemez. Bölüm 1 de hazır olduğu için Bölüm 4, Bölüm 1 bitince açılır (doğrudan erişim: `?bolum=4`). `hazir: false` olan bölüm "hazırlanıyor" mesajı verir. Bölüm içeriği `src/data/bolumN.json` dosyasında, sahne sınıfı `levels.json`'daki `sahne` alanında.

**İçerik JSON biçimi:** `scenes.json` ve `cutscenes.json` bir betikle yeniden yazılırsa `node scripts/json-bicimle.mjs <dosya>` ile biçimlendir (kısa nesneler tek satır; metinlere dokunmaz).

**Bölüm yazma kuralları (BolumTemel):** Her adım `adimBaslat` ile başlar (eski nesneler ve konuşmalar temizlenir). Her cevap `cevap({ dogru, yanilgi, ayrinti })` ile telemetriye düşer; tahmin kartlarında her yanlış seçeneğin `yanilgi` kodu `misconceptions.json`'da olmalı. Sürekli (sürükle-bırak) görevlerde kodlanabilen hata `yanilgi` ile, diğerleri `ayrinti` ile kaydedilir. Metinlerde `{ad}` ve `{kuralN}` şablonları kullanılabilir.

**Gizlilik:** Öğrenci adı yerine sınıf kodu + takma ad kullanılır, kişisel veri toplanmaz. Araştırma için veli onay formu gerekir.

---

## 12. Geliştirme yol haritası (Claude Code görev listesi)

### Aşama 1 — İskelet (1. hafta)
- [x] Vite + Phaser 3 projesini kur; `npm run dev` ile boş sahne açılsın
- [x] PWA: manifest + service worker; uçak modunda açılabildiğini doğrula
- [x] `BootScene` → `MenuScene` (takma ad + sınıf kodu) → Giriş sahnesi (ilk girişte) → `HubScene` akışı
- [x] `SaveSystem` (IndexedDB) ve `Telemetry` (olayları kaydet, CSV dışa aktar)
- [x] `colors.js` ve temel UI bileşenleri (üst çubuk, sağ diyalog paneli, defter simgesi)
- [x] Görsel temel: `Starfield`, `Earth`, `Arge` (0–7 durumları), `Quality` (kalite kademesi + hareketi azalt)
- [x] `fx/`: kamera hareketleri, geçişler, temel parçacıklar
- [x] Canvas modunda (WebGL'siz) efektsiz çalıştığını doğrula (`?cizici=canvas`)
- [ ] Gerçek akıllı tahtada FPS ve ilk açılış süresini ölç
- [x] `CutsceneScene` + `scenes.json`: Giriş (`G`) sahnesini kodla çizilmiş panellerle oynat (görsel stilin ilk kanıtı)
- [ ] Giriş sahnesine ses ve seslendirme

### Aşama 2 — Dikey dilim: Bölüm 4 Kenetlenme (2–3. hafta)
- [x] `VectorMath.js` (toplama, çıkarma, büyüklük, açı, bileşenlere ayırma) + Vitest testleri (`npm test`)
- [x] `VectorDraw.js`: dokunma/fare ile sürükleyerek ok çizme, uç uca ekleme, paralelkenar gösterimi
- [x] Keşif 1: uç uca ekleme (parça uzunlukları toplamı ile bileşke karşılaştırması)
- [x] Keşif 2: iki itici → paralelkenar
- [x] Görev: sızıntı kuvvetini bileşenlere ayır, karşı iticileri ayarla, kenetlen (±5 px)
- [x] Yanlış cevabın hikâyedeki sonucu: kapsül sapma animasyonu + ARGE'nin "neden?" sorusu
- [x] `HintSystem` 3 kademe + `DialogueSystem`
- [x] Gözlem Defteri: cümle parçalarından genelleme kurma (+ serbest metin, öğretmen onayı bekler)
- [x] Kenetlenme portu kompozisyonu, Elif hologramı, 4A ve 4K ara sahneleri
- [ ] 5–10 öğrenciyle deneme; geri bildirimleri kaydet

### Aşama 3 — Kalan bölümler (4–9. hafta)
- [x] Bölüm 1 Uyanış (sürükle-bırak SI tablosu; bağımlılık kilidi) + 1A/1K ara sahneleri
- [x] Bölüm 2 Kör Pusula (etiketleme + rota sapması) + 2A/2K ara sahneleri
- [ ] Bölüm 3 Römorkör (aynı doğrultuda kuvvetler, tahmin → test)
- [ ] Bölüm 5 Dört Kuvvet (eşleştirme + menzil/şiddet panosu)
- [ ] Bölüm 6 Kim Hareket Ediyor? (üç gözlemci görünümü, veri tablosu, tanım kurma, gizemin çözülmesi)
- [ ] Bölüm 7 Son Onarım (hareket türü sınıflama + final manevrası)
- [ ] Giriş (G) ve Final (F) ara sahneleri
- [ ] Gözlem Defteri PDF dışa aktarım
- [ ] Zor mod (açı + sin/cos)

### Aşama 4 — Öğretmen panosu ve son rötuşlar (10–11. hafta)
- [ ] `TeacherScene` (PIN korumalı): ısı haritası, en yaygın 3 yanılgı, defter onaylama, CSV dışa aktarım
- [ ] Erişilebilirlik: disleksiye uygun yazı tipi, altyazı boyutu, renk körlüğü kontrolü
- [ ] Ses ve seslendirme entegrasyonu
- [ ] Akıllı tahtada performans testi (hedef: 60 fps, ilk açılış < 5 sn)

### Aşama 5 — Pilot ve uygulama
- [ ] Bir sınıfta pilot; hata ve zorluk ayarı
- [ ] Ön test → oyun (ünite boyunca) → son test → kalıcılık testi

**Kabul ölçütleri (her bölüm için)**
- Bölüm 8–10 dakikada bitirilebiliyor.
- Tanım, keşif adımından önce hiçbir yerde gösterilmiyor.
- Her yanlış seçeneğin bir yanılgı kodu var ve telemetriye düşüyor.
- İpucu sistemi 3 kademede çalışıyor.
- Çevrim dışı oynanabiliyor; ilerleme sayfa yenilense de kaybolmuyor.
- Dokunmatik ekranda ve fareyle eşit derecede oynanabiliyor.

---

## 13. TÜBİTAK proje bağlantısı

- **Araştırma sorusu:** Sinematik hikâye tabanlı bir dijital oyunla öğretilen "Kuvvet ve Hareket" ünitesi, 9. sınıf öğrencilerinin akademik başarısını, kalıcılığı ve kavram yanılgılarını nasıl etkiler?
- **Desen:** Ön test–son test kontrol gruplu yarı deneysel desen. Deney grubu oyunla, kontrol grubu aynı öğrenme çıktılarını klasik etkinliklerle işler. Nitel veri için odak grup görüşmesi yapılır.
- **Özgünlük:**
  1. Tasarım doğrudan Maarif Modeli öğrenme çıktılarına ve tümevarımcı süreç bileşenlerine eşlenmiş.
  2. Yanlış cevapları kavram yanılgısı kodlarına bağlayan bir veri modeli var.
  3. Kavram yanılgısını bir karaktere söyleten bir anlatı tekniği kullanılıyor.
- **Öğrenci rolü:** Senaryo yazımı, seslendirme, bölüm tasarımı, veri analizi; kodlama danışman desteğiyle.
- **Etik:** Okul ve il millî eğitim izni, veli onamı, anonim veri.

**Açık sorular**
- [ ] Proje hangi TÜBİTAK programına ve kategoriye başvuracak (örn. 2204-A)? Kategori güncel başvuru kılavuzundan doğrulanmalı.
- [ ] Projeyi yürütecek öğrencilerin sınıf düzeyi ve kodlama deneyimi?
- [ ] Uygulama hangi okulda ve kaç şubede yapılacak? Kontrol grubu eşleştirilebilir mi?
- [x] Ara sahneler: kodla çizilen hareketli paneller; görseller tamamen kodla, stil yarı gerçekçi bilim kurgu (karar: 2 Kasım 2026, bkz. §8 ve §10)
- [ ] Motor: Phaser 3 mü (bu dosyadaki varsayılan), Flutter Web + Flame mi?

---

## 14. Kaynaklar

- MEB Fizik Dersi Öğretim Programı (2026): https://mufredat.meb.gov.tr/Dosyalar/2026518151437471-fizikdöp.pdf
- TYMM Fizik dersi sayfası: https://tymm.meb.gov.tr/ogretim-programlari/ders/fizik-dersi
- 9. sınıf Fizik programı (ünite listesi): https://tymm.meb.gov.tr/ogretim-programlari/fizik-dersi/11
- Online tasarım dokümanı: https://claude.ai/artifact/SdMZCTbpeQCZX9oYXj2pdr
