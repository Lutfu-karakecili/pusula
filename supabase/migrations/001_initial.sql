-- =============================================
-- PUSULA — YKS Koçluk Platformu
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

-- AI Chat Index
CREATE INDEX IF NOT EXISTS idx_ai_chats_user ON ai_chats(user_id, created_at DESC);

-- =============================================
-- RLS Politikaları
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;

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

-- =============================================
-- Trigger: profiles otomatik olusturma
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
