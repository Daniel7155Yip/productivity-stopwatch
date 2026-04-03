# Productivity Stopwatch — Session Handoff

## Who I am
I'm learning web dev by building a productivity stopwatch app. I want code explained as we go — design choices, how things link together. I enjoy the process over the product (vibe coding).

---

## The project
A Next.js app that lets you time focus sessions, save them to a database, and see your history.

**Repo location:** `C:/Users/danie/productivity-stopwatch`

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend framework | Next.js 16 + React 19 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Backend / Database | Supabase (PostgreSQL + Auth) |
| Deployment | Not yet — plan is Vercel |

---

## File structure

```
app/layout.tsx     — outer shell, sets dark background/font for whole app
app/page.tsx       — entire app logic (auth form + stopwatch + session history)
app/globals.css    — imports Tailwind, minimal global styles
lib/supabase.ts    — shared Supabase client + Session type
lib/schema.sql     — SQL to create the sessions table + RLS policy
.env.local         — holds Supabase URL and anon key (not committed to git)
```

---

## Current app state

The code is fully written and working — it just isn't connected to a real Supabase project yet.

`.env.local` currently has placeholder values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ZAh5K55gGtvh1G-bOQt1Vw_2O7j-VgX
```

### What works (once Supabase is connected):
- Sign up / sign in / sign out (email + password)
- Start, pause, resume, stop a timer
- Stopped sessions saved to Supabase
- Dashboard: today's total time + per-day breakdown

---

## What's left to do (next step)

### Connect Supabase — 4 manual steps in the Supabase dashboard:

1. **Create a project** at supabase.com → New project
2. **Get keys** → Settings → API → copy Project URL + anon key → paste into `.env.local`
3. **Create the sessions table** → SQL Editor → run `lib/schema.sql`
4. **Confirm email auth is enabled** → Authentication → Providers → Email

Once those are done, run `npm run dev` and the app should be fully functional.

---

## Features to build next (ideas)
- Labels/tags — name what you were working on per session
- Daily goal + progress bar
- Better session history (expandable per-day list)
- Streaks — consecutive days hitting your goal

---

## Notes on working style
- Explain design choices and how things link together as you code
- The user is learning — frame explanations clearly, relate new concepts to things already understood
- Keep it conversational and enjoyable
