-- 0020: Kayıt (signUp) sırasında profiles_pkey duplicate hatası düzeltmesi.
--
-- Belirti: Yeni kullanıcı kaydında şu 500 hatası düşüyordu:
--   duplicate key value violates unique constraint "profiles_pkey"
--   Key (id)=(...) already exists.
--
-- Neden: handle_new_user trigger'ı auth.users'a insert sonrası çalışıyordu ve
-- bazen aynı id ile profiles/students'a birden fazla kez insert deniyordu.
-- Çözüm: insert'lere ON CONFLICT DO NOTHING ekleyerek fonksiyonu idempotent
-- yaptık. Böylece satır zaten varsa ikinci insert hata yerine hiçbir şey yapmaz.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;

  if coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student') = 'student' then
    insert into public.students (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;
