-- =============================================
-- PUSULA MERGED — big projesinden ek tablolar
-- =============================================

-- Koçlar tablosu (big projesinden)
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

CREATE POLICY "Anyone can read coaches" ON coaches FOR SELECT USING (true);
CREATE POLICY "Admins can insert coaches" ON coaches FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admins can update coaches" ON coaches FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Admins can delete coaches" ON coaches FOR DELETE USING (get_user_role() = 'admin');

-- Paketler tablosu (big projesinden)
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

CREATE POLICY "Anyone can read packages" ON packages FOR SELECT USING (true);
CREATE POLICY "Admins can insert packages" ON packages FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admins can update packages" ON packages FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Admins can delete packages" ON packages FOR DELETE USING (get_user_role() = 'admin');

-- Öğrenci-Paket ilişkisi (big projesinden)
CREATE TABLE IF NOT EXISTS student_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pasif', 'Suresi Doldu')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE student_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own packages" ON student_packages FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can read all student packages" ON student_packages FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Admins can manage student packages" ON student_packages FOR ALL USING (get_user_role() = 'admin');

-- Çalışma kayıtları (big projesinden)
CREATE TABLE IF NOT EXISTS study_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subject TEXT NOT NULL,
  duration_min INT NOT NULL DEFAULT 0 CHECK (duration_min >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach can manage own students study logs" ON study_logs FOR ALL
  USING (coach_id = auth.uid());
CREATE POLICY "Students can read own study logs" ON study_logs FOR SELECT
  USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage all study logs" ON study_logs FOR ALL
  USING (get_user_role() = 'admin');

-- Deneme sonuçları (big projesinden)
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exam_name TEXT NOT NULL,
  correct INT NOT NULL DEFAULT 0 CHECK (correct >= 0),
  incorrect INT NOT NULL DEFAULT 0 CHECK (incorrect >= 0),
  blank INT NOT NULL DEFAULT 0 CHECK (blank >= 0),
  total_score REAL CHECK (total_score >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach can manage own students exam results" ON exam_results FOR ALL
  USING (coach_id = auth.uid());
CREATE POLICY "Students can read own exam results" ON exam_results FOR SELECT
  USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage all exam results" ON exam_results FOR ALL
  USING (get_user_role() = 'admin');

-- Mesajlar / İletişim formu (big projesinden)
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

CREATE POLICY "Anyone can insert messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Admins can read all messages" ON messages FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Students can read own messages" ON messages FOR SELECT USING (auth.uid() = target_student_id);
CREATE POLICY "Users can read own sent messages" ON messages FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Admins can update messages" ON messages FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "Admins can delete messages" ON messages FOR DELETE USING (get_user_role() = 'admin');

-- updated_at trigger fonksiyonu (eğer yoksa)
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- updated_at trigger'ları
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_study_logs_updated_at') THEN
    CREATE TRIGGER set_study_logs_updated_at
      BEFORE UPDATE ON study_logs
      FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_exam_results_updated_at') THEN
    CREATE TRIGGER set_exam_results_updated_at
      BEFORE UPDATE ON exam_results
      FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
  END IF;
END $$;

-- Performans index'leri
CREATE INDEX IF NOT EXISTS idx_coaches_status ON coaches(status);
CREATE INDEX IF NOT EXISTS idx_student_packages_student_id ON student_packages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_status ON student_packages(status);
CREATE INDEX IF NOT EXISTS idx_messages_target_student_id ON messages(target_student_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_student_id ON study_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON exam_results(student_id);

-- Örnek veriler (big projesinden)
INSERT INTO coaches (name, email, specialty, phone, bio, status, students_count, rating, experience)
VALUES
  ('Emre Demir', 'emre@pusula.com', 'TYT Matematik', '0532 111 22 33', 'İTÜ Matematik Bölümü mezunu. 5 yıl deneyimli TYT Matematik koçu.', 'Aktif', 500, 4.9, '5 Yıl'),
  ('Selin Çelik', 'selin@pusula.com', 'AYT Fen Bilimleri', '0533 222 33 44', 'ODTÜ Fizik Bölümü mezunu. 3 yıl deneyimli AYT Fen koçu.', 'Aktif', 350, 4.8, '3 Yıl'),
  ('Ahmet Korkmaz', 'ahmet@pusula.com', 'TYT Türkçe', '0534 333 44 55', 'Türk Dili ve Edebiyatı Bölümü birincisi. 4 yıl deneyimli.', 'Aktif', 420, 4.9, '4 Yıl'),
  ('Zeynep Arslan', 'zeynep@pusula.com', 'AYT Matematik', '0535 444 55 66', 'Hacettepe Matematik Bölümü yüksek lisans. 2 yıl deneyimli.', 'Aktif', 280, 4.7, '2 Yıl'),
  ('Merve Yıldız', 'merve@pusula.com', 'PDR Uzmanı', '0536 555 66 77', 'Psikolojik Danışmanlık ve Rehberlik uzmanı. 6 yıl deneyim.', 'Aktif', 600, 5.0, '6 Yıl'),
  ('Burak Özkan', 'burak@pusula.com', 'TYT Sosyal Bilimler', '0537 666 77 88', 'Tarih Bölümü mezunu, Sosyal Bilimlerde uzman koç.', 'Aktif', 310, 4.8, '3 Yıl')
ON CONFLICT (email) DO NOTHING;

INSERT INTO packages (name, price, period, description, features, is_popular)
VALUES
  ('Başlangıç', 499, '/ay', 'İlk adımı atmak isteyenler için',
   '["TYT Koçluk", "Haftalık Plan", "SMS Desteği", "2 Koç Görüşmesi"]'::jsonb, false),
  ('Standart', 999, '/ay', 'Kapsamlı hazırlık için ideal',
   '["TYT + AYT Koçluk", "Günlük Plan", "WhatsApp Desteği", "4 Koç Görüşmesi", "Deneme Analizi"]'::jsonb, true),
  ('Premium', 1499, '/ay', 'Tam destek, tam başarı',
   '["TYT + AYT + PDR", "Sınırsız Plan", "7/24 Destek", "Sınırsız Koç Görüşmesi", "Deneme Analizi", "Bireysel Motivasyon"]'::jsonb, false)
ON CONFLICT DO NOTHING;
