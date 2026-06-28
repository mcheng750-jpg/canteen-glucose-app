create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  stall_id text not null,
  stall_name text not null,
  food_name text not null,
  before numeric(4, 1) not null,
  after1h numeric(4, 1) not null,
  after2h numeric(4, 1) not null,
  delta numeric(4, 1) not null,
  level text not null check (level in ('low', 'medium', 'high', 'insufficient')),
  portion text not null check (portion in ('少量', '正常', '加量')),
  extra_rice boolean not null default false,
  sugary_drink boolean not null default false,
  exercised boolean not null default false,
  note text not null default '',
  shared boolean not null default true,
  anonymous boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.records enable row level security;

drop policy if exists "Users can read own records" on public.records;
create policy "Users can read own records"
on public.records
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own records" on public.records;
create policy "Users can insert own records"
on public.records
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own records" on public.records;
create policy "Users can update own records"
on public.records
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists records_user_created_at_idx on public.records (user_id, created_at desc);
create index if not exists records_stall_id_idx on public.records (stall_id);
