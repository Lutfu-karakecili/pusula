# Pusula — YKS Koçluk Platformu

> **Pusula**, Yükseköğretim Kurumları Sınavı (YKS) hazırlık sürecindeki öğrencilere
> yönelik profesyonel bir çevrimiçi koçluk platformudur. Öğrenciler koçlarla
> eşleşir, paket satın alır ve bireysel gelişim takibi yapar; yöneticiler (admin)
> ise tüm öğrenci, koç ve mesaj trafiğini merkezi bir panelden yönetir.

## Maarif Modeli Uyumu

Pusula, Türk eğitim sistemine uygun **Maarif Modeli** prensiplerini temel alır:
şeffaflık, ölçülebilir bireysel ilerleme ve rehberlik (PDR) odaklı yaklaşım.
Arayüz Türkçe, erişilebilir ve mobil uyumludur (responsive).

---

## Teknoloji Yığını

| Katman      | Teknoloji                                              |
|-------------|--------------------------------------------------------|
| Build       | [Vite](https://vitejs.dev/) (MPA — çok sayfalı uygulama) |
| Dil         | Vanilla JS (ES Modules) + HTML/CSS                     |
| Kimlik      | [Supabase Auth](https://supabase.com/auth) (e-posta/şifre) |
| Veritabanı  | [Supabase Postgres](https://supabase.com/database) (RLS korumalı) |
| Hata Takibi | [Sentry](https://sentry.io/) (Browser JS)              |
| Bot Koruması| Cloudflare Turnstile (opsiyonel)                       |
| Dağıtım     | [Vercel](https://vercel.com/)                          |

---

## Kurulum (Yerel Geliştirme)

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Ortam değişkenlerini ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın ve gerçek değerlerinizi girin:

```bash
cp .env.example .env
# Ardından .env dosyasını düzenleyin (aşağıdaki "Ortam Değişkenleri" tablosuna bakın)
```

> ⚠️ **Güvenlik:** `.env` dosyası **ASLA** Git'e commit edilmemelidir
> (`.gitignore` içinde zaten tanımlıdır). `service_role` anahtarını asla
> frontend'e veya `.env` içine koymayın; bu anahtar RLS korumasını tamamen baypas eder.

### 3. Supabase veritabanını kurun

1. [supabase.com](https://supabase.com/) üzerinde yeni bir proje oluşturun.
2. Sol menüden **SQL Editor** → **New query** açın.
3. `supabase/schema.sql` dosyasının **tamamını** kopyalayıp yapıştırın ve **Run** edin.
   - Bu işlem `profiles`, `coaches`, `packages`, `student_coaches`,
     `student_packages` ve `messages` tablolarını, ilgili RLS politikalarını
     ve örnek koç/paket verilerini oluşturur.
4. (İsteğe bağlı) İlk admin hesabınızı oluşturun:
   - **Authentication → Users** kısmından bir kullanıcı ekleyin (e-posta/şifre).
   - O kullanıcının UUID'sini alıp `schema.sql` sonundaki yorum satırını
     düzenleyerek `profiles` tablosuna `role = 'admin'` olarak ekleyin.

> 💡 **Profil otomatik oluşur:** Supabase Auth ile yeni kayıt yapıldığında,
> bir `profiles` kaydı otomatik tetiklenir (şema yorumunda belirtilmiştir).
> Frontend `kayit.html` akışı bu yapıya uygundur.

### 4. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

Tarayıcı otomatik olarak `http://localhost:5173/index.html` adresini açar.

---

## Yapı (Build) ve Önizleme

```bash
npm run build     # Çıktı: dist/ klasörü
npm run preview   # dist/ üzerinde yerel önizleme sunucusu
```

`vite.config.js`, kök dizindeki ve `pages/` altındaki tüm `.html`
dosyalarını ayrı giriş noktaları olarak derler (MPA yapısı).

---

## Vercel Dağıtımı

1. Projeyi GitHub'a push edin.
2. [vercel.com](https://vercel.com/) → **New Project** → deposunu import edin.
3. Build ayarları otomatik algılanır:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables** kısmına `.env` içindeki tüm
   `VITE_*` değişkenlerini ekleyin (özellikle `VITE_SUPABASE_URL` ve
   `VITE_SUPABASE_ANON_KEY`).
5. **Deploy** edin.

`vercel.json` zaten aşağıdakileri içerir ve dokunmanıza gerek yoktur:
- Güvenlik başlıkları (HSTS, CSP, X-Frame-Options, XSS koruması vb.)
- `cleanUrls: true` (`.html` uzantısız URL'ler)
- `pages/` alt sayfaları için rewrite kuralı

> ⚠️ **CSP notu:** `vercel.json` içindeki `Content-Security-Policy`,
> `*.supabase.co`, `*.ingest.sentry.io` ve `challenges.cloudflare.com`
> (Turnstile) bağlantılarına izin verecek şekilde ayarlıdır. Yeni bir
> üçüncü-parti servis eklerse burayı güncelleyin.

### Cloudflare Turnstile (Bot Koruması)
- `.env`'de `VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA` placeholder ise widget
  **otomatik gizlenir** ve form doğrulaması atlanır.
- Gerçek bir Cloudflare site key girildiğinde `giris.html`, `kayit.html`
  ve `iletisim.html` sayfalarında otomatik aktif olur.

### Sentry (Hata Takibi)
- `VITE_SENTRY_DSN` boş bırakılırsa Sentry **pasif** kalır (kod içinde guard var).
- Dolu olduğunda tarayıcı hataları Sentry'ye raporlanır.

---

## Ortam Değişkenleri

| Değişken                  | Zorunlu | Açıklama                                                                 |
|---------------------------|---------|--------------------------------------------------------------------------|
| `VITE_SUPABASE_URL`       | ✅      | Supabase projenizin URL'si (`Dashboard > Settings > API`)                |
| `VITE_SUPABASE_ANON_KEY`  | ✅      | Supabase **anon/public** anahtarı (RLS ile korunur, frontend'de güvenli) |
| `VITE_TURNSTILE_SITE_KEY` | ⛔*     | Cloudflare Turnstile site key. Placeholder ise devre dışı.              |
| `VITE_SENTRY_DSN`         | ⛔*     | Sentry DSN. Boş ise hata takibi pasif.                                   |

\* Opsiyonel — boş/placeholder bırakılabilir; uygulama çalışmaya devam eder.

> 🔒 **ASLA** `service_role` key'ini frontend'e veya `.env` dosyasına koymayın.
> Bu anahtar yalnızca sunucu tarafında (backend/Edge Function) kullanılır.

---

## Klasör Yapısı

```
big/
├── index.html              # Ana sayfa (landing)
├── pages/                  # Tüm alt sayfalar (MPA)
│   ├── giris.html          # Giriş
│   ├── kayit.html          # Kayıt
│   ├── sifre-sifirlama.html
│   ├── kullanici-paneli.html   # Öğrenci paneli
│   ├── koclar.html         # Koç listesi
│   ├── koc-detay.html      # Koç detay
│   ├── paketler.html       # Paketler
│   ├── iletisim.html       # İletişim formu
│   ├── admin.html          # Admin giriş
│   ├── admin-dashboard.html# Admin yönetim paneli
│   ├── basarili.html       # Başarı/hata sonrası yönlendirme
│   ├── 404.html            # Sayfa bulunamadı
│   ├── cerez-politikasi.html
│   ├── gizlilik-politikasi.html
│   └── kullanim-sartlari.html
├── src/lib/                # JS modülleri
│   ├── supabase.js         # Supabase istemci (env'den okur)
│   ├── auth.js             # Kimlik doğrulama yardımcıları
│   ├── db.js               # Veritabanı sorgu yardımcıları
│   ├── sentry.js           # Sentry başlatma
│   └── turnstile.js        # Cloudflare Turnstile (opsiyonel)
├── css/style.css           # Ortak stiller
├── js/main.js              # Ortak ön-yüz mantığı
├── public/images/          # Statik görseller (favicon.svg vb.)
├── supabase/
│   └── schema.sql          # Veritabanı şeması + RLS + örnek veri
├── .env.example            # Ortam değişkeni şablonu
├── vercel.json             # Vercel yapılandırması (başlıklar, rewrite)
├── vite.config.js          # Vite MPA yapılandırması
├── robots.txt
└── GUVENLIK.md             # Güvenlik notları ve yapılacaklar
```

---

## Kullanılan Sayfalar Özeti

- **Genel:** `index.html` (ana tanıtım), `404.html`, `basarili.html`
- **Kimlik:** `giris.html`, `kayit.html`, `sifre-sifirlama.html`
- **Öğrenci:** `kullanici-paneli.html`
- **Koçluk:** `koclar.html`, `koc-detay.html`, `paketler.html`
- **İletişim:** `iletisim.html`
- **Yönetim:** `admin.html`, `admin-dashboard.html`
- **Yasal:** `cerez-politikasi.html`, `gizlilik-politikasi.html`, `kullanim-sartlari.html`

---

## Güvenlik

Detaylı güvenlik adımları, çözülen sorunlar ve yayın sonrası yapılacaklar
için **`GUVENLIK.md`** dosyasına bakın.

---

## Lisans

Bu proje özel kullanım içindir.
