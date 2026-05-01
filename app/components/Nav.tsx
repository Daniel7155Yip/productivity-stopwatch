"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/stats", label: "Stats" },
  { href: "/history", label: "History" },
  { href: "/social", label: "Social" },
];

export function Nav({ onLockIn }: { onLockIn?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4">
      {links.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className={`text-xs transition-colors ${
            pathname === l.href
              ? "text-stone-700 font-bold"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function LockInButton({ onLockIn }: { onLockIn?: () => void }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const style = {
    backgroundColor: "#C4A484",
    color: "#fff",
  };

  if (isHome) {
    return (
      <button
        onClick={onLockIn}
        style={style}
        className="text-xs px-4 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
      >
        Lock In
      </button>
    );
  }

  return (
    <Link
      href="/"
      style={style}
      className="text-xs px-4 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
    >
      Lock In
    </Link>
  );
}

export function SettingsGear() {
  const pathname = usePathname();
  return (
    <Link
      href="/settings"
      title="Settings"
      className="fixed top-5 right-6 transition-opacity hover:opacity-70"
      style={{ color: "rgba(120, 113, 108, 0.6)" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </Link>
  );
}
