-- ADIM 10: Koç profili & pazar yeri

alter table public.profiles add column bio text;
alter table public.profiles add column university text;
alter table public.profiles add column department text;
alter table public.profiles add column own_exam_field text;
alter table public.profiles add column own_exam_rank integer;
alter table public.profiles add column bank_name text;
alter table public.profiles add column iban text;
alter table public.profiles add column student_quota integer not null default 0;
alter table public.profiles add column lgs_enabled boolean not null default false;
alter table public.profiles add column pdr_enabled boolean not null default false;
alter table public.profiles add column profile_published boolean not null default false;
alter table public.profiles add column avatar_locked boolean not null default true;

-- Öğrencilerden gizli public view
create view public.coach_public_profile as
  select id, full_name, avatar_url, bio, university, department,
         own_exam_field, own_exam_rank, student_quota, profile_published
  from public.profiles where role = 'coach';
