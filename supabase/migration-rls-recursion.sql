-- =============================================
-- PUSULA - RLS sonsuz özyineleme düzeltmesi (2026-08-31)
-- =============================================
-- SORUN: Polisler içinde birebir "EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin')"
--        kullanımı Postgres'te şu hataya yol açıyordu:
--        "infinite recursion detected in policy for relation "profiles""
--        Bu yüzden giris yapmis hicbir kullanici profilini okuyamiyordu
--        (admin paneline ulasilamiyordu).
-- ÇÖZÜM: SECURITY DEFINER is_admin() fonksiyonu ile RLS atlanir (owner bypass),
--        tüm admin polisleri buna geciyor. Güvenli (rol kontrolu korunur) ve idempotenttir.
-- NASIL ÇALIŞTIRILIR: Supabase Dashboard -> SQL Editor -> yapistir -> Run.
-- =============================================

-- 1) Yardimci fonksiyon (ozel yetki + RLS bypass)
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

-- 2) Eskiyi temizle (varsa)

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert coaches"   ON coaches;
DROP POLICY IF EXISTS "Admins can update coaches"   ON coaches;
DROP POLICY IF EXISTS "Admins can delete coaches"   ON coaches;
DROP POLICY IF EXISTS "Admins can insert packages"  ON packages;
DROP POLICY IF EXISTS "Admins can update packages"  ON packages;
DROP POLICY IF EXISTS "Admins can delete packages"  ON packages;
DROP POLICY IF EXISTS "Admins can read all assignments"     ON student_coaches;
DROP POLICY IF EXISTS "Admins can manage assignments"       ON student_coaches;
DROP POLICY IF EXISTS "Admins can read all student packages" ON student_packages;
DROP POLICY IF EXISTS "Admins can manage student packages"   ON student_packages;
DROP POLICY IF EXISTS "Admins can read all messages"  ON messages;
DROP POLICY IF EXISTS "Admins can update messages"    ON messages;
DROP POLICY IF EXISTS "Admins can delete messages"    ON messages;

-- 3) Yeni polisler (is_admin() ile)

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert coaches"
  ON coaches FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update coaches"
  ON coaches FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete coaches"
  ON coaches FOR DELETE
  USING (public.is_admin());

CREATE POLICY "Admins can insert packages"
  ON packages FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update packages"
  ON packages FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete packages"
  ON packages FOR DELETE
  USING (public.is_admin());

CREATE POLICY "Admins can read all assignments"
  ON student_coaches FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage assignments"
  ON student_coaches FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can read all student packages"
  ON student_packages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage student packages"
  ON student_packages FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can read all messages"
  ON messages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update messages"
  ON messages FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete messages"
  ON messages FOR DELETE
  USING (public.is_admin());

-- 4) Dogrulama (basarili ise 14 yeni admin polisi sayilmalidir)
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public' AND policyname LIKE 'Admin%'
ORDER BY tablename, policyname;