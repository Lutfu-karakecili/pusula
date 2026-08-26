-- =============================================
-- PUSULA - Supabase Veritabanı Şeması
-- Bu dosyayı Supabase SQL Editor'da çalıştırın
-- =============================================

-- 1. PROFILES tablosu (auth trigger ile otomatik oluşur, sadece garanti altına al)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  grade TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- profiles tablosunda RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Herkes kendi profilini okuyabilir
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin her profili okuyabilir
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Herkes kendi profilini güncelleyebilir
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. COACHES tablosu
CREATE TABLE IF NOT EXISTS coaches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialty TEXT NOT NULL,
  phone TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pasif')),
  students_count INT DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0.0,
  experience TEXT DEFAULT '0 Yıl',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coaches RLS: Herkes okuyabilir, sadece admin yazabilir
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read coaches"
  ON coaches FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert coaches"
  ON coaches FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update coaches"
  ON coaches FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete coaches"
  ON coaches FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. PACKAGES tablosu
CREATE TABLE IF NOT EXISTS packages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  period TEXT DEFAULT '/ay',
  description TEXT DEFAULT '',
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Packages RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read packages"
  ON packages FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert packages"
  ON packages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update packages"
  ON packages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete packages"
  ON packages FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. STUDENT_COACHES tablosu (öğrenci-koç eşleştirme)
CREATE TABLE IF NOT EXISTS student_coaches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id BIGINT REFERENCES coaches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id)
);

-- Student_Coaches RLS
ALTER TABLE student_coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own assignment"
  ON student_coaches FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all assignments"
  ON student_coaches FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage assignments"
  ON student_coaches FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. STUDENT_PACKAGES tablosu
CREATE TABLE IF NOT EXISTS student_packages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  package_id BIGINT REFERENCES packages(id) ON DELETE SET NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pasif', 'Süresi Doldu')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student_Packages RLS
ALTER TABLE student_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own packages"
  ON student_packages FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all student packages"
  ON student_packages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage student packages"
  ON student_packages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. MESSAGES tablosu (iletim formu + admin mesajları)
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sender_name TEXT DEFAULT '',
  sender_email TEXT DEFAULT '',
  sender_phone TEXT DEFAULT '',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Herkes mesaj gönderebilir (iletisim formu)
CREATE POLICY "Anyone can insert messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Admin tüm mesajları okuyabilir
CREATE POLICY "Admins can read all messages"
  ON messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Kullanıcılar kendilerine gönderilen mesajları okuyabilir
CREATE POLICY "Students can read own messages"
  ON messages FOR SELECT
  USING (auth.uid() = target_student_id);

-- Kullanıcılar kendi gönderdikleri mesajları okuyabilir
CREATE POLICY "Users can read own sent messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id);

-- Admin mesajları güncelleyebilir (okundu işaretleme vb.)
CREATE POLICY "Admins can update messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin mesajları silebilir
CREATE POLICY "Admins can delete messages"
  ON messages FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- ÖRNEK VERİLER (isteğe bağlı - admin hesabı,
-- koçlar, paketler)
-- =============================================

-- Admin hesabını profiles tablosuna ekle
-- (Bu hesap zaten Supabase Auth'ta kayıtlı olmalı)
-- INSERT INTO profiles (id, full_name, role)
-- VALUES ('ADMIN_USER_UUID', 'Admin', 'admin')
-- ON CONFLICT (id) DO NOTHING;

-- Örnek koçlar
INSERT INTO coaches (name, email, specialty, phone, bio, status, students_count, rating, experience)
VALUES
  ('Emre Demir', 'emre@pusula.com', 'TYT Matematik', '0532 111 22 33', 'İTÜ Matematik Bölümü mezunu. 5 yıl deneyimli TYT Matematik koçu.', 'Aktif', 500, 4.9, '5 Yıl'),
  ('Selin Çelik', 'selin@pusula.com', 'AYT Fen Bilimleri', '0533 222 33 44', 'ODTÜ Fizik Bölümü mezunu. 3 yıl deneyimli AYT Fen koçu.', 'Aktif', 350, 4.8, '3 Yıl'),
  ('Ahmet Korkmaz', 'ahmet@pusula.com', 'TYT Türkçe', '0534 333 44 55', 'Türk Dili ve Edebiyatı Bölümü birincisi. 4 yıl deneyimli.', 'Aktif', 420, 4.9, '4 Yıl'),
  ('Zeynep Arslan', 'zeynep@pusula.com', 'AYT Matematik', '0535 444 55 66', 'Hacettepe Matematik Bölümü yüksek lisans. 2 yıl deneyimli.', 'Aktif', 280, 4.7, '2 Yıl'),
  ('Merve Yıldız', 'merve@pusula.com', 'PDR Uzmanı', '0536 555 66 77', 'Psikolojik Danışmanlık ve Rehberlik uzmanı. 6 yıl deneyim.', 'Aktif', 600, 5.0, '6 Yıl'),
  ('Burak Özkan', 'burak@pusula.com', 'TYT Sosyal Bilimler', '0537 666 77 88', 'Tarih Bölümü mezunu, Sosyal Bilimlerde uzman koç.', 'Aktif', 310, 4.8, '3 Yıl');

-- Örnek paketler
INSERT INTO packages (name, price, period, description, features, is_popular)
VALUES
  ('Başlangıç', 499, '/ay', 'İlk adımı atmak isteyenler için',
   '["TYT Koçluk", "Haftalık Plan", "SMS Desteği", "2 Koç Görüşmesi"]'::jsonb, false),
  ('Standart', 999, '/ay', 'Kapsamlı hazırlık için ideal',
   '["TYT + AYT Koçluk", "Günlük Plan", "WhatsApp Desteği", "4 Koç Görüşmesi", "Deneme Analizi"]'::jsonb, true),
  ('Premium', 1499, '/ay', 'Tam destek, tam başarı',
   '["TYT + AYT + PDR", "Sınırsız Plan", "7/24 Destek", "Sınırsız Koç Görüşmesi", "Deneme Analizi", "Bireysel Motivasyon"]'::jsonb, false);
