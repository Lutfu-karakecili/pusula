-- ADIM H: Ücretsiz ön görüşme rezervasyon sistemi
create table public.consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  preferred_date date,
  preferred_time text,
  note text,
  status text not null default 'pending',
  assigned_admin_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.consultation_bookings enable row level security;

create policy "bookings_insert_anyone" on public.consultation_bookings
  for insert with check (true);
create policy "bookings_admin_manage" on public.consultation_bookings
  for all using (public.is_admin()) with check (public.is_admin());
