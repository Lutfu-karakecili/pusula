import { readFileSync } from 'node:fs';

function loadEnv() {
  const out = {};
  try {
    const txt = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    txt.split('\n').forEach((line) => {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  } catch {}
  return { ...process.env, ...out };
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('HATA: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY (.env) gerekli.');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error('Kullanım: node scripts/setup-admin.mjs <email> <parola>');
  process.exit(1);
}

// Auth API ile kullanıcı oluştur
const res = await fetch(`${url}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'apikey': serviceKey,
  },
  body: JSON.stringify({ email, password, email_confirm: true }),
});

const data = await res.json();
if (data.code) {
  console.error('HATA:', data.msg || data.message);
  process.exit(1);
}

// Profile'ı admin yap
const profileRes = await fetch(`${url}/rest/v1/profiles?id=eq.${data.id}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Prefer': 'return=minimal',
  },
  body: JSON.stringify({ role: 'admin' }),
});

if (!profileRes.ok) {
  const err = await profileRes.text();
  console.error('Rol güncellenemedi:', err);
  process.exit(1);
}

console.log('✓ Admin oluşturuldu:', email);
