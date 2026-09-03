-- ADIM K (b): Gelişim seminerleri
create table public.seminars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  join_url text,
  created_at timestamptz not null default now()
);

alter table public.seminars enable row level security;

create policy "seminars_read_all" on public.seminars
  for select using (true);
create policy "seminars_admin_write" on public.seminars
  for all using (public.is_admin()) with check (public.is_admin());
