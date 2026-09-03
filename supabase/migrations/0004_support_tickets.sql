-- ADIM 6: Destek Merkezi tablosu + storage

create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create sequence if not exists support_ticket_seq;

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticket_no text not null unique default ('T-' || lpad(nextval('support_ticket_seq')::text, 6, '0')),
  issue_type text not null,
  description text not null,
  attachment_urls text[] not null default '{}',
  status public.ticket_status not null default 'open',
  admin_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;
create policy "tickets_own_or_admin" on public.support_tickets
  for select using (user_id = auth.uid() or public.is_admin());
create policy "tickets_insert_own" on public.support_tickets
  for insert with check (user_id = auth.uid());
create policy "tickets_update_admin" on public.support_tickets
  for update using (public.is_admin());
create trigger trg_support_tickets_updated before update on public.support_tickets
  for each row execute function public.set_updated_at();

-- Storage bucket
insert into storage.buckets (id, name, public) values ('support-attachments', 'support-attachments', false)
  on conflict (id) do nothing;

create policy "support_attachments_select" on storage.objects
  for select using (bucket_id = 'support-attachments' and (
    auth.uid() = owner or public.is_admin()
  ));
create policy "support_attachments_insert" on storage.objects
  for insert with check (bucket_id = 'support-attachments' and auth.uid() is not null);
create policy "support_attachments_update" on storage.objects
  for update using (bucket_id = 'support-attachments' and (auth.uid() = owner or public.is_admin()));
create policy "support_attachments_delete" on storage.objects
  for delete using (bucket_id = 'support-attachments' and (auth.uid() = owner or public.is_admin()));
