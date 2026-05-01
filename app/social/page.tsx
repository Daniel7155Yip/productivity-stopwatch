"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Session } from "@/lib/supabase";
import { loadShortcuts, loadProfile, matchesShortcut } from "@/app/settings/page";
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

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ email, size = 56, avatarUrl, name }: { email: string; size?: number; avatarUrl?: string; name?: string }) {
  const initial = (name || email).charAt(0).toUpperCase();
  if (avatarUrl) {
    return (
      <div
        className="rounded-full shrink-0"
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${avatarUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: "#C4A484",
        color: "#fff",
        fontSize: size * 0.38,
        fontFamily: "var(--font-lora), serif",
        fontWeight: 500,
      }}
    >
      {initial}
    </div>
  );
}

// ── Social Content ────────────────────────────────────────────────────────────

function SocialContent({ user }: { user: User }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState(() => loadProfile());

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const sc = loadShortcuts();
      if (matchesShortcut(e, sc.timer)) router.push("/");
      if (matchesShortcut(e, sc.stats)) router.push("/stats");
      if (matchesShortcut(e, sc.history)) router.push("/history");
      if (matchesShortcut(e, sc.settings)) router.push("/settings");
      if (matchesShortcut(e, sc.social)) router.push("/social");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .then(({ data }) => { if (data) setSessions(data as Session[]); });
  }, [user.id]);

  const todayStr = new Date().toDateString();
  const todaySeconds = sessions
    .filter(s => new Date(s.started_at).toDateString() === todayStr)
    .reduce((sum, s) => sum + s.duration_seconds, 0);
  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);

  // Week total
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekSeconds = sessions
    .filter(s => new Date(s.started_at) >= weekAgo)
    .reduce((sum, s) => sum + s.duration_seconds, 0);

  function handleCopy() {
    navigator.clipboard.writeText(`${window.location.origin}/social`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 gap-8 max-w-2xl mx-auto">
      <SettingsGear />

      {/* Header */}
      <div className="flex w-full justify-between items-center">
        <div className="flex items-center gap-3">
          <p className="text-xs text-stone-400 tracking-widest uppercase">{todayLabel()}</p>
          <LockInButton />
        </div>
        <Nav />
      </div>

      <div className="w-full">
        <h2 className="text-3xl text-stone-700" style={{ fontFamily: "var(--font-lora), serif", fontWeight: 500 }}>
          Social
        </h2>
      </div>

      {/* Profile card */}
      <div className="w-full bg-white/50 border border-stone-200 rounded-2xl p-6">
        <p className="text-xs text-stone-400 uppercase tracking-wide mb-4">Your profile</p>
        <div className="flex items-center gap-4">
          <Avatar email={user.email ?? "?"} size={56} avatarUrl={profile.avatar} name={profile.name} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-700 truncate">
              {profile.name || user.email}
            </p>
            {profile.name && (
              <p className="text-xs text-stone-400 truncate">{user.email}</p>
            )}
            <p className="text-xs text-stone-400 mt-0.5">{sessions.length} sessions logged</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: "rgba(193,154,107,0.12)", border: "1px solid rgba(193,154,107,0.28)" }}
          >
            <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "#C19A6B" }}>Today</p>
            <p className="font-mono text-lg leading-tight" style={{ color: "#C19A6B", fontVariantNumeric: "tabular-nums" }}>
              {fmt(todaySeconds)}
            </p>
          </div>
          <div className="bg-white/70 border border-stone-200 rounded-xl px-4 py-3">
            <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">This week</p>
            <p className="font-mono text-lg text-stone-700 leading-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
              {fmt(weekSeconds)}
            </p>
          </div>
          <div className="bg-white/70 border border-stone-200 rounded-xl px-4 py-3">
            <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">All time</p>
            <p className="font-mono text-lg text-stone-700 leading-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
              {fmt(totalSeconds)}
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="w-full bg-white/50 border border-stone-200 rounded-2xl p-6">
        <p className="text-xs text-stone-400 uppercase tracking-wide mb-4">Leaderboard</p>

        {/* Own entry */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-3"
          style={{ backgroundColor: "rgba(193,154,107,0.10)", border: "1px solid rgba(193,154,107,0.22)" }}
        >
          <span className="text-xs font-mono text-stone-400 w-5 text-center">1</span>
          <Avatar email={user.email ?? "?"} size={32} avatarUrl={profile.avatar} name={profile.name} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-stone-700 truncate">{profile.name || user.email}</p>
            <p className="text-[10px] text-stone-400">You</p>
          </div>
          <p className="font-mono text-sm text-stone-700 shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmt(totalSeconds)}
          </p>
        </div>

        {/* Empty slots */}
        {[2, 3, 4].map(rank => (
          <div
            key={rank}
            className="flex items-center gap-3 rounded-xl px-4 py-3 mb-2 opacity-40"
          >
            <span className="text-xs font-mono text-stone-300 w-5 text-center">{rank}</span>
            <div className="w-8 h-8 rounded-full bg-stone-200" />
            <div className="flex-1">
              <div className="h-2.5 w-28 bg-stone-200 rounded-full" />
            </div>
            <div className="h-2.5 w-14 bg-stone-200 rounded-full" />
          </div>
        ))}

        <p className="text-xs text-stone-400 text-center mt-3">
          Add friends to fill the leaderboard.
        </p>
      </div>

      {/* Add friends */}
      <div className="w-full bg-white/50 border border-stone-200 rounded-2xl p-6">
        <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Add friends</p>
        <p className="text-xs text-stone-400 mb-4">
          Invite someone by email or share the app link.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-200 focus:outline-none focus:border-amber-400 text-stone-800 text-sm placeholder:text-stone-300"
            type="email"
            placeholder="friend@example.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") setInviteEmail(""); }}
          />
          <button
            disabled={!inviteEmail.trim()}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#C4A484", color: "#fff" }}
            onClick={() => {
              // Placeholder — no backend yet
              setInviteEmail("");
            }}
          >
            Invite
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-xs text-stone-300">or</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <button
          onClick={handleCopy}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white/60 hover:bg-white/90 transition-colors text-sm text-stone-600"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Copy app link
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function SocialPage() {
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

  return user ? <SocialContent user={user} /> : null;
}
