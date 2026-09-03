-- 0019: Koç, kendi atadığı öğrencilerin profilini (ad, avatar vb.) görebilsin.
-- Koç dashboard'da "Öğrencilerim" listesinde öğrenci satırları geliyor ama
-- profiles RLS'i (profiles_select_own_or_admin: id=auth.uid() veya is_admin veya role='coach')
-- öğrenci profilini koça açmadığı için embed prosilde isim boş dönebiliyordu.
-- Bu politika, koçun kendi öğrencisi olan profillere de SELECT erişimi verir.

drop policy if exists "profiles_select_own_or_admin" on public.profiles;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_admin()
    or role = 'coach'
    or exists (
      select 1 from public.students s
      where s.coach_id = auth.uid() and s.id = profiles.id
    )
  );
