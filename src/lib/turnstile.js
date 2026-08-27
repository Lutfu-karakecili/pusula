/**
 * Turnstile yardımcı - opsiyonel mod
 * .env'de VITE_TURNSTILE_SITE_KEY placeholder (0x4AAAAAAA) ise widget gizlenir ve doğrulama atlanır.
 * Gerçek site key girildiğinde otomatik aktif olur.
 */
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export function isTurnstileEnabled() {
  return !!SITE_KEY && SITE_KEY !== '0x4AAAAAAA' && SITE_KEY.trim() !== '';
}

export function getTurnstileSiteKey() {
  return SITE_KEY;
}

export function initTurnstileWidgets() {
  const enabled = isTurnstileEnabled();
  document.querySelectorAll('.cf-turnstile').forEach(el => {
    if (!enabled) {
      el.style.display = 'none';
    } else {
      // Gerçek key varsa DOM'a yaz (Vite build'de otomatik inject için)
      el.dataset.sitekey = SITE_KEY;
    }
  });
  //Script'i de devre dışıysa yükleme - zaten async defer ama widget gizli
  return enabled;
}

export function getTurnstileToken(formSelector = '') {
  if (!isTurnstileEnabled()) return 'disabled';
  const sel = formSelector ? `${formSelector} [name="cf-turnstile-response"]` : '[name="cf-turnstile-response"]';
  const input = document.querySelector(sel);
  return input ? input.value : '';
}
