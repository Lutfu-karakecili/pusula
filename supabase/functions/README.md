# Supabase Edge Functions — İletişim Formu Sunucu Tarafı Koruması

Bu klasör, Pusula iletişim formunu spam'e karşı koruyan iki Edge Function'ı içerir.
Client artık Turnstile token'ını **yalnızca client-side** kontrol etmiyor; token
gerçekten sunucuda doğrulanıyor ve gönderim rate-limit'e tabi tutuluyor.

## Fonksiyonlar

### 1. `verify-turnstile`
Turnstile token'ını Cloudflare `siteverify` üzerinden sunucuda doğrular.

- Endpoint: `POST /functions/v1/verify-turnstile`
- Giriş: `{ "token": "<turnstile-response>" }`
- Çıkış: `{ "ok": true }`  /  başarısızsa HTTP `403 { "ok": false }`
- Client köprüsü: `src/lib/server-verify.js` → `verifyTurnstile(token)`

### 2. `contact-guard`
İletişim gönderimini korur:

1. Turnstile token'ı varsa sunucuda doğrulanır (savunma katmanı).
2. Alan doğrulaması yapılır.
3. Aynı `sender_email` için son 10 dakikada en fazla **5** kayıt kabul edilir
   (rate-limit, `messages` tablosu sorgulanır).
4. Geçerli ise `messages` tablosuna `service_role` ile INSERT yapılır.

- Endpoint: `POST /functions/v1/contact-guard`
- Giriş: `{ name|sender_name, email|sender_email, phone|sender_phone, subject, message|body, token? }`
- Çıkış: `{ "success": true, "id": <bigint> }`  /  hata durumunda JSON + HTTP
- Client köprüsü: `src/lib/server-verify.js` → `submitContact(payload)`

## Deploy

```bash
# Geliştirme ortamında (Supabase yerel) link sonrası:
supabase functions deploy verify-turnstile
supabase functions deploy contact-guard
```

Her iki fonksiyon da herkese açık olduğu için JWT doğrulaması kapalıdır
(güvenlik Turnstile + rate-limit ile sağlanır). `supabase/config.toml` içinde
`verify_jwt = false` olarak ayarlıdır.

## Gerekli Ortam Değişkenleri (Secrets)

Supabase Dashboard > Edge Functions > Secrets **ve** Vercel / Project Environment
alanlarına aşağıdakiler eklenmelidir:

| Değişken                | Açıklama                                      |
|-------------------------|-----------------------------------------------|
| `SECRET_TURNSTILE_KEY`  | Cloudflare Turnstile **secret** key           |
| `SUPABASE_URL`          | Supabase proje URL'si                         |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** key (yalnızca sunucu) |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` ve `SECRET_TURNSTILE_KEY` asla cliente
> gönderilmemelidir. Yalnızca Edge Function ortamında tutulur.

Cloudflare Turnstile site key (public) ise `.env` içinde
`VITE_TURNSTILE_SITE_KEY` olarak tanımlanır (bkz. `src/lib/turnstile.js`).

## Notlar

- `verify-turnstile` ve `contact-guard` bağımsız fonksiyonlardır; eski
  `contact` fonksiyonu (varsa) yerini almıştır ve kullanılmaz.
- Rate-limit penceresi ve limiti `contact-guard/index.ts` içindeki
  `RATE_LIMIT` / `RATE_WINDOW_MS` sabitleriyle ayarlanabilir.
