-- ============================================================================
-- PUSULA — YKS Koçluk Platformu
-- Migration 0001: Çekirdek şema (profiles, students, plans, homework,
--                  meetings, coaching_notes) + RLS politikaları
-- Not: Kimlik doğrulama Supabase'in yerleşik `auth.users` tablosu üzerinden
--      yürütülür; ayrıca bir `users` tablosu oluşturulmaz. `profiles` tablosu
--      auth.users'a 1:1 genişleme olarak tasarlanmıştır.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUM tipleri
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'coach', 'student');
create type public.homework_status as enum ('pending', 'submitted', 'reviewed', 'late');
create type public.meeting_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type public.plan_item_status as enum ('todo', 'in_progress', 'done', 'skipped');

-- ---------------------------------------------------------------------------
-- 1) profiles — her auth.users kaydına karşılık gelen rol/profil bilgisi
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'auth.users genişlemesi: rol ve genel profil bilgisi (admin/coach/student ortak).';

-- ---------------------------------------------------------------------------
-- 2) students — sadece role='student' olan profiller için YKS'ye özel alanlar
-- ---------------------------------------------------------------------------
create table public.students (
  id uuid primary key references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  target_field text check (target_field in ('sayisal', 'esit_agirlik', 'sozel', 'dil')),
  target_score numeric(5,2),
  target_universities text[],
  grade text, -- '11', '12', 'mezun'
  school_name text,
  net_history jsonb not null default '[]'::jsonb, -- [{date, tyt_net, ayt_net, exam_name}]
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.students is 'YKS öğrencisine özel veriler; profiles.id ile 1:1.';

-- ---------------------------------------------------------------------------
-- 3) plans — haftalık çalışma planı (konu bazlı kalem listesi plan_items ile)
-- ---------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  week_start date not null,
  title text not null default 'Haftalık Çalışma Planı',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, week_start)
);

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  subject text not null,           -- örn: Matematik, Fizik, Türkçe
  topic text not null,             -- örn: Türev, Optik, Paragraf
  exam_type text not null default 'TYT' check (exam_type in ('TYT', 'AYT')),
  target_question_count int not null default 0,
  status public.plan_item_status not null default 'todo',
  day_of_week smallint check (day_of_week between 1 and 7),
  created_at timestamptz not null default now()
);

comment on table public.plans is 'Öğrenci başına haftalık plan konteyneri.';
comment on table public.plan_items is 'Plan içindeki konu/soru hedefi kalemleri.';

-- ---------------------------------------------------------------------------
-- 4) homework — ödev takvimi
-- ---------------------------------------------------------------------------
create table public.homework (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  plan_item_id uuid references public.plan_items(id) on delete set null,
  title text not null,
  description text,
  subject text not null,
  due_date date not null,
  status public.homework_status not null default 'pending',
  submitted_at timestamptz,
  submission_note text,
  coach_feedback text,
  score numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.homework is 'Konu bazlı ödev + teslim + koç geri bildirimi.';

-- ---------------------------------------------------------------------------
-- 5) meetings — birebir görüşmeler (Zoom entegrasyonu)
-- ---------------------------------------------------------------------------
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Koçluk Görüşmesi',
  scheduled_at timestamptz not null,
  duration_minutes int not null default 45,
  zoom_join_url text,
  zoom_start_url text,
  zoom_meeting_id text,
  status public.meeting_status not null default 'scheduled',
  agenda text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.meetings is 'Öğrenci-koç birebir görüşmeleri; Zoom link alanları API tarafından doldurulur.';

-- ---------------------------------------------------------------------------
-- 6) coaching_notes — koç değerlendirme notları (öğrenciye görünür/gizli)
-- ---------------------------------------------------------------------------
create table public.coaching_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  category text not null default 'genel' check (category in ('genel', 'motivasyon', 'akademik', 'davranis', 'aile')),
  content text not null,
  visible_to_student boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.coaching_notes is 'Koçun öğrenci hakkında tuttuğu değerlendirme notları; varsayılan olarak öğrenciden gizli.';

-- ---------------------------------------------------------------------------
-- 7) ai_conversations / ai_messages — AI sohbet geçmişi
-- ---------------------------------------------------------------------------
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null default 'Yeni Sohbet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at otomasyonu
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_students_updated before update on public.students
  for each row execute function public.set_updated_at();
create trigger trg_plans_updated before update on public.plans
  for each row execute function public.set_updated_at();
create trigger trg_homework_updated before update on public.homework
  for each row execute function public.set_updated_at();
create trigger trg_meetings_updated before update on public.meetings
  for each row execute function public.set_updated_at();
create trigger trg_coaching_notes_updated before update on public.coaching_notes
  for each row execute function public.set_updated_at();
create trigger trg_ai_conversations_updated before update on public.ai_conversations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Yeni kullanıcı kaydında otomatik profil oluşturma
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );

  if coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student') = 'student' then
    insert into public.students (id) values (new.id);
  end if;

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Yardımcı fonksiyonlar (RLS politikalarında recursion'dan kaçınmak için
-- SECURITY DEFINER ile auth.uid()'nin rolünü/koçluk ilişkisini kontrol eder)
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role() = 'admin';
$$;

create or replace function public.is_coach_of(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students s
    where s.id = p_student_id and s.coach_id = auth.uid()
  );
$$;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.homework enable row level security;
alter table public.meetings enable row level security;
alter table public.coaching_notes enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

-- profiles ------------------------------------------------------------------
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin() or role = 'coach');
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_insert" on public.profiles
  for insert with check (public.is_admin() or id = auth.uid());
create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());

-- students --------------------------------------------------------------
create policy "students_select" on public.students
  for select using (
    id = auth.uid() or coach_id = auth.uid() or public.is_admin()
  );
create policy "students_update" on public.students
  for update using (
    id = auth.uid() or coach_id = auth.uid() or public.is_admin()
  );
create policy "students_admin_write" on public.students
  for insert with check (public.is_admin() or id = auth.uid());
create policy "students_admin_delete" on public.students
  for delete using (public.is_admin());

-- plans / plan_items ------------------------------------------------------
create policy "plans_select" on public.plans
  for select using (
    student_id = auth.uid() or coach_id = auth.uid() or public.is_admin()
    or public.is_coach_of(student_id)
  );
create policy "plans_write_coach_admin" on public.plans
  for all using (public.is_admin() or public.is_coach_of(student_id) or coach_id = auth.uid())
  with check (public.is_admin() or public.is_coach_of(student_id) or coach_id = auth.uid());

create policy "plan_items_select" on public.plan_items
  for select using (
    exists (select 1 from public.plans p where p.id = plan_id
      and (p.student_id = auth.uid() or p.coach_id = auth.uid() or public.is_admin()))
  );
create policy "plan_items_write" on public.plan_items
  for all using (
    exists (select 1 from public.plans p where p.id = plan_id
      and (p.coach_id = auth.uid() or public.is_admin()))
  ) with check (
    exists (select 1 from public.plans p where p.id = plan_id
      and (p.coach_id = auth.uid() or public.is_admin()))
  );

-- homework ------------------------------------------------------------------
create policy "homework_select" on public.homework
  for select using (
    student_id = auth.uid() or coach_id = auth.uid() or public.is_admin()
    or public.is_coach_of(student_id)
  );
create policy "homework_write_coach_admin" on public.homework
  for insert with check (public.is_admin() or public.is_coach_of(student_id) or coach_id = auth.uid());
create policy "homework_update" on public.homework
  for update using (
    student_id = auth.uid() or coach_id = auth.uid() or public.is_admin()
    or public.is_coach_of(student_id)
  );
create policy "homework_delete" on public.homework
  for delete using (public.is_admin() or coach_id = auth.uid());

-- meetings --------------------------------------------------------------
create policy "meetings_select" on public.meetings
  for select using (
    student_id = auth.uid() or coach_id = auth.uid() or public.is_admin()
  );
create policy "meetings_write" on public.meetings
  for all using (public.is_admin() or coach_id = auth.uid())
  with check (public.is_admin() or coach_id = auth.uid());

-- coaching_notes ----------------------------------------------------------
-- Öğrenci yalnızca visible_to_student=true olan notları görebilir.
create policy "coaching_notes_select" on public.coaching_notes
  for select using (
    public.is_admin()
    or coach_id = auth.uid()
    or (student_id = auth.uid() and visible_to_student = true)
  );
create policy "coaching_notes_write" on public.coaching_notes
  for all using (public.is_admin() or coach_id = auth.uid())
  with check (public.is_admin() or coach_id = auth.uid());

-- ai_conversations / ai_messages -------------------------------------------
create policy "ai_conv_select" on public.ai_conversations
  for select using (student_id = auth.uid() or public.is_admin() or public.is_coach_of(student_id));
create policy "ai_conv_write" on public.ai_conversations
  for all using (student_id = auth.uid() or public.is_admin())
  with check (student_id = auth.uid() or public.is_admin());

create policy "ai_msg_select" on public.ai_messages
  for select using (
    exists (select 1 from public.ai_conversations c where c.id = conversation_id
      and (c.student_id = auth.uid() or public.is_admin() or public.is_coach_of(c.student_id)))
  );
create policy "ai_msg_write" on public.ai_messages
  for insert with check (
    exists (select 1 from public.ai_conversations c where c.id = conversation_id
      and (c.student_id = auth.uid() or public.is_admin()))
  );

-- ---------------------------------------------------------------------------
-- Indexler
-- ---------------------------------------------------------------------------
create index idx_students_coach on public.students(coach_id);
create index idx_plans_student_week on public.plans(student_id, week_start desc);
create index idx_homework_student_due on public.homework(student_id, due_date);
create index idx_homework_coach on public.homework(coach_id);
create index idx_meetings_student on public.meetings(student_id, scheduled_at desc);
create index idx_meetings_coach on public.meetings(coach_id, scheduled_at desc);
create index idx_notes_student on public.coaching_notes(student_id);
create index idx_ai_conv_student on public.ai_conversations(student_id);
create index idx_ai_msg_conv on public.ai_messages(conversation_id, created_at);
