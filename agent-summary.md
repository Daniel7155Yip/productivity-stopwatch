# Agent Summary

Read this first. Then read `codingupdates.md` only if you need recent changes.

## App

Next.js 16 App Router stopwatch app with Supabase auth and storage.

Main flow:
- sign in
- choose or create a task
- run timer on `/`
- stop to save a session
- review stats/history

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase

## Routes

- `/` timer and task management
- `/stats` heatmap, streaks, task breakdown
- `/history` charts and recent sessions
- `/settings` shortcuts, sign out, erase data

## Key files

- `app/layout.tsx`: root layout and `TimerProvider`
- `app/page.tsx`: timer page, task management, focus timer card, and today summary card
- `app/components/TimerContext.tsx`: shared timer state and persistence
- `app/stats/page.tsx`: stats UI
- `app/history/page.tsx`: history UI
- `app/settings/page.tsx`: shortcut logic and settings UI
- `lib/supabase.ts`: client and types
- `lib/schema.sql`: database schema

## Architecture notes

- Timer state is shared via `TimerProvider`, not local page state.
- Timer persists with `localStorage`.
- Live "Today" total includes the in-progress session.
- `/` now uses two named cards:
- `Focus timer card`: the main stopwatch/task card on the home page.
- `Today summary card`: the separate lower card showing the live cumulative total for today.
- The top status line in the focus timer card is centered and shows either `Working on: <task>` or `No task selected`.
- The today summary card uses the same monospace number styling as stats page numeric summaries.
- Tasks are soft-deleted with `archived: true`.
- Shortcut helpers live in `app/settings/page.tsx` and are imported elsewhere.

## Data model

`tasks`: `id`, `user_id`, `name`, `archived`, `created_at`

`sessions`: `id`, `user_id`, `started_at`, `ended_at`, `duration_seconds`, `task_id`, `created_at`

## Working rule

Check `git status --short` before trusting docs or the last commit. Local changes may be ahead of both.
