-- ADIM C: Koç profiline cinsiyet alanı (opsiyonel filtre)
alter table public.profiles add column gender text check (gender in ('kadin','erkek') or gender is null);
