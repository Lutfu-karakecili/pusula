-- ADIM J: Veli rolü ve veli-öğrenci bağlantısı

alter type public.user_role add value if not exists 'parent';

create table public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

alter table public.parent_student_links enable row level security;

create policy "parent_links_select" on public.parent_student_links
  for select using (parent_id = auth.uid() or public.is_admin() or student_id = auth.uid());
create policy "parent_links_admin_write" on public.parent_student_links
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.is_parent_of(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_student_links
    where student_id = p_student_id and parent_id = auth.uid()
  );
$$;

create policy "homework_select_parent" on public.homework
  for select using (public.is_parent_of(student_id));
create policy "plans_select_parent" on public.plans
  for select using (public.is_parent_of(student_id));
create policy "meetings_select_parent" on public.meetings
  for select using (public.is_parent_of(student_id));
create policy "exam_sessions_select_parent" on public.exam_sessions
  for select using (public.is_parent_of(student_id));

