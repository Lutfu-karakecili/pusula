#!/usr/bin/env bash
# Pusula — İletişim Edge Function dağıtım betiği (AJAN-B)
#
# GEREKSİNİMLER:
#   - Node/npx yüklü (supabase CLI gömülü gelir: npx supabase)
#   - 'npx supabase login' ile bir kez oturum açmış olmalısınız (tarayıcı, interaktif)
#   - Projenizle link'li olmalı: npx supabase link --project-ref XXXX
#
# SECRET'LAR (ASLA bu dosyaya yazmayın):
#   En güvenli yol: aşağıdaki 3 değişkeni shell ortamına verip scripti çalıştırmak.
#     export TURNSTILE_SECRET_KEY="0x..."      # Cloudflare > Turnstile > Secret
#     export SUPABASE_SERVICE_ROLE_KEY="ey..." # Supabase > Settings > API > service_role
#     export SUPABASE_URL="https://xxxx.supabase.co"
#   VEYA scripti boş çalıştırıp secret'ları elle ayarlayın (aşağıdaki komut yazdırılır).
#
# KULLANIM:
#   bash scripts/deploy-contact.sh
set -euo pipefail

echo "== Supabase CLI sürümü =="
npx supabase --version

echo "== Proje durumu (gerekirse: npx supabase link --project-ref XXXX) =="
npx supabase status || true

TURNSTILE_SECRET_KEY="${TURNSTILE_SECRET_KEY:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
SUPABASE_URL="${SUPABASE_URL:-}"

if [ -n "$TURNSTILE_SECRET_KEY" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && [ -n "$SUPABASE_URL" ]; then
  echo "== Edge Function secret'ları yükleniyor =="
  npx supabase secrets set \
    TURNSTILE_SECRET_KEY="$TURNSTILE_SECRET_KEY" \
    SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
    SUPABASE_URL="$SUPABASE_URL"
else
  echo "== UYARI: Secret'lar atlandı. Şu komutu elle çalıştırın: =="
  echo "npx supabase secrets set TURNSTILE_SECRET_KEY=\"...\" SUPABASE_SERVICE_ROLE_KEY=\"...\" SUPABASE_URL=\"https://xxxx.supabase.co\""
fi

echo "== Edge Function dağıtılıyor: contact =="
npx supabase functions deploy contact

echo "== BİTTİ. Fonksiyon URL'si: <SUPABASE_URL>/functions/v1/contact =="
