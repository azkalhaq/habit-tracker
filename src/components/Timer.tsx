"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useApp } from "@/lib/app-context";
import {
  completeInterval,
  dailyTotals,
  durationMsForMode,
  getRemainingMsWithDurations,
  modeLabel,
  pauseTimer,
  resetTimer,
  resumeTimer,
  skipWithSession,
  startTimer,
} from "@/lib/timer";
import { formatDurationMinutes, formatMs } from "@/lib/date";
import { alertUser, requestNotificationPermission } from "@/lib/notifications";
import type { TimerMode } from "@/lib/types";
import { IconButton, PrimaryButton, SecondaryButton, SectionCard } from "@/components/ui";

const MODES: TimerMode[] = ["sit", "stand", "break"];

export function SitStandTimer() {
  const {
    activeTimer,
    setActiveTimer,
    addTimerSession,
    timerSessions,
    settings,
    updateSettings,
    hydrated,
  } = useApp();

  const [tick, setTick] = useState(0);
  const completingRef = useRef(false);

  const remaining = getRemainingMsWithDurations(
    activeTimer,
    settings.timerDurations,
    Date.now(),
  );
  const total = durationMsForMode(activeTimer.mode, settings.timerDurations);
  const progress = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 0;
  const totals = dailyTotals(timerSessions);

  useEffect(() => {
    if (activeTimer.status !== "running") return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, [activeTimer.status]);

  const onIntervalComplete = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    try {
      const { state, session } = completeInterval(
        activeTimer,
        settings.timerDurations,
        settings.timerCycle,
      );
      addTimerSession(session);
      setActiveTimer(state);
      await alertUser({
        title: `${modeLabel(session.mode)} done`,
        body: `Starting ${modeLabel(state.mode)} — ${durationMsForMode(state.mode, settings.timerDurations) / 60000} min`,
        notification: settings.timerNotifications,
        sound: settings.timerSound,
        vibration: settings.timerVibration,
      });
    } finally {
      completingRef.current = false;
    }
  }, [activeTimer, settings, addTimerSession, setActiveTimer]);

  useEffect(() => {
    if (activeTimer.status !== "running") return;
    if (remaining <= 0) {
      void onIntervalComplete();
    }
    // tick forces re-check after wall-clock advances (including after tab sleep)
  }, [activeTimer.status, remaining, tick, onIntervalComplete]);

  // Reconcile after visibility change / mount using endsAt timestamps
  useEffect(() => {
    if (!hydrated) return;
    if (activeTimer.status === "running" && activeTimer.endsAt != null) {
      if (Date.now() >= activeTimer.endsAt) {
        void onIntervalComplete();
      }
    }
  }, [hydrated, activeTimer, onIntervalComplete]);

  const handleStart = async () => {
    if (settings.timerNotifications) {
      await requestNotificationPermission();
    }
    setActiveTimer(
      startTimer(activeTimer, settings.timerDurations, settings.timerCycle),
    );
  };

  const handlePause = () => {
    setActiveTimer(pauseTimer(activeTimer, settings.timerDurations));
  };

  const handleResume = () => {
    setActiveTimer(resumeTimer(activeTimer));
  };

  const handleReset = () => {
    setActiveTimer(resetTimer(settings.timerDurations, settings.timerCycle));
  };

  const handleSkip = () => {
    const { state, session } = skipWithSession(
      activeTimer,
      settings.timerDurations,
      settings.timerCycle,
    );
    if (session.durationMs > 0) addTimerSession(session);
    setActiveTimer(state);
  };

  const setMode = (mode: TimerMode) => {
    if (activeTimer.status === "running") return;
    const cycle = settings.timerCycle.includes(mode)
      ? settings.timerCycle
      : [...settings.timerCycle, mode];
    const cycleIndex = Math.max(0, cycle.indexOf(mode));
    setActiveTimer({
      mode,
      endsAt: null,
      remainingMs: durationMsForMode(mode, settings.timerDurations),
      status: "idle",
      cycleIndex,
      updatedAt: Date.now(),
    });
  };

  if (!hydrated) {
    return <SectionCard><p className="text-sm text-muted">Loading timer…</p></SectionCard>;
  }

  const modeColors: Record<TimerMode, string> = {
    sit: "bg-sky",
    stand: "bg-coral",
    break: "bg-amber",
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionCard className="overflow-hidden">
        <div className="flex flex-wrap gap-2">
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={activeTimer.status === "running"}
              onClick={() => setMode(mode)}
              className={`touch-target rounded-xl px-4 text-sm font-semibold transition ${
                activeTimer.mode === mode
                  ? `${modeColors[mode]} text-white`
                  : "border border-line bg-white text-ink-soft"
              }`}
            >
              {modeLabel(mode)}
            </button>
          ))}
        </div>

        <div className="relative mx-auto mt-8 flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-line"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
              className="text-teal transition-[stroke-dashoffset] duration-300"
            />
          </svg>
          <div className="relative text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-muted">
              {modeLabel(activeTimer.mode)}
            </p>
            <p className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold tabular-nums text-ink sm:text-6xl">
              {formatMs(remaining)}
            </p>
            <p className="mt-1 text-xs capitalize text-muted">{activeTimer.status}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {activeTimer.status === "running" ? (
            <PrimaryButton onClick={handlePause}>
              <Pause className="h-4 w-4" /> Pause
            </PrimaryButton>
          ) : activeTimer.status === "paused" ? (
            <PrimaryButton onClick={handleResume}>
              <Play className="h-4 w-4" /> Resume
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={handleStart}>
              <Play className="h-4 w-4" /> Start
            </PrimaryButton>
          )}
          <SecondaryButton onClick={handleSkip}>
            <SkipForward className="h-4 w-4" /> Skip
          </SecondaryButton>
          <IconButton label="Reset" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </IconButton>
        </div>
      </SectionCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <SectionCard>
          <p className="text-xs uppercase tracking-wide text-muted">Sitting today</p>
          <p className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl text-ink">
            {formatDurationMinutes(totals.sitMs)}
          </p>
        </SectionCard>
        <SectionCard>
          <p className="text-xs uppercase tracking-wide text-muted">Standing today</p>
          <p className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl text-ink">
            {formatDurationMinutes(totals.standMs)}
          </p>
        </SectionCard>
        <SectionCard>
          <p className="text-xs uppercase tracking-wide text-muted">Breaks today</p>
          <p className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl text-ink">
            {formatDurationMinutes(totals.breakMs)}
          </p>
        </SectionCard>
      </div>

      <SectionCard>
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Durations
        </h2>
        <p className="mt-1 text-sm text-muted">
          Default cycle: sit {settings.timerDurations.sitMinutes}m → stand{" "}
          {settings.timerDurations.standMinutes}m
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {([
            ["sitMinutes", "Sit (min)"],
            ["standMinutes", "Stand (min)"],
            ["breakMinutes", "Break (min)"],
          ] as const).map(([key, label]) => (
            <label key={key} className="block text-sm font-medium text-ink-soft">
              {label}
              <input
                type="number"
                min={1}
                max={180}
                disabled={activeTimer.status === "running"}
                value={settings.timerDurations[key]}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(180, Number(e.target.value) || 1));
                  updateSettings({
                    timerDurations: { ...settings.timerDurations, [key]: value },
                  });
                  if (activeTimer.status !== "running") {
                    const modeKey =
                      key === "sitMinutes" ? "sit" : key === "standMinutes" ? "stand" : "break";
                    if (activeTimer.mode === modeKey) {
                      setActiveTimer({
                        ...activeTimer,
                        remainingMs: value * 60_000,
                        endsAt: null,
                        updatedAt: Date.now(),
                      });
                    }
                  }
                }}
                className="mt-1 w-full touch-target rounded-xl border border-line bg-white px-3 text-ink"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={settings.timerNotifications}
              onChange={(e) => updateSettings({ timerNotifications: e.target.checked })}
              className="h-5 w-5 rounded"
            />
            Browser notifications
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={settings.timerSound}
              onChange={(e) => updateSettings({ timerSound: e.target.checked })}
              className="h-5 w-5 rounded"
            />
            Sound
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={settings.timerVibration}
              onChange={(e) => updateSettings({ timerVibration: e.target.checked })}
              className="h-5 w-5 rounded"
            />
            Vibration
          </label>
        </div>
      </SectionCard>
    </div>
  );
}
