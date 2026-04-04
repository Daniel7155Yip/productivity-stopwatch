# Productivity Stopwatch — Mental Map

---

## The Big Picture

```
YOU (write code)
     │
     ▼
┌─────────────────────────────────────────────────────┐
│                 YOUR MACHINE                        │
│                                                     │
│  VSCode / Claude Code  ←  you write code here       │
│                                                     │
│  .env.local            ←  stores keys (never git)   │
│  NEXT_PUBLIC_SUPABASE_URL=https://nfnx...           │
│  NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   │
│                                                     │
│  npm run dev           ←  starts local server       │
│       │                                             │
│       ▼                                             │
│  localhost:3000        ←  your app in the browser   │
└─────────────────────────────────────────────────────┘
     │
     │  git push
     ▼
┌─────────────────────────────────────────────────────┐
│                   GITHUB                            │
│                                                     │
│  Stores your code (NOT your keys)                   │
│  .gitignore blocks .env.local from ever uploading   │
│  Daniel7155Yip/productivity-stopwatch               │
└─────────────────────────────────────────────────────┘
     │
     │  Vercel watches for new pushes
     ▼      
┌─────────────────────────────────────────────────────┐
│                   VERCEL                            │
│                                                     │
│  Pulls code from GitHub                             │
│  Runs npm run build automatically                   │
│  You paste keys into Vercel Environment Variables   │
│  Serves app globally at yourapp.vercel.app          │
└─────────────────────────────────────────────────────┘
     │
     │  app talks to Supabase
     ▼
┌─────────────────────────────────────────────────────┐
│                  SUPABASE                           │
│                                                     │
│  Auth ──── handles login/signup, gives back a JWT   │
│  Database ─ stores sessions + tasks tables          │
│  RLS ────── "you can only see your own rows"        │
│                                                     │
│  Keys:                                              │
│  publishable/anon  ← visitor pass, safe to expose   │
│  secret/service    ← master key, NEVER in frontend  │
└─────────────────────────────────────────────────────┘
```

---

## The Tech Stack

```
WHAT YOU WRITE          WHAT IT DOES
──────────────────────────────────────────────────────
TypeScript         →    JavaScript with types
                        catches mistakes before runtime

JSX (in .tsx)      →    HTML written inside JavaScript
                        React turns it into real HTML

Tailwind classes   →    CSS written as classnames
                        bg-stone-700 = dark brown background

Next.js            →    framework: routing, builds, dev server
                        each file in /app is a page or component

React              →    UI library inside Next.js
                        useState, useEffect, components

Supabase SDK       →    library that talks to Supabase
                        supabase.auth.signIn(), supabase.from()...
```

---

## File Structure (current)

```
productivity-stopwatch/
│
├── app/
│   ├── layout.tsx              ← outer shell, wraps EVERY page
│   │                             sets font, background colour
│   │
│   ├── page.tsx                ← / (home) — the timer page
│   │                             "Lock In" button, task selector,
│   │                             stopwatch, today's total
│   │
│   ├── stats/
│   │   └── page.tsx            ← /stats — activity heatmap
│   │                             GitHub-style calendar grid
│   │                             click cell → hourly breakdown modal
│   │
│   ├── history/
│   │   └── page.tsx            ← /history — session history
│   │                             bar charts by day/week/month
│   │                             hour tendency heatmap
│   │
│   ├── settings/
│   │   └── page.tsx            ← /settings — configuration
│   │                             remap keyboard shortcuts
│   │                             erase all data
│   │
│   ├── components/
│   │   └── Nav.tsx             ← shared UI used on every page
│   │                             Nav (Stats/History links)
│   │                             LockInButton (tan button)
│   │                             SettingsGear (cog icon top-right)
│   │
│   └── globals.css             ← imports Tailwind, base styles
│
├── lib/
│   ├── supabase.ts             ← ONE shared Supabase client
│   │                             exports Session type + Task type
│   │
│   └── schema.sql              ← blueprint for the database
│                                 paste into Supabase SQL editor once
│
├── .env.local                  ← your keys (never on GitHub)
├── .env.local.example          ← safe template showing key names
├── .gitignore                  ← tells git what NOT to track
├── package.json                ← dependency list + npm scripts
├── package-lock.json           ← exact versions npm installed
├── tsconfig.json               ← TypeScript settings
├── next.config.ts              ← Next.js settings
├── mental-map.md               ← this file
├── codingupdates.md            ← changelog of features built
└── node_modules/               ← installed packages (never touch)
```

---

## How Next.js Routing Works

This is important — the folder structure IS the URL structure:

```
app/page.tsx              →  localhost:3000/
app/stats/page.tsx        →  localhost:3000/stats
app/history/page.tsx      →  localhost:3000/history
app/settings/page.tsx     →  localhost:3000/settings
```

Every folder inside `app/` that has a `page.tsx` becomes a real URL.
`layout.tsx` wraps all of them — it's like a picture frame around every page.

---

## How Components Work

A component is just a reusable chunk of UI. Instead of copy-pasting the same navigation bar into every page, you write it once and import it everywhere.

```
Nav.tsx exports 3 components:
  <Nav />           →  Stats / History links
  <LockInButton />  →  tan "Lock In" button
  <SettingsGear />  →  cog icon fixed top-right

Every page imports and uses them:
  import { Nav, LockInButton, SettingsGear } from "@/app/components/Nav"
```

If you ever want to change the nav, you change it in ONE file and every page updates.

---

## How State Works (React)

State is data that can change — and when it does, React re-renders the UI automatically.

```typescript
const [running, setRunning] = useState(false)
//     ↑ read it    ↑ change it      ↑ starting value
```

Real examples from the app:

```
elapsed        →  the seconds ticking up on the timer
running        →  is the timer currently going?
tasks          →  the list of tasks fetched from Supabase
selectedTaskId →  which task is currently selected
```

When you call `setRunning(true)`, React sees the state changed and
redraws just the parts of the page that depend on `running`.

---

## How useEffect Works

`useEffect` runs code AFTER the page renders — used for things that
need to happen outside of just drawing UI:

```typescript
useEffect(() => {
  loadSessions()   // fetch data from Supabase when page loads
  loadTasks()
}, [])             // [] means "run once, when the component mounts"
```

Also used for keyboard shortcuts:
```typescript
useEffect(() => {
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)  // cleanup
}, [running, elapsed])  // re-run when these values change
```

---

## How Keyboard Shortcuts Work

Shortcuts are stored in `localStorage` — the browser's built-in
key-value store that persists between page refreshes (but stays on
that device only, not in Supabase).

```
settings/page.tsx exports two helpers used everywhere:

loadShortcuts()        →  reads shortcuts from localStorage
                          falls back to defaults if nothing saved

matchesShortcut(e, combo) → checks if a keypress matches
                             a stored combo like "Ctrl+Enter"
```

Every page listens for keypresses and calls these helpers:
```
"1" pressed → go to /
"2" pressed → go to /stats
"3" pressed → go to /history
"4" pressed → go to /settings
Ctrl+Enter  → stop the timer
Space       → start / pause
```

---

## How the Heatmap Works (Stats page)

```
1. Load all sessions from Supabase

2. Group them by date:
   { "2026-04-01": 7200, "2026-04-02": 3600, ... }
   (date string → total seconds that day)

3. Build a grid of the last 365 days

4. For each cell, pick a colour based on seconds worked:
   0 sec    → grey   (#E7E5E4)
   0–1 hr   → light tan
   1–2 hrs  → medium tan
   2–3 hrs  → orange
   3–4 hrs  → dark yellow
   4–6 hrs  → brown
   6+ hrs   → darkest brown

5. Hover → tooltip shows date + time range
   Click  → modal opens with hourly bar chart + task breakdown
```

---

## How Data Flows (end to end)

### Login:
```
User types email + password
  → supabase.auth.signInWithPassword()
  → Supabase returns a JWT token
  → SDK stores JWT in browser automatically
  → onAuthStateChange fires → setUser(user)
  → AuthForm swaps out, App renders
```

### Starting and stopping a session:
```
Click Lock In / Start
  → startRef.current = new Date()  (remember start time)
  → setInterval ticks elapsed up every second

Click Stop
  → clearInterval (stop ticking)
  → supabase.from("sessions").insert({
      user_id, started_at, ended_at,
      duration_seconds, task_id
    })
  → JWT attached automatically by SDK
  → Supabase checks RLS: auth.uid() = user_id? ✓
  → Row saved to PostgreSQL
  → loadSessions() called → UI updates
```

### Tasks:
```
Create task → supabase.from("tasks").insert({ user_id, name })
Remove task → supabase.from("tasks").update({ archived: true })
             (soft delete — data kept, just hidden)
Rename task → supabase.from("tasks").update({ name })
```

---

## The Database Tables

```
sessions
  id               uuid  (unique ID, auto-generated)
  user_id          uuid  (links to auth.users)
  started_at       timestamp
  ended_at         timestamp
  duration_seconds integer
  task_id          uuid or null  (links to tasks table)
  created_at       timestamp

tasks
  id               uuid
  user_id          uuid  (links to auth.users)
  name             text
  archived         boolean  (true = "deleted")
  created_at       timestamp
```

RLS on both tables: users can only read/write their own rows.

---

## The Commands

```
npm install     → after cloning, downloads all packages into node_modules
npm run dev     → local development server at localhost:3000
npm run build   → compile for production (Vercel does this automatically)
npm start       → serve the production build (Vercel does this too)
git add         → stage files for commit
git commit      → save a snapshot locally
git push        → send commits up to GitHub
git pull        → download latest commits from GitHub
git clone       → download a repo to a new machine
```

---

## What's Done vs What's Next

```
DONE ✓
  Full timer with start / pause / stop
  Tasks — create, rename, remove (soft delete)
  Sessions saved to Supabase with task tag
  Stats page with activity heatmap (365 days)
  History page with bar charts + hour tendency heatmap
  Settings page with remappable keyboard shortcuts
  Keyboard shortcuts for all navigation + timer control
  Multi-key combos (e.g. Ctrl+Enter)
  Warm minimal design (stone/amber palette, Lora serif font)

TODO
  → Fill in real Supabase URL in .env.local (both machines)
  → Run schema.sql in Supabase SQL editor (tasks table too)
  → Test full flow locally (npm run dev)
  → Deploy to Vercel
  → Ideas: daily goals, streaks, export data, mobile layout
```
