-- ============================================================================
-- Migration 0002: Örnek/seed veri (geliştirme ortamı için opsiyonel)
-- Not: Gerçek kullanıcılar auth.users üzerinden oluşturulmalıdır (trigger
--      handle_new_user profilleri otomatik yaratır). Bu dosya yalnızca
--      demo amaçlı statik referans veriler ekler; production'da atlanabilir.
-- ============================================================================

-- Örnek ders/konu referans tablosu (planlama ekranında dropdown için)
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  exam_type text not null check (exam_type in ('TYT', 'AYT')),
  topics text[] not null default '{}'
);

insert into public.subjects (name, exam_type, topics) values
  ('Matematik', 'TYT', array['Temel Kavramlar','Sayılar','Bölme-Bölünebilme','Rasyonel Sayılar','Basit Eşitsizlikler','Mutlak Değer','Üslü Sayılar','Köklü Sayılar','Çarpanlara Ayırma','Oran-Orantı','Problemler','Kümeler','Fonksiyonlar','Permütasyon-Kombinasyon','Olasılık','Geometri']),
  ('Matematik', 'AYT', array['Fonksiyonlar','Polinomlar','2.Derece Denklemler','Trigonometri','Logaritma','Diziler','Limit','Türev','İntegral']),
  ('Türkçe', 'TYT', array['Sözcükte Anlam','Cümlede Anlam','Paragraf','Ses Bilgisi','Yazım Kuralları','Noktalama','Dil Bilgisi']),
  ('Fizik', 'TYT', array['Fizik Bilimine Giriş','Madde ve Özellikleri','Hareket','Kuvvet','Enerji','Elektrik']),
  ('Fizik', 'AYT', array['Vektörler','Kuvvet-Tork','Elektrik Alan','Manyetizma','Optik','Modern Fizik']),
  ('Kimya', 'TYT', array['Kimya Bilimi','Atom','Periyodik Sistem','Kimyasal Türler','Mol Kavramı']),
  ('Biyoloji', 'TYT', array['Canlıların Ortak Özellikleri','Hücre','Canlılar Dünyası']),
  ('Tarih', 'TYT', array['Tarih Bilimi','İlk Uygarlıklar','İslamiyet Öncesi Türk Tarihi']),
  ('Coğrafya', 'TYT', array['Doğa ve İnsan','Dünyanın Şekli','İklim']),
  ('Geometri', 'AYT', array['Doğruda ve Üçgende Açılar','Çokgenler','Çember ve Daire','Analitik Geometri']);

alter table public.subjects enable row level security;
create policy "subjects_read_all" on public.subjects for select using (true);
create policy "subjects_admin_write" on public.subjects for all using (public.is_admin()) with check (public.is_admin());
