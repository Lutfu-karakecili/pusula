-- ADIM 9: Öğrenci belge doğrulama

alter table public.students add column verification_document_url text;
alter table public.students add column verification_status text not null default 'missing'
  check (verification_status in ('missing','pending','verified','rejected'));

-- Storage bucket
insert into storage.buckets (id, name, public) values ('student-documents', 'student-documents', false)
  on conflict (id) do nothing;

create policy "student_docs_select" on storage.objects
  for select using (bucket_id = 'student-documents' and (
    auth.uid() = owner or public.is_admin()
  ));
create policy "student_docs_insert" on storage.objects
  for insert with check (bucket_id = 'student-documents' and auth.uid() is not null);
create policy "student_docs_update" on storage.objects
  for update using (bucket_id = 'student-documents' and (auth.uid() = owner or public.is_admin()));
create policy "student_docs_delete" on storage.objects
  for delete using (bucket_id = 'student-documents' and (auth.uid() = owner or public.is_admin()));
