-- =============================================
-- PUSULA - HAFTALIK PLAN (koç -> öğrenci) (2026-08-31)
-- =============================================
-- Koç, kendi öğrencilerine haftalık plan atayabilir; öğrenci ve admin görür.
-- NASIL: Supabase Dashboard -> SQL Editor -> yapistir -> Run. Idempotenttir.
-- =============================================

-- 1) Tablo
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL DEFAULT CURRENT_DATE,
  plan_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Tamamlandı')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can manage own students plans" ON weekly_plans;
CREATE POLICY "Coaches can manage own students plans"
  ON weekly_plans FOR ALL
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

DROP POLICY IF EXISTS "Students can read own weekly plans" ON weekly_plans;
CREATE POLICY "Students can read own weekly plans"
  ON weekly_plans FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can manage all weekly plans" ON weekly_plans;
CREATE POLICY "Admins can manage all weekly plans"
  ON weekly_plans FOR ALL
  USING (
    public.is_admin()
  );

-- 2) Dogrulama
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'weekly_plans'
ORDER BY policyname;