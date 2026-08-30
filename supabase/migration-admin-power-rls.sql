-- =============================================
-- PUSULA - RLS TEMİZLİĞİ + ADMIN YETKİLERİ (2026-08-31)
-- =============================================
-- SORUN 1: Canli DB'de eski şema sürümlerinden kalma isimleri farkli
--          recursive politikalar hâlâ duruyor ("infinite recursion ... profiles").
--          Belirli isimleri DROP etmek yetmiyor; bu yüzden tablolardaki
--          TÜM politikalar topluca düşürülüp dogru set yeniden kuruluyor.
-- SORUN 2: Admin yalnizca SEEKECT yapabiliyordu. Artik admin tüm profilleri
--          güncelleyebilir (rol degisimi dahil), kayit ekleyebilir ve silebilir.
-- +        profiles.email kolonu + handle_new_user trigger'a email yazimi
--          (admin paneli öğrenci e-postalarini gosterebilsin diye).
-- +        admin_delete_user fonksiyonu: koç/ögrenci auth hesabini da siler
--          (cascade ile). SADECE admin tarafindan cagrilabilir.
-- NASIL: Supabase Dashboard -> SQL Editor -> yapistir -> Run.
-- Idempotenttir.
-- =============================================

-- 1) Yardimci fonksiyon (RLS bypass, owner yetkisi)
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

-- 2) Tum tablolardaki TUM RLS politikalarini dusur
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'coaches', 'packages', 'student_coaches', 'student_packages', 'messages')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 3) profiles.email kolonu + geri dolum
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
UPDATE profiles p
  SET email = u.email
  FROM auth.users u
  WHERE u.id = p.id AND (p.email IS NULL OR p.email = '');

-- 4) handle_new_user trigger duzenle (email yazsin)
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

-- 5) PROFILES  (admin algherel UPDATE/INSERT/DELETE icerir)
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

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

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    (auth.uid() = id AND role IN ('student', 'coach'))
    OR public.is_admin()
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete all profiles"
  ON profiles FOR DELETE
  USING (public.is_admin());

-- 6) COACHES
CREATE POLICY "Anyone can read coaches"
  ON coaches FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert coaches"
  ON coaches FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update coaches"
  ON coaches FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete coaches"
  ON coaches FOR DELETE
  USING (public.is_admin());

-- 7) PACKAGES
CREATE POLICY "Anyone can read packages"
  ON packages FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert packages"
  ON packages FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update packages"
  ON packages FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete packages"
  ON packages FOR DELETE
  USING (public.is_admin());

-- 8) STUDENT_COACHES
CREATE POLICY "Students can read own assignment"
  ON student_coaches FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Coaches can read own students"
  ON student_coaches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      WHERE c.id = coach_id
        AND c.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Admins can read all assignments"
  ON student_coaches FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage assignments"
  ON student_coaches FOR ALL
  USING (public.is_admin());

-- 9) STUDENT_PACKAGES
CREATE POLICY "Students can read own packages"
  ON student_packages FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can read all student packages"
  ON student_packages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage student packages"
  ON student_packages FOR ALL
  USING (public.is_admin());

-- 10) MESSAGES
CREATE POLICY "Anyone can insert messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Admins can read all messages"
  ON messages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Students can read own messages"
  ON messages FOR SELECT
  USING (auth.uid() = target_student_id);

CREATE POLICY "Users can read own sent messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Admins can update messages"
  ON messages FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Students can mark own messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = target_student_id)
  WITH CHECK (auth.uid() = target_student_id);

CREATE POLICY "Admins can delete messages"
  ON messages FOR DELETE
  USING (public.is_admin());

-- 11) admin_delete_user: profil + auth hesabini birlikte siler (sadece admin)
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

-- 12) Dogrulama
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'coaches', 'packages', 'student_coaches', 'student_packages', 'messages')
ORDER BY tablename, policyname;