-- Run this in your Supabase SQL editor

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.sessions enable row level security;

-- Users can only see their own sessions
create policy "Users can view own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

-- Users can insert their own sessions
create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

-- Users can delete their own sessions
create policy "Users can delete own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);
