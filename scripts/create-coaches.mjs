// Koç hesapları oluşturur (auth.users + profiles, role='coach').
// ÖN KOŞUL: supabase/migration-coach-role.sql SQL Editor'da çalıştırılmış olmalı
// (yoksa 'coach' rolü CHECK constraint'e takılır).
// Kullanım: node scripts/create-coaches.mjs
import { readFileSync, existsSync } from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
  auth: { autoRefreshToken: false, persistSession: false },
});

const COACHES = [
  { email: 'emre@pusula.com', full_name: 'Emre Demir' },
  { email: 'selin@pusula.com', full_name: 'Selin Çelik' },
  { email: 'ahmet@pusula.com', full_name: 'Ahmet Korkmaz' },
  { email: 'zeynep@pusula.com', full_name: 'Zeynep Arslan' },
  { email: 'merve@pusula.com', full_name: 'Merve Yıldız' },
  { email: 'burak@pusula.com', full_name: 'Burak Özkan' },
];

function genPassword() {
  return crypto.randomBytes(6).toString('base64url').slice(0, 10);
}

const { data: existing, error: listErr } = await sb.auth.admin.listUsers({ perPage: 1000 });
if (listErr) {
  console.error('Kullanici listesi alinamadi:', listErr.message);
  process.exit(1);
}

const results = [];
for (const coach of COACHES) {
  const found = existing.users.find((u) => u.email === coach.email);
  let userId = found?.id;
  if (!found) {
    const password = genPassword();
    const { data: user, error } = await sb.auth.admin.createUser({
      email: coach.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: coach.full_name, role: 'coach' },
    });
    if (error) {
      console.error('HATA - ' + coach.email + ':', error.message);
      continue;
    }
    userId = user.id;
    results.push({ email: coach.email, password, created: true });
  } else {
    results.push({ email: coach.email, password: '(mevcut, degismedi)', created: false });
  }

  const upsert = userId
    ? await sb
        .from('profiles')
        .upsert(
          { id: userId, full_name: coach.full_name, role: 'coach' },
          { onConflict: 'id' }
        )
        .select()
        .single()
    : { error: null };
  if (upsert?.error) {
    console.error('PROFIL HATA - ' + coach.email + ':', upsert.error.message);
  }
}

console.log('\n=== KOÇ HESAPLARI ===');
for (const r of results) {
  console.log((r.created ? 'YENi : ' : 'MEVCUT: ') + r.email + ' | sifre: ' + r.password);
}
console.log('\nGiris: https://pusula-zeta.vercel.app/pages/giris.html');