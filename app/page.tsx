"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadShortcuts, matchesShortcut } from "@/app/settings/page";
import { supabase, type Session, type Task } from "@/lib/supabase";
import { Nav, LockInButton, SettingsGear } from "@/app/components/Nav";
import { useTimer } from "@/app/components/TimerContext";
import type { User } from "@supabase/supabase-js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

// ── Auth ─────────────────────────────────────────────────────────────────────

function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <p className="text-xs text-stone-400 mb-6 tracking-widest uppercase">{todayLabel()}</p>
      <h1 className="text-4xl text-stone-700 mb-2" style={{ fontFamily: "var(--font-lora), serif", fontWeight: 500 }}>
        Let&apos;s get started.
      </h1>
      <p className="text-stone-400 text-sm mb-10">Sign in to track your focus sessions.</p>
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <input
          className="w-full px-4 py-3 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-amber-400 text-stone-800 placeholder:text-stone-300"
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} required
        />
        <input
          className="w-full px-4 py-3 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-amber-400 text-stone-800 placeholder:text-stone-300"
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} required
        />
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <button
          className="w-full py-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-amber-50 font-medium transition-colors disabled:opacity-50"
          type="submit" disabled={loading}
        >
          {loading ? "…" : mode === "login" ? "Sign in" : "Sign up"}
        </button>
        <p className="text-center text-sm text-stone-400 pt-1">
          {mode === "login" ? "No account?" : "Have an account?"}{" "}
          <button type="button" className="text-amber-600 hover:underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App({ user }: { user: User }) {
  const router = useRouter();
  const { elapsed, running, selectedTaskId, setSelectedTaskId, start, pause, stop } = useTimer();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [renamingTaskId, setRenamingTaskId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    const pools: Record<string, string[]> = {
      morning:   ["Good morning.", "Let\u2019s make it count.", "Ready to focus?"],
      afternoon: ["Good afternoon.", "Let\u2019s get to work.", "Time to focus."],
      evening:   ["Good evening.", "Evening. Time to lock in.", "Let\u2019s finish strong."],
      night:     ["Working late?", "Let\u2019s go.", "Still at it?"],
    };
    const key = hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
    const pool = pools[key];
    return pool[Math.floor(Math.random() * pool.length)];
  });

  useEffect(() => {
    loadSessions();
    loadTasks();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const sc = loadShortcuts();
      if (e.key === " ") {
        e.preventDefault();
        if (!running && elapsed === 0) start();
        else if (running) pause();
      }
      if (matchesShortcut(e, sc.stopTimer) && elapsed > 0) { e.preventDefault(); handleStop(); }
      if (matchesShortcut(e, sc.timer)) router.push("/");
      if (matchesShortcut(e, sc.stats)) router.push("/stats");
      if (matchesShortcut(e, sc.history)) router.push("/history");
      if (matchesShortcut(e, sc.settings)) router.push("/settings");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, elapsed]);

  async function loadSessions() {
    const { data } = await supabase
      .from("sessions").select("*").eq("user_id", user.id)
      .order("started_at", { ascending: false });
    if (data) setSessions(data as Session[]);
    setSessionsLoaded(true);
  }

  async function loadTasks() {
    const { data } = await supabase
      .from("tasks").select("*").eq("user_id", user.id).eq("archived", false)
      .order("created_at", { ascending: true });
    if (data) setTasks(data as Task[]);
  }

  async function createTask() {
    const name = newTaskName.trim();
    if (!name) return;
    const { data } = await supabase.from("tasks").insert({ user_id: user.id, name }).select().single();
    if (data) {
      setTasks(prev => [...prev, data as Task]);
      setSelectedTaskId((data as Task).id);
    }
    setNewTaskName("");
    setAddingTask(false);
  }

  async function renameTask() {
    const name = renameValue.trim();
    if (!name || !renamingTaskId) return;
    await supabase.from("tasks").update({ name }).eq("id", renamingTaskId);
    setTasks(prev => prev.map(t => t.id === renamingTaskId ? { ...t, name } : t));
    setRenamingTaskId(null);
    setRenameValue("");
  }

  async function handleStop() {
    const session = stop();
    if (!session) return;
    const ended = new Date();
    await supabase.from("sessions").insert({
      user_id: user.id,
      started_at: session.sessionStart.toISOString(),
      ended_at: ended.toISOString(),
      duration_seconds: session.elapsed,
      task_id: selectedTaskId || null,
    });
    loadSessions();
  }

  const todayStr = new Date().toDateString();
  // Completed sessions today (saved to Supabase)
  const todaySeconds = sessions
    .filter(s => new Date(s.started_at).toDateString() === todayStr)
    .reduce((sum, s) => sum + s.duration_seconds, 0);
  // Include the current in-progress session so the bar updates live
  const liveTodaySeconds = todaySeconds + elapsed;

  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const hasSessions = sessions.length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 gap-8 max-w-2xl mx-auto">
      <SettingsGear />

      {/* Header */}
      <div className="flex w-full justify-between items-center">
        <div className="flex items-center gap-3">
          <p className="text-xs text-stone-400 tracking-widest uppercase">{todayLabel()}</p>
          <LockInButton onLockIn={!running ? start : undefined} />
        </div>
        <Nav />
      </div>

      {/* Welcome */}
      {sessionsLoaded && !running && elapsed === 0 && (
        <div className="w-full">
          <h2 className="text-3xl text-stone-700" style={{ fontFamily: "var(--font-lora), serif", fontWeight: 500 }}>
            {hasSessions ? greeting : "Let\u2019s get started."}
          </h2>
          {!hasSessions && <p className="text-stone-400 text-sm mt-1">Create a task and start your first session.</p>}
        </div>
      )}

      {/* Focus timer card */}
      <div className="w-full bg-white/50 border border-stone-200 rounded-2xl p-10 flex flex-col items-center gap-6">

        {/* Top strip */}
        <div className="flex w-full items-center justify-center gap-4">
          {selectedTask ? (
            <p className="text-xs" style={{ color: "#797979" }}>
              Working on: {selectedTask.name}
            </p>
          ) : (
            <p className="text-xs" style={{ color: "	#797979" }}>No task selected</p>
          )}
        </div>

        {/* Task row */}
        {renamingTaskId ? (
          <div className="flex gap-2 w-full max-w-xs">
            <input
              autoFocus
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-amber-400 text-stone-800 text-sm placeholder:text-stone-300"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") renameTask();
                if (e.key === "Escape") { setRenamingTaskId(null); setRenameValue(""); }
              }}
            />
            <button onClick={renameTask}
              className="px-3 py-2 rounded-xl bg-stone-700 text-amber-50 text-sm hover:bg-stone-600 transition-colors">
              Save
            </button>
            <button onClick={() => { setRenamingTaskId(null); setRenameValue(""); }}
              className="px-3 py-2 rounded-xl bg-stone-100 text-stone-500 text-sm hover:bg-stone-200 transition-colors">
              ✕
            </button>
          </div>
        ) : addingTask ? (
          <div className="flex gap-2 w-full max-w-xs">
            <input
              autoFocus
              className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-amber-400 text-stone-800 text-sm placeholder:text-stone-300"
              placeholder="e.g. CSSE2010"
              value={newTaskName}
              onChange={e => setNewTaskName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") createTask();
                if (e.key === "Escape") { setAddingTask(false); setNewTaskName(""); }
              }}
            />
            <button onClick={createTask}
              className="px-3 py-2 rounded-xl bg-stone-700 text-amber-50 text-sm hover:bg-stone-600 transition-colors">
              Add
            </button>
            <button onClick={() => { setAddingTask(false); setNewTaskName(""); }}
              className="px-3 py-2 rounded-xl bg-stone-100 text-stone-500 text-sm hover:bg-stone-200 transition-colors">
              ✕
            </button>
          </div>
        ) : (
          <div className={`flex items-center gap-2 w-full max-w-xs ${running ? "opacity-40 pointer-events-none" : ""}`}>
            {selectedTaskId && (
              <button
                onClick={() => { setRenamingTaskId(selectedTaskId); setRenameValue(selectedTask?.name ?? ""); }}
                className="text-stone-300 hover:text-stone-500 transition-colors shrink-0"
                title="Rename task"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
            <select
              value={selectedTaskId}
              disabled={running}
              onChange={e => setSelectedTaskId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-amber-50 border border-stone-200 text-sm text-stone-600 focus:outline-none focus:border-amber-400 appearance-none cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="">No task selected</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {!selectedTaskId && (
              <button onClick={() => setAddingTask(true)}
                className="text-xs text-stone-400 hover:text-stone-600 transition-colors whitespace-nowrap">
                + Add task
              </button>
            )}
            {selectedTaskId && (
              <button
                onClick={async () => {
                  await supabase.from("tasks").update({ archived: true }).eq("id", selectedTaskId);
                  setTasks(prev => prev.filter(t => t.id !== selectedTaskId));
                  setSelectedTaskId("");
                }}
                className="text-xs text-rose-400 hover:text-rose-600 transition-colors whitespace-nowrap"
              >
                Remove
              </button>
            )}
          </div>
        )}

        {/* Timer */}
        <span className="text-8xl tracking-tight text-stone-700"
          style={{ fontFamily: "var(--font-lora), serif", fontVariantNumeric: "tabular-nums" }}>
          {fmt(elapsed)}
        </span>

        {/* Controls */}
        <div className="flex gap-3 items-center">
          {!running ? (
            <button onClick={start}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#7D7575" }}>
              {/* Play icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </button>
          ) : (
            <button onClick={pause}
              className="w-14 h-14 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-700 transition-colors">
              {/* Pause icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            </button>
          )}
          <button onClick={handleStop} disabled={elapsed === 0}
            className="w-14 h-14 rounded-full bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-rose-500 transition-colors disabled:opacity-30">
            {/* Stop icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Today summary card */}
      <div
        className="w-[85%] rounded-2xl px-8 py-4 flex items-center justify-between gap-4 self-center"
        style={{ backgroundColor: "rgba(193,154,107,0.12)", border: "1px solid rgba(193,154,107,0.28)" }}
      >
        <p
          className="font-mono text-2xl tracking-tight uppercase"
          style={{ fontVariantNumeric: "tabular-nums", color: "#C19A6B" }}
        >
          Today
        </p>
        <p
          className="font-mono text-2xl tracking-tight"
          style={{ fontVariantNumeric: "tabular-nums", color: "#C19A6B" }}
        >
          {fmt(liveTodaySeconds)}
        </p>
      </div>

    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center text-stone-400 text-sm">Loading…</div>
  );

  return user ? <App user={user} /> : <AuthForm />;
}
