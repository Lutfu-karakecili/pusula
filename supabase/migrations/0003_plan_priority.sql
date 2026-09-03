-- ADIM 5: Haftalık planlamaya öncelik, saat ve sıralama ekler

alter table public.plan_items add column priority text not null default 'onemli'
  check (priority in ('onemli','cok_onemli','ekstra'));
alter table public.plan_items add column start_time time;
alter table public.plan_items add column task_order smallint not null default 1;
alter table public.plans add column weekly_goal text;
