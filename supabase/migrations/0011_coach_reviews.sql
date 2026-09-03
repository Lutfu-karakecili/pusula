-- ADIM E: Koç puanlama ve yorum sistemi
create table public.coach_reviews (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (coach_id, student_id)
);

alter table public.coach_reviews enable row level security;

create policy "reviews_select_all" on public.coach_reviews
  for select using (true);
create policy "reviews_insert_own_student" on public.coach_reviews
  for insert with check (student_id = auth.uid());
create policy "reviews_update_own_student" on public.coach_reviews
  for update using (student_id = auth.uid());

create view public.coach_rating_summary as
  select coach_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as review_count
  from public.coach_reviews group by coach_id;
