-- =============================================
-- Eksik tabloları oluştur
-- student_coaches ve student_packages
-- Supabase Dashboard > SQL Editor > bu dosyayı yapıştır > Run
-- =============================================

-- 1. STUDENT_COACHES tablosu
CREATE TABLE IF NOT EXISTS student_coaches (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id BIGINT REFERENCES coaches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id)
);

ALTER TABLE student_coaches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can read own assignment" ON student_coaches;
CREATE POLICY "Students can read own assignment"
  ON student_coaches FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can read all assignments" ON student_coaches;
CREATE POLICY "Admins can read all assignments"
  ON student_coaches FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage assignments" ON student_coaches;
CREATE POLICY "Admins can manage assignments"
  ON student_coaches FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. STUDENT_PACKAGES tablosu
CREATE TABLE IF NOT EXISTS student_packages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  package_id BIGINT REFERENCES packages(id) ON DELETE SET NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pasif', 'Suresi Doldu')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE student_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can read own packages" ON student_packages;
CREATE POLICY "Students can read own packages"
  ON student_packages FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can read all student packages" ON student_packages;
CREATE POLICY "Admins can read all student packages"
  ON student_packages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage student packages" ON student_packages;
CREATE POLICY "Admins can manage student packages"
  ON student_packages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Index'ler
CREATE INDEX IF NOT EXISTS idx_student_coaches_student_id ON student_coaches(student_id);
CREATE INDEX IF NOT EXISTS idx_student_coaches_coach_id ON student_coaches(coach_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_student_id ON student_packages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_status ON student_packages(status);
CREATE INDEX IF NOT EXISTS idx_student_packages_package_id ON student_packages(package_id);
