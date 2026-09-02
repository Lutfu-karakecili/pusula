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
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('HATA: .env dosyasında NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] || 'admin';
if (!email || !password) {
  console.error('Kullanım: node scripts/setup-admin.mjs <email> <parola> [role]');
  console.error('  role: admin (varsayılan), coach, student');
  process.exit(1);
}

function headers(prefer) {
  return {
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    ...(prefer ? { 'Prefer': prefer } : {}),
  };
}

// 1) Auth API ile kullanıcı oluştur
console.log('→ Kullanıcı oluşturuluyor...');
const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: headers('return=representation'),
  body: JSON.stringify({ email, password, email_confirm: true }),
});

const userData = await res.json();
if (userData.code) {
  console.error('HATA:', userData.msg || userData.message);
  process.exit(1);
}

const userId = userData.id;
console.log('  ✓ Auth kullanıcısı:', userId);

// 2) Profiles satırı var mı kontrol et, yoksa oluştur
console.log('→ Profil oluşturuluyor...');
const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id`, {
  headers: headers(),
});

const existing = await checkRes.json();

if (existing && existing.length > 0) {
  // Profile varsa güncelle
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: headers('return=minimal'),
    body: JSON.stringify({ role, full_name: email.split('@')[0] }),
  });
  console.log('  ✓ Profil güncellendi:', role);
} else {
  // Profile yoksa oluştur
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: headers('return=minimal'),
    body: JSON.stringify({
      id: userId,
      role,
      full_name: email.split('@')[0],
      email,
    }),
  });
  if (!insertRes.ok) {
    const err = await insertRes.text();
    console.error('  Profil oluşturulamadı:', err);
    process.exit(1);
  }
  console.log('  ✓ Profil oluşturuldu:', role);
}

// 3) Role student ise students tablosuna da ekle
if (role === 'student') {
  console.log('→ Öğrenci kaydı ekleniyor...');
  await fetch(`${SUPABASE_URL}/rest/v1/students`, {
    method: 'POST',
    headers: headers('return=minimal'),
    body: JSON.stringify({ id: userId }),
  });
  console.log('  ✓ Öğrenci kaydı eklendi');
}

console.log(`\n✓ Tamamlandı! ${role.toUpperCase()} hesabı: ${email}`);
