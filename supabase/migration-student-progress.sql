-- =============================================
-- PUSULA - OGRENCI ILERLEME TAKIBI (2026-08-31)
-- =============================================
-- Koç, kendi öğrencilerine çalışma kaydı ve deneme sonucu girer;
-- öğrenci ve admin görür. Idempotenttir.
-- NASIL: Supabase Dashboard -> SQL Editor -> yapistir -> Run.
-- =============================================

-- 1) STUDY_LOGS (çalışma kaydı)
CREATE TABLE IF NOT EXISTS study_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subject TEXT NOT NULL,
  duration_min INT NOT NULL DEFAULT 0 CHECK (duration_min >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can manage own students study logs" ON study_logs;
CREATE POLICY "Coaches can manage own students study logs"
  ON study_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      WHERE c.id = coach_id
        AND c.email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN student_coaches sc ON sc.coach_id = c.id
      WHERE c.id = coach_id
        AND c.email = auth.jwt() ->> 'email'
        AND sc.student_id = student_id
    )
  );

DROP POLICY IF EXISTS "Students can read own study logs" ON study_logs;
CREATE POLICY "Students can read own study logs"
  ON study_logs FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage all study logs" ON study_logs;
CREATE POLICY "Admins can manage all study logs"
  ON study_logs FOR ALL
  USING (
    public.is_admin()
  );

-- 2) EXAM_RESULTS (deneme sonucu)
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
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

DROP POLICY IF EXISTS "Coaches can manage own students exam results" ON exam_results;
CREATE POLICY "Coaches can manage own students exam results"
  ON exam_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      WHERE c.id = coach_id
        AND c.email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN student_coaches sc ON sc.coach_id = c.id
      WHERE c.id = coach_id
        AND c.email = auth.jwt() ->> 'email'
        AND sc.student_id = student_id
    )
  );

DROP POLICY IF EXISTS "Students can read own exam results" ON exam_results;
CREATE POLICY "Students can read own exam results"
  ON exam_results FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage all exam results" ON exam_results;
CREATE POLICY "Admins can manage all exam results"
  ON exam_results FOR ALL
  USING (
    public.is_admin()
  );

-- 3) Dogrulama
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('study_logs', 'exam_results')
ORDER BY tablename, policyname;