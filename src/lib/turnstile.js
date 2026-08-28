/**
 * Turnstile yardımcı - opsiyonel mod
 * .env'de VITE_TURNSTILE_SITE_KEY placeholder (0x4AAAAAAA) ise widget gizlenir ve doğrulama atlanır.
 * Gerçek site key girildiğinde otomatik aktif olur.
 */
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

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
      el.dataset.sitekey = SITE_KEY;
    }
  });
  return enabled;
}

/**
 * Turnstile script'ini dinamik olarak yükler (sadece aktifse).
 * HTML'deki hardcoded <script src="turnstile"> tag'lerini kaldırın,
 * bunun yerine bu fonksiyonu kullanın.
 */
export function loadTurnstileScript() {
  if (!isTurnstileEnabled()) return Promise.resolve(false);
  if (window.turnstile) return Promise.resolve(true);
  if (document.querySelector(`script[src="${SCRIPT_URL}"]`)) {
    return new Promise(resolve => {
      const check = () => window.turnstile ? resolve(true) : setTimeout(check, 50);
      check();
    });
  }
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export function getTurnstileToken(formSelector = '') {
  if (!isTurnstileEnabled()) return 'disabled';
  const sel = formSelector ? `${formSelector} [name="cf-turnstile-response"]` : '[name="cf-turnstile-response"]';
  const input = document.querySelector(sel);
  return input ? input.value : '';
}
