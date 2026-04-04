# Productivity Stopwatch — Context Handoff

## Who I am
I'm learning web dev by building a productivity stopwatch app. I want code explained as we go — design choices, how things link together. I enjoy the process over the product (vibe coding).

---

## The project
A Next.js app that lets you time focus sessions, tag them with tasks, save them to Supabase, and see your history/stats.

**Repo:** `github.com/Daniel7155Yip/productivity-stopwatch`
**Local path:** `C:/Users/danie/productivity-stopwatch`

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend framework | Next.js 16 + React 19 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Fonts | Lora (serif, headings) + DM Sans (body) via `next/font/google` |
| Backend / Database | Supabase (PostgreSQL + Auth) |
| Deployment | Vercel (not yet deployed — next step) |

---

## Current app state — FULLY WORKING

Supabase is connected. The app runs locally with `npm run dev`.

`.env.local` has real keys (not committed to git — you must add these on your laptop):
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```
Get these from: Supabase dashboard → your project → Settings → API.

---

## Pages built

```
/              ← Timer page (home)
/stats         ← Activity heatmap (365-day GitHub-style grid)
/history       ← Bar charts by day/week/month + hour-tendency heatmap
/settings      ← Keyboard shortcut remapping + erase all data
```

Every page shares:
- `<SettingsGear />` — cog icon fixed top-right, links to /settings
- `<Nav />` — Stats / History links
- `<LockInButton />` — tan button that starts the timer (on home page only)

---

## Features built

- Start / pause / resume / stop timer
- Tasks — create, rename, remove (soft-deleted via `archived: true`)
- Sessions tagged with a task, saved to Supabase on stop
- Stats page: 365-day activity heatmap
  - Hover cell → tooltip with date + time range
  - Click cell → modal with hourly bar chart + task breakdown
  - Colour legend with 7 levels (0, 0–1hr, 1–2hr, 2–3hr, 3–4hr, 4–6hr, 6+hr)
- History page: bar charts grouped by day/week/month, hour tendency heatmap
- Settings page: remappable keyboard shortcuts (stored in localStorage)
  - Click any shortcut badge → full-screen overlay → press combo → Enter to save
  - Multi-key combos supported (e.g. Ctrl+B)
- Erase all data button (deletes sessions, archives all tasks in one operation)
- Sign out in Settings (removed from home page header)

### Default keyboard shortcuts
| Action | Default key |
|---|---|
| Start / Pause | Space |
| Stop timer | Ctrl+Enter |
| Go to Timer | 1 |
| Go to Stats | 2 |
| Go to History | 3 |
| Go to Settings | 4 |

---

## SQL — what's been run in Supabase

**You must run all of this in the Supabase SQL editor when setting up on a new machine.**
Go to: Supabase dashboard → your project → SQL Editor → New query → paste and run.

### 1. Sessions table

```sql
create table public.sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  started_at       timestamptz not null,
  ended_at         timestamptz not null,
  duration_seconds integer not null,
  task_id          uuid references public.tasks(id) on delete set null,
  created_at       timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "Users can view own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);
```

### 2. Tasks table

```sql
create table public.tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);
```

> **Note:** Create the `tasks` table first, then `sessions` — because `sessions.task_id` references `tasks`.

---

## Getting running on a new machine

```bash
# 1. Clone the repo
git clone https://github.com/Daniel7155Yip/productivity-stopwatch.git
cd productivity-stopwatch

# 2. Install dependencies
npm install

# 3. Create .env.local with your Supabase keys
# (copy from Supabase dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 4. Start the dev server
npm run dev
# → open localhost:3000
```

The SQL tables only need to be created once in Supabase — they persist across machines because they're in the cloud, not locally.

---

## What's left to do

```
→ Deploy to Vercel
   1. Push code to GitHub (done ✓)
   2. Go to vercel.com → New Project → import from GitHub
   3. Add environment variables (same as .env.local) in Vercel dashboard
   4. Deploy — Vercel auto-deploys on every git push after that

→ Ideas for future features:
   daily goals + progress bar
   streaks (consecutive days hitting goal)
   export data as CSV
   mobile-friendly layout
```

---

## Notes on working style
- Explain design choices and how things link together as you code
- The user is learning — frame explanations clearly, relate new concepts to things already understood
- Keep it conversational and enjoyable
