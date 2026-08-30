-- =============================================
-- PUSULA - Supabase Veritabanı Şeması (UUID)
-- =============================================
-- NASIL ÇALIŞTIRILIR:
--   1. Supabase Dashboard -> SQL Editor -> "New query" açın.
--   2. Bu dosyanın TAMAMINI kopyalayıp yapıştırın.
--   3. "Run" (▶) butonuna basın.
--   4. Idempotenttir: tekrar çalıştırmak güvenlidir (IF NOT EXISTS /
--      CREATE OR REPLACE / ON CONFLICT kullanılır). Hiçbir destructive
--      (DROP/TRUNCATE) işlem yapılmaz.
--   5. İlk admin hesabı için en alttaki make_admin fonksiyonunu kullanın:
--      SELECT public.make_admin('admin@ornek.com');
-- =============================================
-- TÜM TABLOLAR UUID BİRİNCİL ANAHTAR KULLANIR (Supabase best practice).
-- Kod (db.js) id'leri tipten bağımsız kullandığı için uyumludur.
-- =============================================

-- =============================================
-- 1. PROFILES tablosu
-- auth trigger ile otomatik oluşur, sadece garanti altına alınır.
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  grade TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'coach')),
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admin rolü kontrolü için yardımcı fonksiyon.
-- SECURITY DEFINER + RLS bypass: polis içinde birebir "EXISTS (SELECT ... FROM profiles ...)"
-- kullanımı Postgres'te "infinite recursion detected in policy" hatasına yol açar.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Admin kullanicinin hesabini tamamen siler (auth.users -> profiles cascade).
-- SADECE admin tarafindan cagrilabilir. Cagri: select admin_delete_user('uuid');
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz islem';
  END IF;
  DELETE FROM auth.users WHERE id = target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;

-- Herkes kendi profilini okuyabilir
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin her profili okuyabilir
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    public.is_admin()
  );

-- Herkes kendi profilini güncelleyebilir
-- GÜVENLİK: rol sütunu kullanıcı tarafından 'admin' yapılamaz (rol yükseltme engeli).
-- (Alt sorgu yerine sabit izin listesi kullanılır — RLS sonsuz özyineleme olmaz.)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    (auth.uid() = id AND role IN ('student', 'coach'))
    OR public.is_admin()
  );

-- Admin tüm profilleri güncelleyebilir (rol değişimi dahil)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- Admin yeni profil ekleyebilir (mevcut bir auth kullanıcısına bağlamak için)
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- Admin profil silebilir (auth kullanıcısı silinmediği sürece hesapla birlikte)
CREATE POLICY "Admins can delete all profiles"
  ON profiles FOR DELETE
  USING (public.is_admin());

-- =============================================
-- KOÇ ROLÜ (coach)
-- Koç, yalnızca kendi email adresine atanmış öğrencilerini görebilir.
-- Tarayıcı: pages/coach-paneli.html
-- =============================================

-- Koç kendisine atanan öğrencilerin temel bilgilerini (profiles) okuyabilir
CREATE POLICY "Coaches can read own students profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_coaches sc
      JOIN coaches c ON c.id = sc.coach_id
      WHERE sc.student_id = profiles.id
        AND c.email = auth.jwt() ->> 'email'
    )
  );

-- Koç yalnızca kendi atamalarını (student_coaches) görebilir
CREATE POLICY "Coaches can read own students"
  ON student_coaches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      WHERE c.id = coach_id
        AND c.email = auth.jwt() ->> 'email'
    )
  );

-- =============================================
-- Yeni kullanıcı kaydolduğunda otomatik profil oluşturma
-- auth.users -> profiles
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, grade, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'grade', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone     = COALESCE(EXCLUDED.phone, profiles.phone),
    grade     = COALESCE(EXCLUDED.grade, profiles.grade),
    role      = COALESCE(EXCLUDED.role, profiles.role),
    email     = COALESCE(EXCLUDED.email, profiles.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 2. COACHES tablosu
-- =============================================
CREATE TABLE IF NOT EXISTS coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read coaches"
  ON coaches FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert coaches"
  ON coaches FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "Admins can update coaches"
  ON coaches FOR UPDATE
  USING (
    public.is_admin()
  );

CREATE POLICY "Admins can delete coaches"
  ON coaches FOR DELETE
  USING (
    public.is_admin()
  );

-- =============================================
-- 3. PACKAGES tablosu
-- =============================================
CREATE TABLE IF NOT EXISTS packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  period TEXT DEFAULT '/ay',
  description TEXT DEFAULT '',
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read packages"
  ON packages FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert packages"
  ON packages FOR INSERT
  WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "Admins can update packages"
  ON packages FOR UPDATE
  USING (
    public.is_admin()
  );

CREATE POLICY "Admins can delete packages"
  ON packages FOR DELETE
  USING (
    public.is_admin()
  );

-- =============================================
-- 4. STUDENT_COACHES tablosu (öğrenci-koç eşleştirme)
-- =============================================
CREATE TABLE IF NOT EXISTS student_coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id)
);

ALTER TABLE student_coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own assignment"
  ON student_coaches FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all assignments"
  ON student_coaches FOR SELECT
  USING (
    public.is_admin()
  );

CREATE POLICY "Admins can manage assignments"
  ON student_coaches FOR ALL
  USING (
    public.is_admin()
  );

-- =============================================
-- 5. STUDENT_PACKAGES tablosu
-- =============================================
CREATE TABLE IF NOT EXISTS student_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pasif', 'Suresi Doldu')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE student_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own packages"
  ON student_packages FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all student packages"
  ON student_packages FOR SELECT
  USING (
    public.is_admin()
  );

CREATE POLICY "Admins can manage student packages"
  ON student_packages FOR ALL
  USING (
    public.is_admin()
  );

-- =============================================
-- 6. MESSAGES tablosu (iletim formu + admin mesajları)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Herkes mesaj gönderebilir (iletisim formu)
-- GÜVENLİK: giriş yapmış kullanıcı kendi adına gönderebilir, anonim sender_id NULL
CREATE POLICY "Anyone can insert messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Admin tüm mesajları okuyabilir
CREATE POLICY "Admins can read all messages"
  ON messages FOR SELECT
  USING (
    public.is_admin()
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
    public.is_admin()
  );

-- Öğrenciler kendi (hedeflenen) mesajlarını okundu işaretleyebilir
CREATE POLICY "Students can mark own messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = target_student_id)
  WITH CHECK (auth.uid() = target_student_id);

-- Admin mesajları silebilir
CREATE POLICY "Admins can delete messages"
  ON messages FOR DELETE
  USING (
    public.is_admin()
  );

-- =============================================
-- UPDATED_AT otomatik güncelleme trigger'ı
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- İlgili tablolara updated_at sütunu ekle (varsa atla)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaches' AND column_name='updated_at') THEN
    ALTER TABLE coaches ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='packages' AND column_name='updated_at') THEN
    ALTER TABLE packages ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_packages' AND column_name='updated_at') THEN
    ALTER TABLE student_packages ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_coaches_updated_at ON coaches;
CREATE TRIGGER set_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_packages_updated_at ON packages;
CREATE TRIGGER set_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_student_packages_updated_at ON student_packages;
CREATE TRIGGER set_student_packages_updated_at
  BEFORE UPDATE ON student_packages
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =============================================
-- PERFORMANS İNDEX'LERİ
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_coaches_status ON coaches(status);

CREATE INDEX IF NOT EXISTS idx_student_coaches_student_id ON student_coaches(student_id);
CREATE INDEX IF NOT EXISTS idx_student_coaches_coach_id ON student_coaches(coach_id);

CREATE INDEX IF NOT EXISTS idx_student_packages_student_id ON student_packages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_status ON student_packages(status);
CREATE INDEX IF NOT EXISTS idx_student_packages_package_id ON student_packages(package_id);

CREATE INDEX IF NOT EXISTS idx_messages_target_student_id ON messages(target_student_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- =============================================
-- ÖRNEK VERİLER (isteğe bağlı - koçlar, paketler)
-- =============================================

INSERT INTO coaches (name, email, specialty, phone, bio, status, students_count, rating, experience)
VALUES
  ('Emre Demir', 'emre@pusula.com', 'TYT Matematik', '0532 111 22 33', 'İTÜ Matematik Bölümü mezunu. 5 yıl deneyimli TYT Matematik koçu.', 'Aktif', 500, 4.9, '5 Yıl'),
  ('Selin Çelik', 'selin@pusula.com', 'AYT Fen Bilimleri', '0533 222 33 44', 'ODTÜ Fizik Bölümü mezunu. 3 yıl deneyimli AYT Fen koçu.', 'Aktif', 350, 4.8, '3 Yıl'),
  ('Ahmet Korkmaz', 'ahmet@pusula.com', 'TYT Türkçe', '0534 333 44 55', 'Türk Dili ve Edebiyatı Bölümü birincisi. 4 yıl deneyimli.', 'Aktif', 420, 4.9, '4 Yıl'),
  ('Zeynep Arslan', 'zeynep@pusula.com', 'AYT Matematik', '0535 444 55 66', 'Hacettepe Matematik Bölümü yüksek lisans. 2 yıl deneyimli.', 'Aktif', 280, 4.7, '2 Yıl'),
  ('Merve Yıldız', 'merve@pusula.com', 'PDR Uzmanı', '0536 555 66 77', 'Psikolojik Danışmanlık ve Rehberlik uzmanı. 6 yıl deneyim.', 'Aktif', 600, 5.0, '6 Yıl'),
  ('Burak Özkan', 'burak@pusula.com', 'TYT Sosyal Bilimler', '0537 666 77 88', 'Tarih Bölümü mezunu, Sosyal Bilimlerde uzman koç.', 'Aktif', 310, 4.8, '3 Yıl');

INSERT INTO packages (name, price, period, description, features, is_popular)
VALUES
  ('Başlangıç', 499, '/ay', 'İlk adımı atmak isteyenler için',
   '["TYT Koçluk", "Haftalık Plan", "SMS Desteği", "2 Koç Görüşmesi"]'::jsonb, false),
  ('Standart', 999, '/ay', 'Kapsamlı hazırlık için ideal',
   '["TYT + AYT Koçluk", "Günlük Plan", "WhatsApp Desteği", "4 Koç Görüşmesi", "Deneme Analizi"]'::jsonb, true),
  ('Premium', 1499, '/ay', 'Tam destek, tam başarı',
   '["TYT + AYT + PDR", "Sınırsız Plan", "7/24 Destek", "Sınırsız Koç Görüşmesi", "Deneme Analizi", "Bireysel Motivasyon"]'::jsonb, false);

-- =============================================
-- ADMIN YARDIMCISI
-- Bir kullanıcıyı e-posta ile admin yapar.
-- Kullanım: SELECT public.make_admin('admin@pusula.com');
-- =============================================
CREATE OR REPLACE FUNCTION public.make_admin(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, grade, role)
  SELECT id,
         COALESCE(raw_user_meta_data->>'full_name', ''),
         '',
         '',
         'admin'
  FROM auth.users
  WHERE email = p_email
  ON CONFLICT (id) DO UPDATE SET role = 'admin';
END;
$$;
