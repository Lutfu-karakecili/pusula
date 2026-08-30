-- =============================================
-- PUSULA - KOÇ ROLÜ migration (2026-08-31)
-- =============================================
-- Ne yapar:
--   1) profiles.role CHECK constraint'ine 'coach' ekler (bu olmadan
--      role='coach' profilleri kaydedilemez).
--   2) Koçların yalnızca kendi atandıkları öğrencileri (student_coaches
--      ve öğrenci profilleri) görebilmesi için 2 yeni RLS politikası.
-- NASIL ÇALIŞTIRILIR: Supabase Dashboard -> SQL Editor -> yapistir -> Run.
-- Idempotenttir (DROP IF EXISTS + ON CONFLICT üzerinden güvenli).
-- =============================================

-- 1) role constraint'e 'coach' ekle (varsa yeniden kur)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'admin', 'coach'));

-- 2) Koç RLS politikaları
DROP POLICY IF EXISTS "Coaches can read own students profiles" ON profiles;
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

DROP POLICY IF EXISTS "Coaches can read own students" ON student_coaches;
CREATE POLICY "Coaches can read own students"
  ON student_coaches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      WHERE c.id = coach_id
        AND c.email = auth.jwt() ->> 'email'
    )
  );

-- 3) Dogrulama: koç politikalari 2 adet olmali
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND policyname LIKE 'Coach%'
ORDER BY tablename, policyname;

-- NOT: Koç hesaplari (auth.users + profiles.role='coach') bu migration
-- SONRASI su komutla olusturulur:
--   node scripts/create-coaches.mjs