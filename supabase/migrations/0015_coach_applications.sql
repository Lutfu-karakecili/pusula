-- ADIM I: Koç başvuru sistemi
create table public.coach_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  university text,
  department text,
  exam_rank integer,
  motivation_note text,
  cv_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.coach_applications enable row level security;

create policy "coach_apps_insert_anyone" on public.coach_applications
  for insert with check (true);
create policy "coach_apps_admin_manage" on public.coach_applications
  for all using (public.is_admin()) with check (public.is_admin());
