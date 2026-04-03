# Productivity Stopwatch — Mental Map

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
│                                                     │
│  Daniel7155Yip/productivity-stopwatch               │
└─────────────────────────────────────────────────────┘
     │
     │  Vercel watches for new pushes
     ▼
┌─────────────────────────────────────────────────────┐
│                   VERCEL                            │
│                                                     │
│  Pulls code from GitHub                             │
│  Runs npm run build                                 │
│  You paste keys into Vercel's Environment Variables │
│  (acts like .env.local in the cloud)                │
│  Serves app globally at yourapp.vercel.app          │
└─────────────────────────────────────────────────────┘
     │
     │  app talks to Supabase
     ▼
┌─────────────────────────────────────────────────────┐
│                  SUPABASE                           │
│                                                     │
│  Auth ──── handles login/signup, gives back a JWT   │
│  Database ─ stores sessions table (PostgreSQL)      │
│  RLS ────── "you can only see your own rows"        │
│                                                     │
│  Keys:                                              │
│  publishable/anon  ← visitor pass, safe to expose   │
│  secret/service    ← master key, NEVER in frontend  │
└─────────────────────────────────────────────────────┘
```

---

## The Tech Stack Explained

```
WHAT YOU WRITE          WHAT IT DOES
──────────────────────────────────────────────────────
TypeScript         →    JavaScript with types
                        catches mistakes before they happen

JSX (in .tsx)      →    HTML written inside JavaScript
                        React turns it into real HTML

Tailwind classes   →    CSS written as classnames
                        bg-indigo-600 = blue background

Next.js            →    the framework gluing it all together
                        handles routing, builds, dev server

React              →    the UI library inside Next.js
                        useState, useEffect, components

Supabase SDK       →    the library that talks to Supabase
                        supabase.auth.signIn(), supabase.from()...
```

---

## The File Structure and Why

```
productivity-stopwatch/
│
├── app/
│   ├── layout.tsx     ← outer shell (dark bg, font, title)
│   │                    wraps EVERY page
│   │
│   ├── page.tsx       ← the whole app lives here
│   │                    3 layers:
│   │                    Page → checks if logged in
│   │                    AuthForm → login/signup (logged out)
│   │                    App → stopwatch + history (logged in)
│   │
│   └── globals.css    ← imports Tailwind, base styles
│
├── lib/
│   ├── supabase.ts    ← ONE shared Supabase client
│   │                    all files import from here
│   │                    also holds the Session type
│   │
│   └── schema.sql     ← blueprint for the database
│                        paste into Supabase SQL editor once
│
├── .env.local         ← your keys (never on GitHub)
├── .env.local.example ← safe template showing key names
├── .gitignore         ← tells git what to ignore
├── package.json       ← shopping list of dependencies
├── package-lock.json  ← exact versions npm installed
├── tsconfig.json      ← TypeScript settings
├── next.config.ts     ← Next.js settings
└── node_modules/      ← all installed packages (never touch)
```

---

## How a Login Works (end to end)

```
1. You type email + password → hit Sign in

2. page.tsx calls
   supabase.auth.signInWithPassword({ email, password })

3. lib/supabase.ts created the client using keys from .env.local
   so it knows WHICH Supabase project to talk to

4. Supabase checks your credentials
   returns a JWT (a signed token proving who you are)

5. The SDK stores the JWT in the browser automatically

6. Every future request includes the JWT
   Supabase reads it → knows your user ID → enforces RLS

7. page.tsx detects the login via onAuthStateChange
   swaps AuthForm out, renders App instead
```

---

## How a Session Gets Saved (end to end)

```
1. You hit Start → timer begins counting

2. You hit Stop → page.tsx calls:
   supabase.from("sessions").insert({
     user_id, started_at, ended_at, duration_seconds
   })

3. Request goes to Supabase with your JWT attached

4. Supabase checks RLS policy:
   "is auth.uid() = user_id?" → yes → allows the insert

5. Row saved in PostgreSQL sessions table

6. page.tsx reloads sessions → dashboard updates
```

---

## The Key Concepts Linked Together

```
.env.local
    │ holds keys
    ▼
lib/supabase.ts
    │ creates client, exports Session type
    ▼
app/page.tsx
    │ uses client for auth + database
    │ uses Session type for TypeScript safety
    ▼
Supabase
    │ auth gives JWT
    │ RLS protects data
    ▼
PostgreSQL sessions table
    (created by lib/schema.sql)
```

---

## The Commands and When to Use Them

```
npm install     → after cloning, downloads all packages
npm run dev     → local development (localhost:3000)
npm run build   → compile for production (Vercel does this)
npm start       → serve production build (Vercel does this)
git add         → stage files for commit
git commit      → save a snapshot of your code
git push        → send commits to GitHub
git clone       → download a repo to a new machine
```

---

## What's Done vs What's Next

```
DONE ✓
  App code written (auth + stopwatch + history)
  Supabase project created
  Code pushed to GitHub

TODO
  → Fill in real Supabase URL in .env.local
  → Run schema.sql in Supabase SQL editor
  → Test the app locally (npm run dev)
  → Deploy to Vercel
  → Build new features (labels, goals, streaks...)
```
