-- ADIM F: Koç değiştirme geçmişi
create table public.coach_change_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  old_coach_id uuid references public.profiles(id),
  new_coach_id uuid not null references public.profiles(id),
  changed_at timestamptz not null default now()
);

alter table public.coach_change_history enable row level security;

create policy "coach_change_history_select" on public.coach_change_history
  for select using (student_id = auth.uid() or public.is_admin());
create policy "coach_change_history_insert" on public.coach_change_history
  for insert with check (student_id = auth.uid());
