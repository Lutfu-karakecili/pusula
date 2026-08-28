import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

// .env'i basitçe oku (dotenv bağımlılığı olmadan)
function loadEnv() {
  const out = {};
  try {
    const txt = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    txt.split('\n').forEach((line) => {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  } catch (e) {
    // .env yoksa process.env'e düş
  }
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
  console.error('Kullanım: npm run make-admin <email> <parola>');
  console.error('Örnek:   npm run make-admin admin@pusula.com ************');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  realtime: { transport: ws },
  auth: { autoRefreshToken: false, persistSession: false }
});

try {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (error) throw new Error('Kullanıcı oluşturulamadı: ' + error.message);

  const { error: e2 } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', data.user.id);
  if (e2) throw new Error('Rol güncellenemedi: ' + e2.message);

  console.log('✓ Admin hesabı oluşturuldu ve role=admin yapıldı: ' + email);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
