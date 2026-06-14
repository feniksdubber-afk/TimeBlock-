-- Run this in your Supabase project:
-- Dashboard → SQL Editor → New query → paste & run

create table if not exists blocks (
  id             text primary key,
  emoji          text        not null default '⭐',
  name           text        not null,
  category       text        not null,
  color          text        not null default '#6366f1',
  duration_slots integer     not null default 4,
  start_slot     integer     not null default 0,
  shape_cols     integer     not null default 1,
  shape_rows     integer     not null default 4,
  repeat         text        not null default 'HarKuni',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Auto-update updated_at on every row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blocks_updated_at on blocks;
create trigger blocks_updated_at
  before update on blocks
  for each row execute procedure set_updated_at();

-- Enable Row Level Security (open read/write for anon key — tighten when you add auth)
alter table blocks enable row level security;

drop policy if exists "allow_all" on blocks;
create policy "allow_all" on blocks
  for all using (true) with check (true);
