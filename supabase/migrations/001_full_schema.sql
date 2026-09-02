-- =============================================
-- PUSULA v2 — YKS Koçluk Platformu
-- Tüm Tablolar + RLS Politikaları
-- =============================================

-- Profiles tablosu (auth.users ile 1:1)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'coach', 'student')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Students tablosu (öğrenci-koç ilişkisi)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_score INTEGER DEFAULT 0,
  current_score INTEGER DEFAULT 0,
  grade INTEGER DEFAULT 12,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Koçlar tablosu
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

-- Paketler tablosu
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

-- Haftalık Planlar
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  subjects JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ödev Takibi
CREATE TABLE IF NOT EXISTS homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  subject TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  score INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Görüşmeler (Zoom entegrasyonu ile)
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  meeting_date TIMESTAMPTZ NOT NULL,
  duration_min INTEGER DEFAULT 30,
  zoom_link TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Koç Notları (Değerlendirme)
CREATE TABLE IF NOT EXISTS coaching_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('academic', 'behavioral', 'motivational', 'general')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Sohbet Geçmişi
CREATE TABLE IF NOT EXISTS ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Deneme Sonuçları
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exam_name TEXT NOT NULL,
  correct INT NOT NULL DEFAULT 0,
  incorrect INT NOT NULL DEFAULT 0,
  blank INT NOT NULL DEFAULT 0,
  total_score REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Çalışma Kayıtları
CREATE TABLE IF NOT EXISTS study_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subject TEXT NOT NULL,
  duration_min INT NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mesajlar
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

-- =============================================
-- Index'ler
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_coach_id ON students(coach_id);
CREATE INDEX IF NOT EXISTS idx_plans_student_id ON plans(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_student_id ON homework(student_id);
CREATE INDEX IF NOT EXISTS idx_meetings_student_id ON meetings(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_notes_student_id ON coaching_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_user ON ai_chats(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_target ON messages(target_student_id);

-- =============================================
-- RLS Politikaları
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Helper fonksiyonu
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Coach can view own students" ON profiles FOR SELECT USING (
  get_user_role() = 'coach' AND id IN (SELECT user_id FROM students WHERE coach_id = auth.uid())
);
CREATE POLICY "Admin can insert profiles" ON profiles FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "Admin can update profiles" ON profiles FOR UPDATE USING (get_user_role() = 'admin' OR id = auth.uid());
CREATE POLICY "Admin can delete profiles" ON profiles FOR DELETE USING (get_user_role() = 'admin');

-- Students
CREATE POLICY "Coach can view own students" ON students FOR SELECT USING (coach_id = auth.uid());
CREATE POLICY "Student can view own" ON students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin can view all students" ON students FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Admin can manage students" ON students FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Coach can manage own students" ON students FOR ALL USING (coach_id = auth.uid());

-- Coaches
CREATE POLICY "Anyone can read coaches" ON coaches FOR SELECT USING (true);
CREATE POLICY "Admins can manage coaches" ON coaches FOR ALL USING (get_user_role() = 'admin');

-- Packages
CREATE POLICY "Anyone can read packages" ON packages FOR SELECT USING (true);
CREATE POLICY "Admins can manage packages" ON packages FOR ALL USING (get_user_role() = 'admin');

-- Plans
CREATE POLICY "Coach can manage own plans" ON plans FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "Student can view own plans" ON plans FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Admin can manage all plans" ON plans FOR ALL USING (get_user_role() = 'admin');

-- Homework
CREATE POLICY "Coach can manage own homework" ON homework FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "Student can view own homework" ON homework FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Student can update own homework" ON homework FOR UPDATE USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Admin can manage all homework" ON homework FOR ALL USING (get_user_role() = 'admin');

-- Meetings
CREATE POLICY "Coach can manage own meetings" ON meetings FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "Student can view own meetings" ON meetings FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Admin can manage all meetings" ON meetings FOR ALL USING (get_user_role() = 'admin');

-- Coaching Notes
CREATE POLICY "Coach can manage own notes" ON coaching_notes FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "Student can view own notes" ON coaching_notes FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Admin can manage all notes" ON coaching_notes FOR ALL USING (get_user_role() = 'admin');

-- AI Chats
CREATE POLICY "Users can manage own chats" ON ai_chats FOR ALL USING (user_id = auth.uid());

-- Exam Results
CREATE POLICY "Coach can manage own students exam results" ON exam_results FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "Students can read own exam results" ON exam_results FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage all exam results" ON exam_results FOR ALL USING (get_user_role() = 'admin');

-- Study Logs
CREATE POLICY "Coach can manage own students study logs" ON study_logs FOR ALL USING (coach_id = auth.uid());
CREATE POLICY "Students can read own study logs" ON study_logs FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage all study logs" ON study_logs FOR ALL USING (get_user_role() = 'admin');

-- Messages
CREATE POLICY "Anyone can insert messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Admins can read all messages" ON messages FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "Students can read own messages" ON messages FOR SELECT USING (auth.uid() = target_student_id);

-- =============================================
-- Trigger: profiles otomatik oluşturma
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Trigger: updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =============================================
-- Örnek veriler
-- =============================================

INSERT INTO coaches (name, email, specialty, phone, bio, status, students_count, rating, experience)
VALUES
  ('Emre Demir', 'emre@pusula.com', 'TYT Matematik', '0532 111 22 33', 'İTÜ Matematik Bölümü mezunu. 5 yıl deneyimli.', 'Aktif', 500, 4.9, '5 Yıl'),
  ('Selin Çelik', 'selin@pusula.com', 'AYT Fen Bilimleri', '0533 222 33 44', 'ODTÜ Fizik Bölümü mezunu. 3 yıl deneyimli.', 'Aktif', 350, 4.8, '3 Yıl'),
  ('Ahmet Korkmaz', 'ahmet@pusula.com', 'TYT Türkçe', '0534 333 44 55', 'Türk Dili ve Edebiyatı Bölümü birincisi.', 'Aktif', 420, 4.9, '4 Yıl')
ON CONFLICT (email) DO NOTHING;

INSERT INTO packages (name, price, period, description, features, is_popular)
VALUES
  ('Başlangıç', 499, '/ay', 'İlk adımı atmak isteyenler için',
   '["TYT Koçluk", "Haftalık Plan", "SMS Desteği", "2 Koç Görüşmesi"]'::jsonb, false),
  ('Standart', 999, '/ay', 'Kapsamlı hazırlık için ideal',
   '["TYT + AYT Koçluk", "Günlük Plan", "WhatsApp Desteği", "4 Koç Görüşmesi", "Deneme Analizi"]'::jsonb, true),
  ('Premium', 1499, '/ay', 'Tam destek, tam başarı',
   '["TYT + AYT + PDR", "Sınırsız Plan", "7/24 Destek", "Sınırsız Koç Görüşmesi"]'::jsonb, false)
ON CONFLICT DO NOTHING;
