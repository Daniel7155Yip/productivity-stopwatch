"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Nav, LockInButton, SettingsGear } from "@/app/components/Nav";
import type { User } from "@supabase/supabase-js";

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

// ── Default shortcuts ─────────────────────────────────────────────────────────

const DEFAULT_SHORTCUTS = {
  timer: "1",
  stats: "2",
  history: "3",
  settings: "4",
  stopTimer: "Ctrl+Enter",
};

export function loadShortcuts() {
  if (typeof window === "undefined") return DEFAULT_SHORTCUTS;
  try {
    const stored = localStorage.getItem("shortcuts");
    return stored ? { ...DEFAULT_SHORTCUTS, ...JSON.parse(stored) } : DEFAULT_SHORTCUTS;
  } catch { return DEFAULT_SHORTCUTS; }
}

// Match a KeyboardEvent against a stored combo string like "Ctrl+B" or "1"
export function matchesShortcut(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.split("+");
  let needCtrl = false, needAlt = false, needShift = false, needMeta = false;
  let key = "";
  for (const part of parts) {
    if (part === "Ctrl") needCtrl = true;
    else if (part === "Alt") needAlt = true;
    else if (part === "Shift") needShift = true;
    else if (part === "Meta") needMeta = true;
    else key = part;
  }
  if (needCtrl !== e.ctrlKey) return false;
  if (needAlt !== e.altKey) return false;
  if (needShift !== e.shiftKey) return false;
  if (needMeta !== e.metaKey) return false;
  const eventKey = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  return eventKey === key;
}

// ── Format a key combo for display ───────────────────────────────────────────

function formatCombo(keys: string[]): string {
  return keys.join("+");
}

// Translate a KeyboardEvent into a display string like "Ctrl+Shift+B"
function eventToCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Meta");
  const key = e.key;
  // Skip if the key itself is a modifier
  if (!["Control", "Alt", "Shift", "Meta"].includes(key)) {
    parts.push(key.length === 1 ? key.toUpperCase() : key);
  }
  return parts.join("+");
}

// ── Shortcut Recording Overlay ────────────────────────────────────────────────

function RecordingOverlay({
  label,
  currentCombo,
  onSave,
  onCancel,
}: {
  label: string;
  currentCombo: string;
  onSave: (combo: string) => void;
  onCancel: () => void;
}) {
  const [combo, setCombo] = useState(currentCombo);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") { onCancel(); return; }
      if (e.key === "Enter") { onSave(combo); return; }

      const next = eventToCombo(e);
      if (next) setCombo(next);
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [combo, onSave, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: "rgba(28,25,23,0.82)", backdropFilter: "blur(2px)" }}
    >
      <p className="text-stone-300 text-sm tracking-wide uppercase">Editing shortcut for</p>
      <p className="text-white text-xl font-semibold" style={{ fontFamily: "var(--font-lora), serif" }}>{label}</p>

      {/* Key combo display */}
      <div
        className="min-w-[160px] text-center px-6 py-4 rounded-2xl border text-2xl font-mono font-bold tracking-widest"
        style={{
          backgroundColor: "rgba(196,164,132,0.15)",
          borderColor: "rgba(196,164,132,0.5)",
          color: "#E8C49A",
        }}
      >
        {combo || <span className="text-stone-500 text-base font-normal">Press any key…</span>}
      </div>

      <div className="flex gap-6 text-xs text-stone-400 mt-2">
        <span><kbd className="px-1.5 py-0.5 rounded bg-stone-700 text-stone-300 font-mono">Enter</kbd> save</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-stone-700 text-stone-300 font-mono">Esc</kbd> cancel</span>
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

function SettingsContent({ user }: { user: User }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [done, setDone] = useState(false);
  const [shortcuts, setShortcuts] = useState(DEFAULT_SHORTCUTS);
  const [recordingFor, setRecordingFor] = useState<string | null>(null);

  useEffect(() => {
    setShortcuts(loadShortcuts());
  }, []);

  // Keyboard shortcuts for navigation — disabled while recording
  useEffect(() => {
    if (recordingFor) return;
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const sc = loadShortcuts();
      if (matchesShortcut(e, sc.timer)) router.push("/");
      if (matchesShortcut(e, sc.stats)) router.push("/stats");
      if (matchesShortcut(e, sc.history)) router.push("/history");
      if (matchesShortcut(e, sc.settings)) router.push("/settings");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, recordingFor]);

  const saveShortcut = useCallback((id: string, combo: string) => {
    if (!combo) return;
    const updated = { ...shortcuts, [id]: combo };
    setShortcuts(updated);
    localStorage.setItem("shortcuts", JSON.stringify(updated));
    setRecordingFor(null);
  }, [shortcuts]);

  const cancelRecording = useCallback(() => setRecordingFor(null), []);

  async function eraseData() {
    setErasing(true);
    await Promise.all([
      supabase.from("sessions").delete().eq("user_id", user.id),
      supabase.from("tasks").update({ archived: true }).eq("user_id", user.id),
    ]);
    setErasing(false);
    setConfirming(false);
    setDone(true);
  }

  const shortcutRows = [
    { id: "timer",     label: "Lock in" },
    { id: "stats",     label: "Go to Stats" },
    { id: "history",   label: "Go to History" },
    { id: "settings",  label: "Go to Settings" },
    { id: "stopTimer", label: "Stop timer" },
  ];

  return (
    <>
      {/* Recording overlay */}
      {recordingFor && (
        <RecordingOverlay
          label={shortcutRows.find(r => r.id === recordingFor)?.label ?? recordingFor}
          currentCombo={shortcuts[recordingFor as keyof typeof shortcuts] ?? ""}
          onSave={(combo) => saveShortcut(recordingFor, combo)}
          onCancel={cancelRecording}
        />
      )}

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
            Settings
          </h2>
        </div>

        {/* Account */}
        <div className="w-full bg-white/50 border border-stone-200 rounded-xl p-5 space-y-3">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Account</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-stone-500">Signed in as</span>
            <span className="text-stone-700 font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-1">
            <span className="text-stone-500">Sign out of this device</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div className="w-full bg-white/50 border border-stone-200 rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs text-stone-400 uppercase tracking-wide">Keyboard shortcuts</p>
            <p className="text-[10px] text-stone-300">Click a key to edit</p>
          </div>
          <ul className="space-y-2">
            <li className="flex justify-between items-center text-sm">
              <span className="text-stone-500">Start / Pause timer</span>
              <kbd className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600 text-xs font-mono">Space</kbd>
            </li>
            {shortcutRows.map(({ id, label }) => (
              <li key={id} className="flex justify-between items-center text-sm">
                <span className="text-stone-500">{label}</span>
                <kbd
                  onClick={() => setRecordingFor(id)}
                  className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600 text-xs font-mono cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors"
                >
                  {shortcuts[id as keyof typeof shortcuts]}
                </kbd>
              </li>
            ))}
          </ul>
        </div>

        {/* Data */}
        <div className="w-full bg-white/50 border border-rose-100 rounded-xl p-5">
          <p className="text-xs text-rose-400 uppercase tracking-wide mb-3">Data</p>
          {done ? (
            <p className="text-sm text-stone-400">All data has been erased.</p>
          ) : confirming ? (
            <div className="space-y-3">
              <p className="text-sm text-stone-600">This will permanently delete all your sessions and tasks. This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={eraseData}
                  disabled={erasing}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {erasing ? "Erasing…" : "Yes, erase everything"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-stone-600 font-medium">Erase all data</p>
                <p className="text-xs text-stone-400 mt-0.5">Permanently delete all sessions and tasks</p>
              </div>
              <button
                onClick={() => setConfirming(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 transition-colors"
              >
                Erase data
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
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

  return user ? <SettingsContent user={user} /> : null;
}
