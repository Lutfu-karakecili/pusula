-- ADIM G: Paket, abonelik ve ödeme sistemi

create type public.subscription_status as enum ('active','expired','cancelled','pending_payment');

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_months int,
  price numeric(10,2) not null,
  discounted_price numeric(10,2),
  features text[] not null default '{}',
  is_popular boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.packages enable row level security;

create policy "packages_read_all" on public.packages
  for select using (true);
create policy "packages_admin_write" on public.packages
  for all using (public.is_admin()) with check (public.is_admin());

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  package_id uuid not null references public.packages(id),
  coach_id uuid references public.profiles(id),
  status public.subscription_status not null default 'pending_payment',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select" on public.subscriptions
  for select using (student_id = auth.uid() or public.is_admin() or coach_id = auth.uid());
create policy "subscriptions_admin_write" on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  amount numeric(10,2) not null,
  provider text not null default 'iyzico',
  provider_payment_id text,
  status text not null default 'pending',
  raw_response jsonb,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments_select_own_or_admin" on public.payments
  for select using (
    public.is_admin() or exists (
      select 1 from public.subscriptions s where s.id = subscription_id and s.student_id = auth.uid()
    )
  );
