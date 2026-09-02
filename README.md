# Pusula — YKS Koçluk Platformu (Next.js 15)

Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Supabase
ile geliştirilmiş, **sadece YKS (TYT/AYT)** odaklı bir öğrenci-koç koçluk
platformu. LGS ve genel PDR modülleri kapsam dışıdır.

## Teknoloji Yığını
- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Dil:** TypeScript
- **Stil:** Tailwind CSS + shadcn/ui (Radix primitives) — dark mode varsayılan
- **Veritabanı/Auth:** Supabase (Postgres + RLS + Auth + Edge Functions)
- **Grafikler:** Chart.js (react-chartjs-2) — net gelişimi, ödev durumu, alan dağılımı
- **AI Sohbet:** Supabase Edge Function → Claude API, SSE ile gerçek zamanlı stream
- **Görüşmeler:** Zoom Server-to-Server OAuth entegrasyonu

## Klasör Yapısı
```
app/
├── (auth)/login, register           # Kimlik doğrulama
├── (admin)/dashboard/...            # Yönetici paneli — /dashboard
├── coach/dashboard, planning, ...   # Koç paneli — /coach/*
├── student/dashboard, ai, ...       # Öğrenci paneli — /student/*
├── api/
│   ├── ai/chat/route.ts             # AI sohbet (Edge Function proxy, SSE)
│   ├── admin/                       # Admin CRUD uçları (service_role)
│   └── meetings/route.ts            # Zoom görüşme oluşturma
components/
├── ui/                              # shadcn/ui bileşenleri
├── shared/                          # sidebar, topbar, dashboard-shell, stat-card
├── charts/                          # Chart.js sarmalayıcıları
lib/
├── supabase/                        # client / server / admin / middleware
├── database.types.ts, utils.ts, nav-config.ts, zoom.ts
supabase/
├── migrations/0001_init.sql         # Tablolar + RLS + trigger'lar
├── migrations/0002_seed.sql         # Örnek ders/konu referans verisi
├── functions/ai-chat/index.ts       # Edge Function (Claude API, streaming)
middleware.ts                        # Rol bazlı yönlendirme
```

## Veritabanı Şeması (özet)
`profiles` (auth.users genişlemesi, rol: admin/coach/student) · `students`
(YKS'ye özel alanlar) · `plans` + `plan_items` (haftalık plan) · `homework`
(ödev takvimi) · `meetings` (Zoom entegrasyonlu görüşmeler) ·
`coaching_notes` (koç değerlendirme notları, öğrenciye görünürlük kontrolü
ile) · `ai_conversations` + `ai_messages` (AI sohbet geçmişi).

Tüm tablolarda **Row Level Security** aktiftir: öğrenci yalnızca kendi
verisini, koç yalnızca kendi öğrencilerinin verisini, admin ise her şeyi
görebilir/düzenleyebilir.

## Kurulum

```bash
npm install
cp .env.example .env   # Supabase URL/anon key/service_role key gir
```

### Supabase
1. Yeni proje oluştur → SQL Editor'de sırasıyla
   `supabase/migrations/0001_init.sql` ve `0002_seed.sql` dosyalarını çalıştır.
2. Edge Function'ı deploy et:
   ```bash
   supabase functions deploy ai-chat
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
3. İlk admin hesabını oluştur: `Authentication > Users` üzerinden bir
   kullanıcı ekle, sonra SQL Editor'de:
   ```sql
   update public.profiles set role = 'admin' where email = 'admin@ornek.com';
   ```

### Zoom (opsiyonel)
`ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` tanımlı değilse
sistem geliştirme amaçlı sahte bir Zoom linki üretir; akış Zoom hesabı
olmadan da test edilebilir.

### Geliştirme sunucusu
```bash
npm run dev
```

## Rol Bazlı Yönlendirme
`middleware.ts`, her istekte Supabase oturumunu kontrol eder ve kullanıcının
`profiles.role` değerine göre:
- `admin` → `/dashboard`
- `coach` → `/coach/dashboard`
- `student` → `/student/dashboard`

alanlarına yönlendirir; yetkisi olmayan bir role ait yola girmeye çalışan
kullanıcı kendi ana sayfasına geri gönderilir.

## Güvenlik Notları
- `service_role` anahtarı yalnızca `lib/supabase/admin.ts` üzerinden,
  sadece API route'ları içinde kullanılır — asla client'a sızmaz.
- Tüm tablolarda RLS aktif; `coaching_notes` varsayılan olarak öğrenciden
  gizlidir (`visible_to_student` alanı ile koç kontrol eder).
- `vercel.json` güvenlik başlıkları (HSTS, X-Frame-Options vb.) içerir.

## Lisans
Bu proje özel kullanım içindir.
