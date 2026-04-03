"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, type Session } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

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
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 p-8 bg-zinc-900 rounded-xl">
        <h1 className="text-2xl font-semibold text-center">
          {mode === "login" ? "Sign in" : "Create account"}
        </h1>
        <input
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-indigo-500"
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} required
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-indigo-500"
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium disabled:opacity-50"
          type="submit" disabled={loading}
        >
          {loading ? "…" : mode === "login" ? "Sign in" : "Sign up"}
        </button>
        <p className="text-center text-sm text-zinc-400">
          {mode === "login" ? "No account?" : "Have an account?"}{" "}
          <button type="button" className="text-indigo-400 hover:underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(n => String(n).padStart(2, "0")).join(":");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ── App ───────────────────────────────────────────────────────────────────────

function App({ user }: { user: User }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false });
    if (data) setSessions(data as Session[]);
  }

  function start() {
    startRef.current = new Date();
    setRunning(true);
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }

  function pause() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  async function stop() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    if (!startRef.current || elapsed === 0) { setElapsed(0); return; }

    const ended = new Date();
    await supabase.from("sessions").insert({
      user_id: user.id,
      started_at: startRef.current.toISOString(),
      ended_at: ended.toISOString(),
      duration_seconds: elapsed,
    });
    setElapsed(0);
    startRef.current = null;
    loadSessions();
  }

  // Dashboard calculations
  const todayStr = new Date().toDateString();
  const todaySeconds = sessions
    .filter(s => new Date(s.started_at).toDateString() === todayStr)
    .reduce((sum, s) => sum + s.duration_seconds, 0);

  const byDay: Record<string, number> = {};
  for (const s of sessions) {
    const day = fmtDate(s.started_at);
    byDay[day] = (byDay[day] ?? 0) + s.duration_seconds;
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-4 gap-10">
      {/* Header */}
      <div className="flex w-full max-w-md justify-between items-center">
        <h1 className="text-xl font-semibold">Stopwatch</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-zinc-400 hover:text-zinc-200">
          Sign out
        </button>
      </div>

      {/* Stopwatch */}
      <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-10 flex flex-col items-center gap-8">
        <span className="font-mono text-7xl tracking-tight">{fmt(elapsed)}</span>
        <div className="flex gap-3">
          {!running ? (
            <button onClick={start}
              className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium">
              {elapsed > 0 ? "Resume" : "Start"}
            </button>
          ) : (
            <button onClick={pause}
              className="px-6 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 font-medium">
              Pause
            </button>
          )}
          <button onClick={stop} disabled={elapsed === 0}
            className="px-6 py-2 rounded-lg bg-red-700 hover:bg-red-600 font-medium disabled:opacity-30">
            Stop
          </button>
        </div>
      </div>

      {/* Dashboard */}
      <div className="w-full max-w-md space-y-4">
        <div className="bg-zinc-900 rounded-xl p-5">
          <p className="text-sm text-zinc-400 mb-1">Today</p>
          <p className="font-mono text-3xl">{fmt(todaySeconds)}</p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-5">
          <p className="text-sm text-zinc-400 mb-3">All sessions by day</p>
          {Object.keys(byDay).length === 0 ? (
            <p className="text-zinc-500 text-sm">No sessions yet.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(byDay).map(([day, secs]) => (
                <li key={day} className="flex justify-between text-sm">
                  <span className="text-zinc-300">{day}</span>
                  <span className="font-mono text-zinc-100">{fmt(secs)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
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
    <div className="flex min-h-screen items-center justify-center text-zinc-500">Loading…</div>
  );

  return user ? <App user={user} /> : <AuthForm />;
}
