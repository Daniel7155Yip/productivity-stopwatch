"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Session, type Task } from "@/lib/supabase";
import { loadShortcuts, matchesShortcut } from "@/app/settings/page";
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

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

// ── Heatmap config ────────────────────────────────────────────────────────────

const HEAT_LEVELS = [
  { max: 0,          color: "#E7E5E4", label: "No session",   range: "" },
  { max: 1 * 3600,   color: "#E8C49A", label: "Light",        range: "0 – 1 hr" },
  { max: 2 * 3600,   color: "#C4A484", label: "Moderate",     range: "1 – 2 hrs" },
  { max: 3 * 3600,   color: "#D4956A", label: "Solid",        range: "2 – 3 hrs" },
  { max: 4 * 3600,   color: "#B8860B", label: "Heavy",        range: "3 – 4 hrs" },
  { max: 6 * 3600,   color: "#8B5E3C", label: "Very heavy",   range: "4 – 6 hrs" },
  { max: Infinity,   color: "#5C3D1E", label: "Most active",  range: "6+ hrs" },
];

function heatColor(seconds: number): string {
  if (seconds === 0) return HEAT_LEVELS[0].color;
  for (const level of HEAT_LEVELS.slice(1)) {
    if (seconds <= level.max) return level.color;
  }
  return HEAT_LEVELS[HEAT_LEVELS.length - 1].color;
}

function heatLabel(seconds: number): string {
  if (seconds === 0) return "No session";
  for (const level of HEAT_LEVELS.slice(1)) {
    if (seconds <= level.max) return `${level.label} · ${level.range}`;
  }
  const last = HEAT_LEVELS[HEAT_LEVELS.length - 1];
  return `${last.label} · ${last.range}`;
}

// ── Legend tooltip ────────────────────────────────────────────────────────────

function HeatLegend() {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex items-center gap-1 mt-3 ml-5"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-[10px] text-stone-400">Less</span>
      {HEAT_LEVELS.map(({ color }) => (
        <div key={color} className="w-3 h-3 rounded-sm cursor-default" style={{ backgroundColor: color }} />
      ))}
      <span className="text-[10px] text-stone-400">More</span>

      {show && (
        <div className="absolute bottom-6 left-0 bg-white border border-stone-200 rounded-xl shadow-lg p-3 z-20 min-w-[160px]">
          <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-2">Colour key</p>
          <ul className="space-y-1.5">
            {HEAT_LEVELS.map(({ color, label, range }) => (
              <li key={color} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-stone-600">{label}</span>
                {range && <span className="text-[10px] text-stone-400 ml-auto">{range}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Day modal ─────────────────────────────────────────────────────────────────

function DayModal({ date, sessions, tasks, onClose }: {
  date: Date;
  sessions: Session[];
  tasks: Task[];
  onClose: () => void;
}) {
  const daySessions = sessions.filter(s =>
    new Date(s.started_at).toDateString() === date.toDateString()
  );
  const total = daySessions.reduce((sum, s) => sum + s.duration_seconds, 0);

  // Time by task
  const taskMap: Record<string, Task> = {};
  tasks.forEach(t => { taskMap[t.id] = t; });
  const byTask: Record<string, number> = {};
  for (const s of daySessions) {
    const key = s.task_id ?? "untagged";
    byTask[key] = (byTask[key] ?? 0) + s.duration_seconds;
  }
  const taskRows = Object.entries(byTask)
    .map(([id, secs]) => ({ name: taskMap[id]?.name ?? "Untagged", secs }))
    .sort((a, b) => b.secs - a.secs);

  // Hourly bar chart
  const byHour: number[] = Array(24).fill(0);
  for (const s of daySessions) {
    byHour[new Date(s.started_at).getHours()] += s.duration_seconds;
  }
  const maxHour = Math.max(...byHour, 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
      onClick={onClose}
    >
      <div className="bg-amber-50 border border-stone-200 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide">
              {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            <p className="font-mono text-3xl text-stone-700 mt-1">{fmt(total)}</p>
            <p className="text-xs text-stone-400 mt-0.5">total studied</p>
          </div>
          <button onClick={onClose} className="text-stone-300 hover:text-stone-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Hourly bar chart */}
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">By hour</p>
          <div className="flex items-end gap-[2px] h-16">
            {byHour.map((secs, h) => (
              <div key={h} className="flex flex-col items-center flex-1 gap-[2px]">
                <div className="w-full flex flex-col justify-end" style={{ height: "52px" }}>
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: `${(secs / maxHour) * 100}%`,
                      minHeight: secs > 0 ? "2px" : "0",
                      backgroundColor: secs > 0 ? "#C4A484" : "#E7E5E4",
                    }}
                    title={`${h}:00 — ${secs > 0 ? fmt(secs) : "no session"}`}
                  />
                </div>
                {(h % 6 === 0) && (
                  <span className="text-[7px] text-stone-400">{h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h-12}p`}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Time by task */}
        {taskRows.length > 0 && (
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">By task</p>
            <ul className="space-y-1.5">
              {taskRows.map(({ name, secs }) => (
                <li key={name} className="flex justify-between text-sm">
                  <span className="text-stone-600">{name}</span>
                  <span className="font-mono text-stone-700">{fmt(secs)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {total === 0 && (
          <p className="text-stone-400 text-sm text-center py-2">No sessions on this day.</p>
        )}
      </div>
    </div>
  );
}

// ── Contribution grid ─────────────────────────────────────────────────────────

function ContributionGrid({ sessions, tasks }: { sessions: Session[]; tasks: Task[] }) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const byDate: Record<string, number> = {};
  for (const s of sessions) {
    const key = dateKey(new Date(s.started_at));
    byDate[key] = (byDate[key] ?? 0) + s.duration_seconds;
  }

  const today = new Date();
  const dayOfWeek = today.getDay();
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setDate(start.getDate() - (51 * 7 + dayOfWeek));

  const weeks: Date[][] = [];
  const current = new Date(start);
  while (current <= end) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const monthLabels = weeks.map((week, i) => {
    if (i === 0) return week[0].toLocaleDateString(undefined, { month: "short" });
    const hasFirst = week.some(d => d.getDate() === 1);
    if (hasFirst) {
      const day1 = week.find(d => d.getDate() === 1)!;
      return day1.toLocaleDateString(undefined, { month: "short" });
    }
    return null;
  });

  // Streak calculation
  const allDays = weeks.flat();
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  for (let i = allDays.length - 1; i >= 0; i--) {
    const key = dateKey(allDays[i]);
    if (byDate[key] > 0) {
      streak++;
      if (currentStreak === 0) currentStreak = streak;
    } else {
      if (currentStreak === 0 && i === allDays.length - 1) {
        // no session today yet — don't break yesterday's streak
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 0;
      }
    }
  }
  longestStreak = Math.max(longestStreak, streak);

  return (
    <div className="w-full space-y-6">
      {selectedDay && (
        <DayModal
          date={selectedDay}
          sessions={sessions}
          tasks={tasks}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Streak stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-100/60 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-xs text-amber-700 uppercase tracking-wide mb-1">Current streak</p>
          <p className="text-3xl font-semibold text-amber-800">{currentStreak} <span className="text-sm font-normal">days</span></p>
        </div>
        <div className="bg-white/50 border border-stone-200 rounded-xl px-5 py-4">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Longest streak</p>
          <p className="text-3xl font-semibold text-stone-700">{longestStreak} <span className="text-sm font-normal">days</span></p>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white/50 border border-stone-200 rounded-2xl p-6 overflow-x-auto">
        <p className="text-xs text-stone-400 uppercase tracking-wide mb-3">Study streak — last 52 weeks</p>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mt-4 mr-1">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day, i) => (
              <div key={day} className="h-3 text-[9px] text-stone-400 flex items-center">
                {i === 1 ? "M" : i === 3 ? "W" : i === 5 ? "F" : ""}
              </div>
            ))}
          </div>

          {/* Month labels + cells */}
          <div>
            <div className="flex gap-[3px] mb-1">
              {weeks.map((_, i) => (
                <div key={i} className="w-3 text-[9px] text-stone-400 shrink-0">{monthLabels[i] ?? ""}</div>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => {
                    const key = dateKey(day);
                    const secs = byDate[key] ?? 0;
                    const isFuture = day > end;
                    return (
                      <div
                        key={di}
                        title={`${day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}: ${secs > 0 ? `${fmt(secs)} — ${heatLabel(secs)}` : "No session"}`}
                        className={`w-3 h-3 rounded-sm transition-opacity ${isFuture ? "cursor-default" : "cursor-pointer hover:opacity-70"}`}
                        style={{ backgroundColor: isFuture ? "#F5F4F3" : heatColor(secs) }}
                        onClick={() => { if (!isFuture) setSelectedDay(day); }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <HeatLegend />
      </div>
    </div>
  );
}

// ── Stats page ────────────────────────────────────────────────────────────────

type Period = "daily" | "weekly" | "monthly" | "yearly" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  all: "All Time",
};

function filterByPeriod(sessions: Session[], period: Period): Session[] {
  const now = new Date();
  return sessions.filter(s => {
    const d = new Date(s.started_at);
    if (period === "daily") return d.toDateString() === now.toDateString();
    if (period === "weekly") {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    if (period === "monthly") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "yearly") return d.getFullYear() === now.getFullYear();
    return true;
  });
}

const TASK_COLORS = [
  "#E8A87C", "#C4A484", "#D4956A", "#E8C49A", "#B8860B", "#CD853F",
];

function StatsContent({ user }: { user: User }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [period, setPeriod] = useState<Period>("daily");

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

  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);
  const todayStr = new Date().toDateString();
  const todaySeconds = sessions
    .filter(s => new Date(s.started_at).toDateString() === todayStr)
    .reduce((sum, s) => sum + s.duration_seconds, 0);

  const filtered = filterByPeriod(sessions, period);
  const filteredTotal = filtered.reduce((sum, s) => sum + s.duration_seconds, 0);

  const taskColorMap: Record<string, string> = {};
  tasks.forEach((t, i) => { taskColorMap[t.id] = TASK_COLORS[i % TASK_COLORS.length]; });

  const byTask: { name: string; seconds: number; color: string }[] = [];
  for (const task of tasks) {
    const secs = filtered.filter(s => s.task_id === task.id).reduce((sum, s) => sum + s.duration_seconds, 0);
    if (secs > 0) byTask.push({ name: task.name, seconds: secs, color: taskColorMap[task.id] });
  }
  const untagged = filtered.filter(s => !s.task_id).reduce((sum, s) => sum + s.duration_seconds, 0);
  if (untagged > 0) byTask.push({ name: "Untagged", seconds: untagged, color: "#A8A29E" });
  byTask.sort((a, b) => b.seconds - a.seconds);

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
        <h2 className="text-3xl text-stone-700" style={{ fontFamily: "var(--font-lora), serif", fontWeight: 500 }}>Stats</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="bg-white/50 border border-stone-200 rounded-xl px-5 py-4">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Today</p>
          <p className="font-mono text-2xl text-stone-700">{fmt(todaySeconds)}</p>
        </div>
        <div className="bg-white/50 border border-stone-200 rounded-xl px-5 py-4">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">All time</p>
          <p className="font-mono text-2xl text-stone-700">{fmt(totalSeconds)}</p>
        </div>
      </div>

      <ContributionGrid sessions={sessions} tasks={tasks} />

      <div className="w-full bg-white/50 border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-stone-400 uppercase tracking-wide">Time by task</p>
          <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-[10px] px-2.5 py-1 rounded-md transition-colors font-medium ${
                  period === p ? "bg-white text-stone-700 shadow-sm" : "text-stone-400 hover:text-stone-600"
                }`}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        {byTask.length === 0 ? (
          <p className="text-stone-400 text-sm">No sessions for this period.</p>
        ) : (
          <ul className="space-y-3">
            {byTask.map(({ name, seconds, color }) => {
              const pct = filteredTotal > 0 ? Math.round((seconds / filteredTotal) * 100) : 0;
              return (
                <li key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-stone-600">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      {name}
                    </span>
                    <span className="font-mono text-stone-700">{fmt(seconds)}</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {sessions.length === 0 && (
        <p className="text-stone-400 text-sm">No sessions yet — start a session on the timer page.</p>
      )}
    </div>
  );
}

export default function StatsPage() {
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

  return user ? <StatsContent user={user} /> : null;
}
