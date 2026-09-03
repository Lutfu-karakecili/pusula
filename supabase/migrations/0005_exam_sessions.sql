-- ADIM 7: Sınav Oturumları tablosu

create table public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  exam_name text not null,
  taken_at timestamptz not null default now(),
  duration_minutes int,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  blank_count int not null default 0,
  net numeric(5,2) generated always as (correct_count - wrong_count * 0.25) stored,
  success_rate numeric(5,2)
);

alter table public.exam_sessions enable row level security;
create policy "exam_sessions_select" on public.exam_sessions
  for select using (student_id = auth.uid() or public.is_admin() or public.is_coach_of(student_id));
create policy "exam_sessions_write" on public.exam_sessions
  for all using (student_id = auth.uid() or public.is_admin() or public.is_coach_of(student_id))
  with check (student_id = auth.uid() or public.is_admin() or public.is_coach_of(student_id));
create index idx_exam_sessions_student on public.exam_sessions(student_id, taken_at desc);
