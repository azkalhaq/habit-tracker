"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/app-context";
import {
  calculateCompletionRate,
  calculateCurrentStreak,
  calculateLongestStreak,
  getActiveHabits,
  isCompletedOn,
  isHabitScheduledOn,
} from "@/lib/habits";
import { dailyTotalMl, formatWater, progressPercent, weeklyTotalsMl } from "@/lib/water";
import {
  addLocalDays,
  formatDisplayDate,
  getLastNDays,
  getMonthDates,
  getWeekDates,
  todayLocal,
} from "@/lib/date";
import { SectionCard } from "@/components/ui";

type View = "week" | "month";

export function InsightsView() {
  const { habits, completions, waterEntries, settings, hydrated } = useApp();
  const [view, setView] = useState<View>("week");
  const today = todayLocal();
  const from30 = addLocalDays(today, -29);

  const dates = useMemo(
    () => (view === "week" ? getWeekDates(today) : getMonthDates(today)),
    [view, today],
  );

  const active = useMemo(() => getActiveHabits(habits), [habits]);

  const analytics = useMemo(() => {
    const streakLeaders = active
      .map((h) => ({
        habit: h,
        current: calculateCurrentStreak(h, completions, today),
        longest: calculateLongestStreak(h, completions),
        rate: calculateCompletionRate(h, completions, from30, today),
      }))
      .sort((a, b) => b.current - a.current || b.rate - a.rate);

    const last7 = getLastNDays(7, today);
    let scheduled = 0;
    let completed = 0;
    for (const date of last7) {
      for (const habit of active) {
        if (!isHabitScheduledOn(habit, date)) continue;
        scheduled += 1;
        if (isCompletedOn(completions, habit.id, date)) completed += 1;
      }
    }
    const weekRate = scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);

    const waterWeek = weeklyTotalsMl(waterEntries, today);
    const waterDaysHit = waterWeek.filter(
      (d) => d.totalMl >= settings.waterGoalMl,
    ).length;

    const bestStreak = streakLeaders[0]?.current ?? 0;

    return { streakLeaders, weekRate, completed, scheduled, waterWeek, waterDaysHit, bestStreak };
  }, [active, completions, waterEntries, settings.waterGoalMl, today, from30]);

  if (!hydrated) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SectionCard>
          <p className="text-xs uppercase tracking-wide text-muted">Best streak</p>
          <p className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl text-ink">
            {analytics.bestStreak}
          </p>
          <p className="text-xs text-muted">
            {analytics.streakLeaders[0]?.habit.name ?? "No habits yet"} days
          </p>
        </SectionCard>
        <SectionCard>
          <p className="text-xs uppercase tracking-wide text-muted">7-day completion</p>
          <p className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl text-ink">
            {analytics.weekRate}%
          </p>
          <p className="text-xs text-muted">
            {analytics.completed}/{analytics.scheduled} scheduled habits
          </p>
        </SectionCard>
        <SectionCard>
          <p className="text-xs uppercase tracking-wide text-muted">Water goal days</p>
          <p className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl text-ink">
            {analytics.waterDaysHit}/7
          </p>
          <p className="text-xs text-muted">this week</p>
        </SectionCard>
      </div>

      <SectionCard>
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Streaks & completion
        </h2>
        {analytics.streakLeaders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Create habits to see streak analytics.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {analytics.streakLeaders.map(({ habit, current, longest, rate }) => (
              <li
                key={habit.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line/60 bg-white/70 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className="truncate font-medium text-ink">{habit.name}</span>
                </div>
                <p className="text-xs text-muted sm:text-sm">
                  streak {current} · best {longest} · {rate}% (30d)
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard>
        <h2 className="mb-3 font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Weekly water trend
        </h2>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {analytics.waterWeek.map(({ date, totalMl }) => {
            const p = progressPercent(totalMl, settings.waterGoalMl);
            const isToday = date === today;
            return (
              <div key={date} className="flex flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end rounded-lg bg-surface px-1 py-1">
                  <div
                    className={`w-full rounded-md ${isToday ? "bg-sky" : "bg-teal/70"}`}
                    style={{ height: `${Math.max(p, totalMl > 0 ? 8 : 0)}%` }}
                    title={formatWater(totalMl, settings.waterUnit)}
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-xs ${
                    isToday ? "font-bold text-teal" : "text-muted"
                  }`}
                >
                  {formatDisplayDate(date, "EEE")}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView("week")}
          className={`touch-target rounded-xl px-4 text-sm font-semibold ${
            view === "week" ? "bg-teal text-white" : "border border-line bg-white text-ink-soft"
          }`}
        >
          Week
        </button>
        <button
          type="button"
          onClick={() => setView("month")}
          className={`touch-target rounded-xl px-4 text-sm font-semibold ${
            view === "month" ? "bg-teal text-white" : "border border-line bg-white text-ink-soft"
          }`}
        >
          Month
        </button>
      </div>

      <SectionCard className="overflow-x-auto">
        <h2 className="mb-3 font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Habit history
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted">No active habits to show.</p>
        ) : (
          <div className="min-w-0">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `minmax(6rem, 8rem) repeat(${dates.length}, minmax(1.75rem, 1fr))`,
              }}
            >
              <div />
              {dates.map((d) => (
                <div
                  key={d}
                  className="truncate text-center text-[10px] text-muted sm:text-xs"
                  title={formatDisplayDate(d)}
                >
                  {formatDisplayDate(d, view === "week" ? "EEE" : "d")}
                </div>
              ))}
              {active.map((habit) => (
                <div key={habit.id} className="contents">
                  <div className="truncate py-1 text-sm font-medium text-ink" title={habit.name}>
                    {habit.name}
                  </div>
                  {dates.map((d) => {
                    const scheduled = isHabitScheduledOn(habit, d);
                    const done = isCompletedOn(completions, habit.id, d);
                    return (
                      <div key={d} className="flex items-center justify-center py-1">
                        <span
                          className={`h-5 w-5 rounded-md sm:h-6 sm:w-6 ${
                            !scheduled
                              ? "bg-transparent"
                              : done
                                ? ""
                                : "border border-line bg-surface"
                          }`}
                          style={done ? { backgroundColor: habit.color } : undefined}
                          title={
                            !scheduled
                              ? "Not scheduled"
                              : done
                                ? "Completed"
                                : "Missed / pending"
                          }
                          aria-label={`${habit.name} ${d}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard>
        <h2 className="mb-3 font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Water history
        </h2>
        <ul className="flex flex-col gap-2">
          {dates.map((d) => {
            const total = dailyTotalMl(waterEntries, d);
            const p = progressPercent(total, settings.waterGoalMl);
            return (
              <li key={d} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-muted sm:w-28 sm:text-sm">
                  {formatDisplayDate(d, view === "week" ? "EEE d" : "MMM d")}
                </span>
                <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-sky" style={{ width: `${p}%` }} />
                </div>
                <span className="w-20 shrink-0 text-right text-xs tabular-nums text-ink-soft sm:w-28 sm:text-sm">
                  {formatWater(total, settings.waterUnit)}
                </span>
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </div>
  );
}
