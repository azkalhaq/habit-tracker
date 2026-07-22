"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Droplets, Pause, Play, Timer } from "lucide-react";
import { PageHeader, PrimaryButton, SectionCard } from "@/components/ui";
import { TodayHabits } from "@/components/Habits";
import { useApp } from "@/lib/app-context";
import { dailyTotalMl, formatWater, progressPercent } from "@/lib/water";
import {
  dailyTotals,
  getRemainingMsWithDurations,
  modeLabel,
  pauseTimer,
  resumeTimer,
  startTimer,
} from "@/lib/timer";
import {
  formatDurationMinutes,
  formatDisplayDate,
  formatMs,
  todayLocal,
} from "@/lib/date";
import { habitsDueOn, isCompletedOn } from "@/lib/habits";
import { requestNotificationPermission } from "@/lib/notifications";

function TodayTimerCard() {
  const { activeTimer, setActiveTimer, settings, hydrated } = useApp();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (activeTimer.status !== "running") return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, [activeTimer.status]);

  void tick;

  if (!hydrated) {
    return (
      <SectionCard>
        <p className="text-sm text-muted">Loading timer…</p>
      </SectionCard>
    );
  }

  const remaining = getRemainingMsWithDurations(
    activeTimer,
    settings.timerDurations,
    Date.now(),
  );

  const handleStart = async () => {
    if (settings.timerNotifications) await requestNotificationPermission();
    setActiveTimer(
      startTimer(activeTimer, settings.timerDurations, settings.timerCycle),
    );
  };

  return (
    <SectionCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Active timer</p>
          <p className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl text-ink">
            {modeLabel(activeTimer.mode)} · {formatMs(remaining)}
          </p>
          <p className="text-sm capitalize text-muted">{activeTimer.status}</p>
        </div>
        <Timer className="h-6 w-6 text-teal" aria-hidden />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {activeTimer.status === "running" ? (
          <PrimaryButton onClick={() => setActiveTimer(pauseTimer(activeTimer, settings.timerDurations))}>
            <Pause className="h-4 w-4" /> Pause
          </PrimaryButton>
        ) : activeTimer.status === "paused" ? (
          <PrimaryButton onClick={() => setActiveTimer(resumeTimer(activeTimer))}>
            <Play className="h-4 w-4" /> Resume
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={handleStart}>
            <Play className="h-4 w-4" /> Start
          </PrimaryButton>
        )}
        <Link
          href="/timer/"
          className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-elevated px-4 text-sm font-semibold text-ink-soft transition hover:bg-surface"
        >
          Open timer
        </Link>
      </div>
    </SectionCard>
  );
}

function TodayWaterCard() {
  const { waterEntries, settings, addWater, hydrated } = useApp();
  const today = todayLocal();
  const total = dailyTotalMl(waterEntries, today);
  const percent = progressPercent(total, settings.waterGoalMl);

  if (!hydrated) {
    return (
      <SectionCard>
        <p className="text-sm text-muted">Loading water…</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Water progress</p>
          <p className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl text-ink">
            {formatWater(total, settings.waterUnit)}
          </p>
          <p className="text-sm text-muted">
            {percent}% of {formatWater(settings.waterGoalMl, settings.waterUnit)}
          </p>
        </div>
        <Droplets className="h-6 w-6 text-sky" aria-hidden />
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-sky transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {settings.waterQuickAddsMl.slice(0, 3).map((ml) => (
          <PrimaryButton
            key={ml}
            className="bg-sky hover:bg-sky/90"
            onClick={() => addWater(ml)}
          >
            +{formatWater(ml, settings.waterUnit)}
          </PrimaryButton>
        ))}
        <Link
          href="/water/"
          className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-elevated px-4 text-sm font-semibold text-ink-soft transition hover:bg-surface"
        >
          Water details
        </Link>
      </div>
    </SectionCard>
  );
}

export default function TodayPage() {
  const { habits, completions, timerSessions, hydrated } = useApp();
  const today = todayLocal();
  const due = habitsDueOn(habits, today);
  const done = due.filter((h) => isCompletedOn(completions, h.id, today)).length;
  const timer = dailyTotals(timerSessions, today);

  return (
    <div>
      <PageHeader
        title="Today"
        subtitle={
          hydrated
            ? `${formatDisplayDate(today, "EEEE, MMMM d")} · ${done}/${due.length} habits`
            : "…"
        }
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <TodayWaterCard />
        <TodayTimerCard />
      </div>

      {hydrated && (timer.sitMs > 0 || timer.standMs > 0) && (
        <p className="mb-4 text-sm text-muted">
          Movement today: sit {formatDurationMinutes(timer.sitMs)} · stand{" "}
          {formatDurationMinutes(timer.standMs)}
        </p>
      )}

      <TodayHabits />
    </div>
  );
}
