"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartColumn,
  Droplets,
  LayoutDashboard,
  Settings,
  Timer,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const NAV = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/habits/", label: "Habits", icon: CalendarDays },
  { href: "/timer/", label: "Timer", icon: Timer },
  { href: "/water/", label: "Water", icon: Droplets },
  { href: "/insights/", label: "Insights", icon: ChartColumn },
] as const;

const PROFILE_LINKS = [
  { href: "/settings/", label: "Settings" },
  { href: "/settings/#reminders", label: "Reminder preferences" },
  { href: "/settings/#data", label: "Import / export" },
  { href: "/settings/#theme", label: "Theme" },
  { href: "/settings/#reset", label: "Data reset" },
] as const;

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

function isActive(pathname: string, href: string): boolean {
  const path = normalizePath(pathname);
  const target = normalizePath(href);
  return path === target;
}

function ProfileMenu({
  align = "right",
}: {
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={`touch-target inline-flex items-center justify-center rounded-xl border border-line bg-surface-elevated text-ink transition ${
          open ? "bg-mint/60 text-teal-deep" : "hover:bg-surface"
        }`}
        aria-label="Profile and settings"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <UserRound className="h-5 w-5" />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface-elevated shadow-[var(--shadow-soft)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="border-b border-line/70 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Account
            </p>
          </div>
          <ul className="py-1">
            {PROFILE_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  role="menuitem"
                  href={item.href}
                  className="touch-target flex items-center px-3 text-sm text-ink-soft transition hover:bg-surface hover:text-ink"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const onSettings = normalizePath(pathname) === "/settings";

  return (
    <div className="min-h-dvh lg:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line/70 bg-surface-elevated/95 backdrop-blur-md transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <Link
            href="/"
            className="group touch-target flex items-center gap-2"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal text-white shadow-md transition group-hover:bg-teal-deep">
              <Droplets className="h-5 w-5" aria-hidden />
            </span>
            <span className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tracking-tight text-ink">
              Pulse
            </span>
          </Link>
          <button
            type="button"
            className="touch-target inline-flex items-center justify-center rounded-xl text-ink-soft lg:hidden"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 pb-4" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`touch-target flex items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                  active
                    ? "bg-mint/70 text-teal-deep"
                    : "text-ink-soft hover:bg-surface hover:text-ink"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line/70 px-3 py-4">
          <Link
            href="/settings/"
            onClick={() => setSidebarOpen(false)}
            className={`touch-target flex items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
              onSettings
                ? "bg-mint/70 text-teal-deep"
                : "text-ink-soft hover:bg-surface hover:text-ink"
            }`}
          >
            <Settings className="h-5 w-5 shrink-0" aria-hidden />
            Settings
          </Link>
          <p className="mt-3 px-2 text-xs text-muted">Data stays on this device.</p>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
          aria-label="Dismiss menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line/60 bg-surface/80 px-4 py-3 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-ink lg:hidden"
            >
              Pulse
            </Link>
            <p className="hidden truncate text-sm text-muted lg:block">
              Habit & wellness tracker
            </p>
          </div>
          <ProfileMenu />
        </header>

        <main className="page-shell flex-1 pb-24 pt-4 sm:pt-6 lg:pb-8 lg:pt-8">
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-surface-elevated/95 backdrop-blur-md lg:hidden"
          aria-label="Mobile"
        >
          <ul className="mx-auto grid max-w-[1440px] grid-cols-5 gap-0 px-1 pb-[env(safe-area-inset-bottom)]">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`touch-target flex flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium sm:text-xs ${
                      active ? "text-teal" : "text-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
