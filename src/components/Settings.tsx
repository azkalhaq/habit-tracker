"use client";

import { useEffect, useRef, useState } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { useApp } from "@/lib/app-context";
import type { TimerMode, WaterUnit } from "@/lib/types";
import { requestNotificationPermission } from "@/lib/notifications";
import {
  PrimaryButton,
  SecondaryButton,
  SectionCard,
} from "@/components/ui";

function scrollToHash() {
  if (typeof window === "undefined") return;
  const hash = window.location.hash.replace("#", "");
  if (!hash) return;
  const el = document.getElementById(hash);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SettingsPanel() {
  const {
    settings,
    updateSettings,
    exportData,
    importData,
    resetData,
    storageAvailable,
    hydrated,
  } = useApp();

  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    scrollToHash();
    const onHash = () => scrollToHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark =
      settings.theme === "dark" || (settings.theme === "system" && preferDark);
    root.classList.toggle("dark", dark);
    root.dataset.theme = settings.theme;
  }, [hydrated, settings.theme]);

  if (!hydrated) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Export downloaded.");
    setError(null);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const result = importData(text);
      if (result.ok) {
        setMessage("Data imported successfully.");
        setError(null);
      } else {
        setError(result.error ?? "Import failed.");
        setMessage(null);
      }
    } catch {
      setError("Could not read that file.");
      setMessage(null);
    }
  };

  const toggleCycleMode = (mode: TimerMode) => {
    const has = settings.timerCycle.includes(mode);
    let next: TimerMode[];
    if (has) {
      next = settings.timerCycle.filter((m) => m !== mode);
      if (next.length === 0) next = ["sit"];
    } else {
      next = [...settings.timerCycle, mode];
    }
    updateSettings({ timerCycle: next });
  };

  return (
    <div className="flex flex-col gap-4">
      {!storageAvailable && (
        <SectionCard className="border-amber/40 bg-amber/10">
          <p className="text-sm text-ink">
            LocalStorage is unavailable in this browser context. Data is kept in
            memory for this session only and will be lost on refresh.
          </p>
        </SectionCard>
      )}

      <SectionCard id="theme">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Theme
        </h2>
        <p className="mt-1 text-sm text-muted">
          Choose light, dark, or follow your system preference.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["system", "light", "dark"] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => updateSettings({ theme })}
              className={`touch-target rounded-xl px-4 text-sm font-semibold capitalize ${
                settings.theme === theme
                  ? "bg-teal text-white"
                  : "border border-line bg-white text-ink-soft"
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard id="reminders">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Reminder preferences
        </h2>
        <p className="mt-1 text-sm text-muted">
          Reminders only fire while this site can run in the browser — not when it
          is fully closed.
        </p>
        <label className="mt-4 flex min-h-11 items-center gap-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={settings.waterRemindersEnabled}
            onChange={async (e) => {
              const enabled = e.target.checked;
              if (enabled) await requestNotificationPermission();
              updateSettings({ waterRemindersEnabled: enabled });
            }}
            className="h-5 w-5 rounded"
          />
          Enable water reminders
        </label>
        <label className="mt-3 block text-sm font-medium text-ink-soft">
          Water reminder interval (minutes)
          <input
            type="number"
            min={15}
            max={240}
            value={settings.waterReminderIntervalMinutes}
            onChange={(e) =>
              updateSettings({
                waterReminderIntervalMinutes: Math.max(
                  15,
                  Math.min(240, Number(e.target.value) || 60),
                ),
              })
            }
            className="mt-1 w-full max-w-xs touch-target rounded-xl border border-line bg-white px-3"
          />
        </label>
        <div className="mt-4 flex flex-col gap-2">
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={settings.timerNotifications}
              onChange={(e) => updateSettings({ timerNotifications: e.target.checked })}
              className="h-5 w-5 rounded"
            />
            Timer browser notifications
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={settings.timerSound}
              onChange={(e) => updateSettings({ timerSound: e.target.checked })}
              className="h-5 w-5 rounded"
            />
            Timer sound
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={settings.timerVibration}
              onChange={(e) => updateSettings({ timerVibration: e.target.checked })}
              className="h-5 w-5 rounded"
            />
            Timer vibration
          </label>
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Preferences
        </h2>
        <label className="mt-4 block text-sm font-medium text-ink-soft">
          Preferred water unit
          <select
            value={settings.waterUnit}
            onChange={(e) =>
              updateSettings({ waterUnit: e.target.value as WaterUnit })
            }
            className="mt-1 w-full max-w-xs touch-target rounded-xl border border-line bg-white px-3"
          >
            <option value="ml">Millilitres (ml)</option>
            <option value="l">Litres (L)</option>
            <option value="fl_oz">Fluid ounces (fl oz)</option>
          </select>
        </label>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-ink-soft">Timer cycle</legend>
          <p className="mt-1 text-xs text-muted">
            Modes rotate automatically when an interval completes.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["sit", "stand", "break"] as TimerMode[]).map((mode) => {
              const on = settings.timerCycle.includes(mode);
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleCycleMode(mode)}
                  className={`touch-target rounded-xl px-4 text-sm font-semibold capitalize ${
                    on ? "bg-teal text-white" : "border border-line bg-white text-ink-soft"
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">
            Order: {settings.timerCycle.join(" → ")}
          </p>
        </fieldset>
      </SectionCard>

      <SectionCard id="data">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Import / export
        </h2>
        <p className="mt-1 text-sm text-muted">
          Download a JSON backup or restore from a previous export.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryButton onClick={handleExport}>
            <Download className="h-4 w-4" /> Export JSON
          </PrimaryButton>
          <SecondaryButton onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import JSON
          </SecondaryButton>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {message && <p className="mt-3 text-sm text-success">{message}</p>}
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </SectionCard>

      <SectionCard id="reset">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Data reset
        </h2>
        <p className="mt-1 text-sm text-muted">
          Clear habits, completions, timer sessions, water logs, and settings on
          this device. This cannot be undone.
        </p>
        <div className="mt-4">
          <SecondaryButton
            className="text-danger"
            onClick={() => {
              if (
                confirm(
                  "Reset all habits, completions, timer, water, and settings? This cannot be undone.",
                )
              ) {
                resetData();
                setMessage("All data cleared.");
                setError(null);
              }
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset all data
          </SecondaryButton>
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
          About
        </h2>
        <p className="mt-2 text-sm text-muted">
          Pulse stores everything locally in your browser. There is no account and
          no server database.
        </p>
      </SectionCard>
    </div>
  );
}
