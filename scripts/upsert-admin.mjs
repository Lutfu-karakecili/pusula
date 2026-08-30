import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

function loadEnv() {
  const out = {};
  try {
    const txt = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    txt.split('\n').forEach((line) => {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  } catch (e) {}
  return { ...process.env, ...out };
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('HATA: VITE_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY (.env) gerekli.');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error('Kullanim: node scripts/upsert-admin.mjs <email> <parola>');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  realtime: { transport: ws },
  auth: { autoRefreshToken: false, persistSession: false }
});

// E-postaya ait kullaniciyi admin API ile bul (sayfalayarak)
async function findUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 1000;
  while (page < 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error('listUsers: ' + error.message);
    const hit = data.users.find((u) => u.email && u.email.toLowerCase() === targetEmail.toLowerCase());
    if (hit) return hit;
    if (data.users.length < perPage) break;
    page++;
  }
  return null;
}

try {
  const existing = await findUserByEmail(email);

  let userId;
  if (existing) {
    const { data: upd, error: e1 } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata || {}) }
    });
    if (e1) throw new Error('Sifre guncellenemedi: ' + e1.message);
    userId = upd.user.id;
    console.log('✓ Sifre sifirlandi (mail onayli): ' + email);
  } else {
    const { data: created, error: e0 } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (e0) throw new Error('Kullanici olusturulamadi: ' + e0.message);
    userId = created.user.id;
    console.log('✓ Kullanici olusturuldu + sifre + mail onayli: ' + email);
  }

  const { error: e2 } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
  if (e2) throw new Error('Rol admin yapilamadi: ' + e2.message);

  console.log('✓ role = admin: ' + email);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}