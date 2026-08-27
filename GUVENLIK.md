# Güvenlik Notları - Pusula

## Çözülenler (2026-08-27)
- `vercel.json` rewrites düzeltildi: SPA catch-all kaldırıldı, `cleanUrls:true` + MPA uyumlu rewrite eklendi. CSP `connect-src` artık `https://*.supabase.co` ve `https://*.ingest.sentry.io` wildcard.
- Turnstile opsiyonel moda alındı: `src/lib/turnstile.js` eklendi. `.env`'de placeholder `0x4AAAAAAA` ise widget gizlenir, form doğrulaması atlanır. Gerçek Cloudflare site key girilince otomatik aktif olur. `giris.html`, `kayit.html`, `iletisim.html` güncellendi.
- Sentry boş DSN'de zaten pasif (`sentry.js:6` if guard).
- `giris.html` redirect bug düzeltildi: `index.html` -> `../index.html`.
- CI eklendi: `.github/workflows/ci.yml` build + .env leak kontrol + npm audit.

## Yapılacaklar (Env ile aktif)
1. Cloudflare Turnstile: Dashboard > Turnstile > Add site > site key'i `.env`'de `VITE_TURNSTILE_SITE_KEY` olarak güncelle, `vercel.json` CSP'ye zaten ekli.
2. Sentry: sentry.io > Create Project (Browser JS) > DSN'i `.env`'de `VITE_SENTRY_DSN` yap, deploy et.
3. Supabase: `.env` anon key zaten dolu, production URL için Vercel env variables'a aynı değerleri ekle (Vercel > Settings > Environment Variables).

## Kontrol
- `npm run build` başarılı (421 modules, gzip ~5kB css, 56kB supabase chunk)
- `git ls-files | grep .env` -> boş olmalı (ignore ediliyor)
- `npm audit` -> high seviye açık yok (kontrol edildi)

