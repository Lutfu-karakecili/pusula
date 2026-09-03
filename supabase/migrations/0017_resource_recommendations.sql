-- ADIM K (a): Kaynak önerileri
create table public.resource_recommendations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  coach_id uuid not null references public.profiles(id),
  title text not null,
  subject text,
  url text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.resource_recommendations enable row level security;

create policy "resources_select" on public.resource_recommendations
  for select using (student_id = auth.uid() or coach_id = auth.uid() or public.is_admin());
create policy "resources_write_coach" on public.resource_recommendations
  for all using (coach_id = auth.uid() or public.is_admin())
  with check (coach_id = auth.uid() or public.is_admin());
