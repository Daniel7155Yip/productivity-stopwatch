"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadShortcuts, matchesShortcut } from "@/app/settings/page";
import { supabase, type Session, type Task } from "@/lib/supabase";
import { Nav, LockInButton, SettingsGear } from "@/app/components/Nav";
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

type View = "day" | "week" | "month";

// ── Bar Chart ─────────────────────────────────────────────────────────────────

function BarChart({ bars, maxVal }: { bars: { label: string; seconds: number }[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-1 h-28 w-full">
      {bars.map(({ label, seconds }) => {
        const pct = maxVal > 0 ? (seconds / maxVal) * 100 : 0;
        return (
          <div key={label} className="flex flex-col items-center flex-1 gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: "88px" }}>
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${pct}%`,
                  minHeight: seconds > 0 ? "3px" : "0",
                  backgroundColor: seconds > 0 ? "#C4A484" : "#E7E5E4",
                }}
                title={seconds > 0 ? fmt(seconds) : "No session"}
              />
            </div>
            <span className="text-[9px] text-stone-400">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Hour Tendency Heatmap ─────────────────────────────────────────────────────

function HourHeatmap({ sessions }: { sessions: Session[] }) {
  // Build hour -> total seconds
  const byHour: number[] = Array(24).fill(0);
  for (const s of sessions) {
    const h = new Date(s.started_at).getHours();
    byHour[h] += s.duration_seconds;
  }
  const max = Math.max(...byHour, 1);

  function heatBg(secs: number) {
    if (secs === 0) return "#E7E5E4";
    const intensity = secs / max;
    if (intensity < 0.25) return "#E8C49A";
    if (intensity < 0.5) return "#C4A484";
    if (intensity < 0.75) return "#D4956A";
    return "#B8860B";
  }

  const amHours = Array.from({ length: 12 }, (_, i) => i);      // 0–11
  const pmHours = Array.from({ length: 12 }, (_, i) => i + 12); // 12–23

  function hourLabel(h: number) {
    if (h === 0) return "12am";
    if (h === 12) return "12pm";
    return h < 12 ? `${h}am` : `${h - 12}pm`;
  }

  return (
    <div className="space-y-3">
      {[amHours, pmHours].map((group, gi) => (
        <div key={gi}>
          <p className="text-[9px] text-stone-400 mb-1">{gi === 0 ? "AM" : "PM"}</p>
          <div className="flex gap-1">
            {group.map(h => (
              <div key={h} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full h-6 rounded-sm"
                  style={{ backgroundColor: heatBg(byHour[h]) }}
                  title={`${hourLabel(h)}: ${byHour[h] > 0 ? `${fmt(byHour[h])} total studied` : "no sessions at this hour"}`}
                />
                <span className="text-[8px] text-stone-400">{hourLabel(h)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── History Content ───────────────────────────────────────────────────────────

function HistoryContent({ user }: { user: User }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessionPage, setSessionPage] = useState(0);
  const sessionsCardRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("history-view");
      if (saved === "day" || saved === "week" || saved === "month") return saved;
    }
    return "day";
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const sc = loadShortcuts();
      if (matchesShortcut(e, sc.timer)) router.push("/");
      if (matchesShortcut(e, sc.stats)) router.push("/stats");
      if (matchesShortcut(e, sc.history)) router.push("/history");
      if (matchesShortcut(e, sc.settings)) router.push("/settings");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    supabase.from("sessions").select("*").eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .then(({ data }) => { if (data) setSessions(data as Session[]); });

    supabase.from("tasks").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setTasks(data as Task[]); });
  }, [user.id]);

  // Build bars based on view
  const now = new Date();
  let bars: { label: string; seconds: number }[] = [];

  if (view === "day") {
    // Last 24 hours by hour
    bars = Array.from({ length: 24 }, (_, h) => {
      const secs = sessions
        .filter(s => {
          const d = new Date(s.started_at);
          return d.toDateString() === now.toDateString() && d.getHours() === h;
        })
        .reduce((sum, s) => sum + s.duration_seconds, 0);
      return {
        label: h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`,
        seconds: secs,
      };
    });
  } else if (view === "week") {
    // Last 7 days
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    bars = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const secs = sessions
        .filter(s => new Date(s.started_at).toDateString() === d.toDateString())
        .reduce((sum, s) => sum + s.duration_seconds, 0);
      return { label: days[d.getDay()], seconds: secs };
    });
  } else {
    // Last 30 days
    bars = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (29 - i));
      const secs = sessions
        .filter(s => new Date(s.started_at).toDateString() === d.toDateString())
        .reduce((sum, s) => sum + s.duration_seconds, 0);
      return { label: d.getDate() === 1 || i === 0 ? `${d.getDate()}/${d.getMonth() + 1}` : `${d.getDate()}`, seconds: secs };
    });
  }

  const maxVal = Math.max(...bars.map(b => b.seconds), 1);
  const totalInView = bars.reduce((sum, b) => sum + b.seconds, 0);

  // Recent sessions list
  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(sessions.length / PAGE_SIZE);
  const pageSessions = sessions.slice(sessionPage * PAGE_SIZE, (sessionPage + 1) * PAGE_SIZE);
  const taskMap: Record<string, string> = {};
  tasks.forEach(t => { taskMap[t.id] = t.name; });

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 gap-8 max-w-2xl mx-auto">
      <SettingsGear />
      <div className="flex w-full justify-between items-center">
        <div className="flex items-center gap-3">
          <p className="text-xs text-stone-400 tracking-widest uppercase">{todayLabel()}</p>
          <LockInButton />
        </div>
        <Nav />
      </div>

      <div className="w-full">
        <h2 className="text-3xl text-stone-700" style={{ fontFamily: "var(--font-lora), serif", fontWeight: 500 }}>
          History
        </h2>
      </div>

      {/* Time block chart */}
      <div className="w-full bg-white/50 border border-stone-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide">Study time</p>
            <p className="font-mono text-xl text-stone-700 mt-0.5">{fmt(totalInView)}</p>
          </div>
          <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
            {(["day", "week", "month"] as View[]).map(v => (
              <button
                key={v}
                onClick={() => { setView(v); localStorage.setItem("history-view", v); }}
                className={`text-[10px] px-2.5 py-1 rounded-md transition-colors font-medium capitalize ${
                  view === v ? "bg-white text-stone-700 shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <BarChart bars={bars} maxVal={maxVal} />
      </div>

      {/* Hour tendency */}
      <div className="w-full bg-white/50 border border-stone-200 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">When you study</p>
            <p className="text-xs text-stone-400">Study tendency by hour of day — all time</p>
          </div>
          {/* Legend */}
          <div className="flex flex-col gap-1.5 text-right">
            {[
              { color: "#E7E5E4", label: "No session" },
              { color: "#E8C49A", label: "Light" },
              { color: "#C4A484", label: "Moderate" },
              { color: "#D4956A", label: "Heavy" },
              { color: "#B8860B", label: "Most active" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 justify-end">
                <span className="text-[9px] text-stone-400">{label}</span>
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
              </div>
            ))}
          </div>
        </div>
        <HourHeatmap sessions={sessions} />
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div ref={sessionsCardRef} className="w-full bg-white/50 border border-stone-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-stone-400 uppercase tracking-wide">Recent sessions</p>
            {totalPages > 1 && (
              <p className="text-xs text-stone-400">{sessionPage + 1} / {totalPages}</p>
            )}
          </div>
          <ul className="space-y-2">
            {pageSessions.map(s => (
              <li key={s.id} className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-stone-600">
                    {taskMap[s.task_id ?? ""] ?? "Untagged"}
                  </span>
                  <span className="text-stone-400 text-xs ml-2">
                    {new Date(s.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {" · "}
                    {new Date(s.started_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <span className="font-mono text-stone-700">{fmt(s.duration_seconds)}</span>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100">
              <button
                onClick={() => { setSessionPage(p => p - 1); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 0); }}
                disabled={sessionPage === 0}
                className="text-xs text-stone-400 hover:text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Newer
              </button>
              <button
                onClick={() => { setSessionPage(p => p + 1); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 0); }}
                disabled={sessionPage >= totalPages - 1}
                className="text-xs text-stone-400 hover:text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Older →
              </button>
            </div>
          )}
        </div>
      )}

      {sessions.length === 0 && (
        <p className="text-stone-400 text-sm">No sessions yet — start a session on the timer page.</p>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push("/");
      else setUser(data.session.user);
      setLoading(false);
    });
  }, [router]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center text-stone-400 text-sm">Loading…</div>
  );

  return user ? <HistoryContent user={user} /> : null;
}
