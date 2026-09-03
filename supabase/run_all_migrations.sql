-- ============================================================================
-- TÜM MIGRATION'LARI TEK SEFERDE UYGULA
-- Supabase Dashboard > SQL Editor > Bu dosyayı yapıştır > Run
-- ============================================================================

-- ============================================================================
-- 0001_init.sql
-- ============================================================================

create extension if not exists "pgcrypto";

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'coach', 'student');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.homework_status AS ENUM ('pending', 'submitted', 'reviewed', 'late');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.meeting_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.plan_item_status AS ENUM ('todo', 'in_progress', 'done', 'skipped');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- profiles (zaten varsa atla)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- students
CREATE TABLE IF NOT EXISTS public.students (
  id uuid primary key references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  target_field text check (target_field in ('sayisal', 'esit_agirlik', 'sozel', 'dil')),
  target_score numeric(5,2),
  target_universities text[],
  grade text,
  school_name text,
  net_history jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- plans
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  week_start date not null,
  title text not null default 'Haftalık Çalışma Planı',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, week_start)
);

-- plan_items
CREATE TABLE IF NOT EXISTS public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  subject text not null,
  topic text not null,
  exam_type text not null default 'TYT' check (exam_type in ('TYT', 'AYT')),
  target_question_count int not null default 0,
  status public.plan_item_status not null default 'todo',
  day_of_week smallint check (day_of_week between 1 and 7),
  created_at timestamptz not null default now()
);

-- homework
CREATE TABLE IF NOT EXISTS public.homework (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  plan_item_id uuid references public.plan_items(id) on delete set null,
  title text not null,
  description text,
  subject text not null,
  due_date date not null,
  status public.homework_status not null default 'pending',
  submitted_at timestamptz,
  submission_note text,
  coach_feedback text,
  score numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- meetings
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Koçluk Görüşmesi',
  scheduled_at timestamptz not null,
  duration_minutes int not null default 45,
  zoom_join_url text,
  zoom_start_url text,
  zoom_meeting_id text,
  status public.meeting_status not null default 'scheduled',
  agenda text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- coaching_notes
CREATE TABLE IF NOT EXISTS public.coaching_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  category text not null default 'genel' check (category in ('genel', 'motivasyon', 'akademik', 'davranis', 'aile')),
  content text not null,
  visible_to_student boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ai_conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null default 'Yeni Sohbet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ai_messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

DO $$ BEGIN CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TRIGGER trg_homework_updated BEFORE UPDATE ON public.homework FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TRIGGER trg_meetings_updated BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TRIGGER trg_coaching_notes_updated BEFORE UPDATE ON public.coaching_notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TRIGGER trg_ai_conversations_updated BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::text, 'student'),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );

  IF COALESCE((new.raw_user_meta_data->>'role')::text, 'student') = 'student' THEN
    INSERT INTO public.students (id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper functions
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_coach_of(p_student_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = p_student_id AND s.coach_id = auth.uid()
  );
$$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$ BEGIN CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin() OR role = 'coach'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE USING (id = auth.uid() OR public.is_admin()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "profiles_admin_insert" ON public.profiles FOR INSERT WITH CHECK (public.is_admin() OR id = auth.uid()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "profiles_admin_delete" ON public.profiles FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Students policies
DO $$ BEGIN CREATE POLICY "students_select" ON public.students FOR SELECT USING (id = auth.uid() OR coach_id = auth.uid() OR public.is_admin()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "students_update" ON public.students FOR UPDATE USING (id = auth.uid() OR coach_id = auth.uid() OR public.is_admin()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "students_admin_write" ON public.students FOR INSERT WITH CHECK (public.is_admin() OR id = auth.uid()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "students_admin_delete" ON public.students FOR DELETE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Plans policies
DO $$ BEGIN CREATE POLICY "plans_select" ON public.plans FOR SELECT USING (student_id = auth.uid() OR coach_id = auth.uid() OR public.is_admin() OR public.is_coach_of(student_id)); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "plans_write_coach_admin" ON public.plans FOR ALL USING (public.is_admin() OR public.is_coach_of(student_id) OR coach_id = auth.uid()) WITH CHECK (public.is_admin() OR public.is_coach_of(student_id) OR coach_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Plan items policies
DO $$ BEGIN CREATE POLICY "plan_items_select" ON public.plan_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND (p.student_id = auth.uid() OR p.coach_id = auth.uid() OR public.is_admin()))); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "plan_items_write" ON public.plan_items FOR ALL USING (EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND (p.coach_id = auth.uid() OR public.is_admin()))) WITH CHECK (EXISTS (SELECT 1 FROM public.plans p WHERE p.id = plan_id AND (p.coach_id = auth.uid() OR public.is_admin()))); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Homework policies
DO $$ BEGIN CREATE POLICY "homework_select" ON public.homework FOR SELECT USING (student_id = auth.uid() OR coach_id = auth.uid() OR public.is_admin() OR public.is_coach_of(student_id)); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "homework_write_coach_admin" ON public.homework FOR INSERT WITH CHECK (public.is_admin() OR public.is_coach_of(student_id) OR coach_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "homework_update" ON public.homework FOR UPDATE USING (student_id = auth.uid() OR coach_id = auth.uid() OR public.is_admin() OR public.is_coach_of(student_id)); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "homework_delete" ON public.homework FOR DELETE USING (public.is_admin() OR coach_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Meetings policies
DO $$ BEGIN CREATE POLICY "meetings_select" ON public.meetings FOR SELECT USING (student_id = auth.uid() OR coach_id = auth.uid() OR public.is_admin()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "meetings_write" ON public.meetings FOR ALL USING (public.is_admin() OR coach_id = auth.uid()) WITH CHECK (public.is_admin() OR coach_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Coaching notes policies
DO $$ BEGIN CREATE POLICY "coaching_notes_select" ON public.coaching_notes FOR SELECT USING (public.is_admin() OR coach_id = auth.uid() OR (student_id = auth.uid() AND visible_to_student = true)); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "coaching_notes_write" ON public.coaching_notes FOR ALL USING (public.is_admin() OR coach_id = auth.uid()) WITH CHECK (public.is_admin() OR coach_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AI conversations policies
DO $$ BEGIN CREATE POLICY "ai_conv_select" ON public.ai_conversations FOR SELECT USING (student_id = auth.uid() OR public.is_admin() OR public.is_coach_of(student_id)); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "ai_conv_write" ON public.ai_conversations FOR ALL USING (student_id = auth.uid() OR public.is_admin()) WITH CHECK (student_id = auth.uid() OR public.is_admin()); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- AI messages policies
DO $$ BEGIN CREATE POLICY "ai_msg_select" ON public.ai_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND (c.student_id = auth.uid() OR public.is_admin() OR public.is_coach_of(c.student_id)))); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "ai_msg_write" ON public.ai_messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND (c.student_id = auth.uid() OR public.is_admin()))); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_students_coach ON public.students(coach_id);
CREATE INDEX IF NOT EXISTS idx_plans_student_week ON public.plans(student_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_homework_student_due ON public.homework(student_id, due_date);
CREATE INDEX IF NOT EXISTS idx_homework_coach ON public.homework(coach_id);
CREATE INDEX IF NOT EXISTS idx_meetings_student ON public.meetings(student_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_coach ON public.meetings(coach_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_student ON public.coaching_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_student ON public.ai_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON public.ai_messages(conversation_id, created_at);


-- ============================================================================
-- 0002_seed.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  exam_type text not null check (exam_type in ('TYT', 'AYT')),
  topics text[] not null default '{}'
);

INSERT INTO public.subjects (name, exam_type, topics) VALUES
  ('Matematik', 'TYT', ARRAY['Temel Kavramlar','Sayılar','Bölme-Bölünebilme','Rasyonel Sayılar','Basit Eşitsizlikler','Mutlak Değer','Üslü Sayılar','Köklü Sayılar','Çarpanlara Ayırma','Oran-Orantı','Problemler','Kümeler','Fonksiyonlar','Permütasyon-Kombinasyon','Olasılık','Geometri']),
  ('Matematik', 'AYT', ARRAY['Fonksiyonlar','Polinomlar','2.Derece Denklemler','Trigonometri','Logaritma','Diziler','Limit','Türev','İntegral']),
  ('Türkçe', 'TYT', ARRAY['Sözcükte Anlam','Cümlede Anlam','Paragraf','Ses Bilgisi','Yazım Kuralları','Noktalama','Dil Bilgisi']),
  ('Fizik', 'TYT', ARRAY['Fizik Bilimine Giriş','Madde ve Özellikleri','Hareket','Kuvvet','Enerji','Elektrik']),
  ('Fizik', 'AYT', ARRAY['Vektörler','Kuvvet-Tork','Elektrik Alan','Manyetizma','Optik','Modern Fizik']),
  ('Kimya', 'TYT', ARRAY['Kimya Bilimi','Atom','Periyodik Sistem','Kimyasal Türler','Mol Kavramı']),
  ('Biyoloji', 'TYT', ARRAY['Canlıların Ortak Özellikleri','Hücre','Canlılar Dünyası']),
  ('Tarih', 'TYT', ARRAY['Tarih Bilimi','İlk Uygarlıklar','İslamiyet Öncesi Türk Tarihi']),
  ('Coğrafya', 'TYT', ARRAY['Doğa ve İnsan','Dünyanın Şekli','İklim']),
  ('Geometri', 'AYT', ARRAY['Doğruda ve Üçgende Açılar','Çokgenler','Çember ve Daire','Analitik Geometri'])
ON CONFLICT DO NOTHING;

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "subjects_read_all" ON public.subjects FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "subjects_admin_write" ON public.subjects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin()); EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ============================================================================
-- 0003_plan_priority.sql
-- ============================================================================

DO $$ BEGIN ALTER TABLE public.plan_items ADD COLUMN priority text NOT NULL DEFAULT 'onemli' CHECK (priority IN ('onemli','cok_onemli','ekstra')); EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.plan_items ADD COLUMN start_time time; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.plan_items ADD COLUMN task_order smallint NOT NULL DEFAULT 1; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.plans ADD COLUMN weekly_goal text; EXCEPTION WHEN duplicate_column THEN null; END $$;


-- ============================================================================
-- 0004_support_tickets.sql
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE SEQUENCE IF NOT EXISTS support_ticket_seq;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticket_no text NOT NULL UNIQUE DEFAULT ('T-' || lpad(nextval('support_ticket_seq')::text, 6, '0')),
  issue_type text NOT NULL,
  description text NOT NULL,
  attachment_urls text[] NOT NULL DEFAULT '{}',
  status public.ticket_status NOT NULL DEFAULT 'open',
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "tickets_own_or_admin" ON public.support_tickets FOR SELECT USING (user_id = auth.uid() OR public.is_admin()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "tickets_insert_own" ON public.support_tickets FOR INSERT WITH CHECK (user_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "tickets_update_admin" ON public.support_tickets FOR UPDATE USING (public.is_admin()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TRIGGER trg_support_tickets_updated BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at(); EXCEPTION WHEN duplicate_object THEN null; END $$;

INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', false) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN CREATE POLICY "support_attachments_select" ON storage.objects FOR SELECT USING (bucket_id = 'support-attachments' AND (auth.uid() = owner OR public.is_admin())); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "support_attachments_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'support-attachments' AND auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "support_attachments_update" ON storage.objects FOR UPDATE USING (bucket_id = 'support-attachments' AND (auth.uid() = owner OR public.is_admin())); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "support_attachments_delete" ON storage.objects FOR DELETE USING (bucket_id = 'support-attachments' AND (auth.uid() = owner OR public.is_admin())); EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ============================================================================
-- 0005_exam_sessions.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_name text NOT NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes int,
  correct_count int NOT NULL DEFAULT 0,
  wrong_count int NOT NULL DEFAULT 0,
  blank_count int NOT NULL DEFAULT 0,
  net numeric(5,2) GENERATED ALWAYS AS (correct_count - wrong_count * 0.25) STORED,
  success_rate numeric(5,2)
);

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "exam_sessions_select" ON public.exam_sessions FOR SELECT USING (student_id = auth.uid() OR public.is_admin() OR public.is_coach_of(student_id)); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "exam_sessions_write" ON public.exam_sessions FOR ALL USING (student_id = auth.uid() OR public.is_admin() OR public.is_coach_of(student_id)) WITH CHECK (student_id = auth.uid() OR public.is_admin() OR public.is_coach_of(student_id)); EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student ON public.exam_sessions(student_id, taken_at DESC);


-- ============================================================================
-- 0006_ai_review.sql
-- ============================================================================

DO $$ BEGIN ALTER TABLE public.ai_conversations ADD COLUMN reviewed_by_coach boolean NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.ai_conversations ADD COLUMN coach_reviewed_at timestamptz; EXCEPTION WHEN duplicate_column THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.ai_review_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_review_notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "ai_review_notes_coach_only" ON public.ai_review_notes FOR ALL USING (coach_id = auth.uid() OR public.is_admin()) WITH CHECK (coach_id = auth.uid()); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "ai_conv_coach_can_review" ON public.ai_conversations FOR UPDATE USING (public.is_coach_of(student_id) OR public.is_admin()) WITH CHECK (public.is_coach_of(student_id) OR public.is_admin()); EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ============================================================================
-- 0007_verification.sql
-- ============================================================================

DO $$ BEGIN ALTER TABLE public.students ADD COLUMN verification_document_url text; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.students ADD COLUMN verification_status text NOT NULL DEFAULT 'missing' CHECK (verification_status IN ('missing','pending','verified','rejected')); EXCEPTION WHEN duplicate_column THEN null; END $$;

INSERT INTO storage.buckets (id, name, public) VALUES ('student-documents', 'student-documents', false) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN CREATE POLICY "student_docs_select" ON storage.objects FOR SELECT USING (bucket_id = 'student-documents' AND (auth.uid() = owner OR public.is_admin())); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "student_docs_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-documents' AND auth.uid() IS NOT NULL); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "student_docs_update" ON storage.objects FOR UPDATE USING (bucket_id = 'student-documents' AND (auth.uid() = owner OR public.is_admin())); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "student_docs_delete" ON storage.objects FOR DELETE USING (bucket_id = 'student-documents' AND (auth.uid() = owner OR public.is_admin())); EXCEPTION WHEN duplicate_object THEN null; END $$;


-- ============================================================================
-- 0008_coach_marketplace.sql
-- ============================================================================

DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN bio text; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN university text; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN department text; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN own_exam_field text; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN own_exam_rank integer; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN bank_name text; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN iban text; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN student_quota integer NOT NULL DEFAULT 0; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN lgs_enabled boolean NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN pdr_enabled boolean NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN profile_published boolean NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN avatar_locked boolean NOT NULL DEFAULT true; EXCEPTION WHEN duplicate_column THEN null; END $$;

-- Mevcut profiles tablosuna eksik kolonları ekle (0001_init tablosuyla uyumlu)
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN avatar_url text; EXCEPTION WHEN duplicate_column THEN null; END $$;

CREATE OR REPLACE VIEW public.coach_public_profile AS
  SELECT id, full_name, avatar_url, bio, university, department,
         own_exam_field, own_exam_rank, student_quota, profile_published
  FROM public.profiles WHERE role = 'coach';


-- ============================================================================
-- Profile eksik的学生 kayıtlarını düzelt (handle_new_user sadece yeni
-- kullanıcılar için çalışır, mevcut student olmayan profiller için)
-- ============================================================================

INSERT INTO public.students (id)
SELECT p.id FROM public.profiles p
WHERE p.role = 'student'
  AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = p.id)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BİTTİ! Tüm tablolar, trigger'lar, fonksiyonlar, RLS politikaları ve
-- storage bucket'ları oluşturuldu.
-- ============================================================================
