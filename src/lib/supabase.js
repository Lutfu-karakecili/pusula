import { createClient } from '@supabase/supabase-js';

// Bu değerler .env dosyasından okunur (Vite otomatik yükler).
// Kod içine ASLA sabit (hardcoded) yazmayın.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase ortam değişkenleri eksik. .env dosyanızı kontrol edin (.env.example üzerinden kopyalayın).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
