-- ADIM 8: AI Rapor inceleme

alter table public.ai_conversations add column reviewed_by_coach boolean not null default false;
alter table public.ai_conversations add column coach_reviewed_at timestamptz;

create table public.ai_review_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);
alter table public.ai_review_notes enable row level security;
create policy "ai_review_notes_coach_only" on public.ai_review_notes
  for all using (coach_id = auth.uid() or public.is_admin())
  with check (coach_id = auth.uid());

create policy "ai_conv_coach_can_review" on public.ai_conversations
  for update using (public.is_coach_of(student_id) or public.is_admin())
  with check (public.is_coach_of(student_id) or public.is_admin());
