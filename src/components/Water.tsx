"use client";

import { useEffect, useMemo, useState } from "react";
import { BellOff, Droplets, Trash2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import {
  dailyTotalMl,
  formatWater,
  fromMl,
  progressPercent,
  shouldRemind,
  toMl,
  unitLabel,
  weeklyTotalsMl,
} from "@/lib/water";
import { formatDisplayDate, todayLocal } from "@/lib/date";
import { alertUser, requestNotificationPermission } from "@/lib/notifications";
import type { WaterUnit } from "@/lib/types";
import {
  EmptyState,
  IconButton,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
} from "@/components/ui";

export function WaterTracker() {
  const {
    waterEntries,
    waterReminder,
    settings,
    addWater,
    removeWater,
    setWaterReminder,
    updateSettings,
    hydrated,
  } = useApp();

  const [customAmount, setCustomAmount] = useState("");
  const today = todayLocal();
  const total = dailyTotalMl(waterEntries, today);
  const percent = progressPercent(total, settings.waterGoalMl);
  const week = weeklyTotalsMl(waterEntries, today);
  const todayEntries = useMemo(
    () =>
      waterEntries
        .filter((e) => e.date === today)
        .sort((a, b) => b.timestamp - a.timestamp),
    [waterEntries, today],
  );

  // Reminder loop — only while this tab can run JS
  useEffect(() => {
    if (!hydrated || !settings.waterRemindersEnabled) return;

    const check = () => {
      if (
        shouldRemind({
          enabled: settings.waterRemindersEnabled,
          intervalMinutes: settings.waterReminderIntervalMinutes,
          lastNotifiedAt: waterReminder.lastNotifiedAt,
          snoozedUntil: waterReminder.snoozedUntil,
          disabledForDate: waterReminder.disabledForDate,
        })
      ) {
        void alertUser({
          title: "Time to hydrate",
          body: `You've had ${formatWater(total, settings.waterUnit)} of ${formatWater(settings.waterGoalMl, settings.waterUnit)} today.`,
          notification: true,
          sound: true,
          vibration: true,
        });
        setWaterReminder({ lastNotifiedAt: Date.now() });
      }
    };

    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [
    hydrated,
    settings.waterRemindersEnabled,
    settings.waterReminderIntervalMinutes,
    settings.waterUnit,
    settings.waterGoalMl,
    waterReminder,
    total,
    setWaterReminder,
  ]);

  if (!hydrated) {
    return <SectionCard><p className="text-sm text-muted">Loading…</p></SectionCard>;
  }

  const unit = settings.waterUnit;

  return (
    <div className="flex flex-col gap-4">
      <SectionCard>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{formatDisplayDate(today)}</p>
            <p className="mt-1 font-[family-name:var(--font-fraunces)] text-4xl text-ink">
              {formatWater(total, unit)}
            </p>
            <p className="text-sm text-muted">
              of {formatWater(settings.waterGoalMl, unit)} · {percent}%
            </p>
          </div>
          <Droplets className="h-10 w-10 text-sky" aria-hidden />
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-sky transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </SectionCard>

      <SectionCard>
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Add water
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {settings.waterQuickAddsMl.map((ml) => (
            <PrimaryButton key={ml} onClick={() => addWater(ml)} className="bg-sky hover:bg-sky/90">
              +{formatWater(ml, unit)}
            </PrimaryButton>
          ))}
        </div>
        <form
          className="mt-4 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(customAmount);
            if (!n || n <= 0) return;
            addWater(toMl(n, unit));
            setCustomAmount("");
          }}
        >
          <label className="block min-w-[8rem] flex-1 text-sm font-medium text-ink-soft">
            Custom ({unitLabel(unit)})
            <input
              type="number"
              min={0.1}
              step="any"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="mt-1 w-full touch-target rounded-xl border border-line bg-white px-3 text-ink"
            />
          </label>
          <PrimaryButton type="submit">Add</PrimaryButton>
        </form>
      </SectionCard>

      <SectionCard>
        <h2 className="mb-3 font-[family-name:var(--font-fraunces)] text-xl text-ink">
          This week
        </h2>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {week.map(({ date, totalMl }) => {
            const p = progressPercent(totalMl, settings.waterGoalMl);
            const isToday = date === today;
            return (
              <div key={date} className="flex flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end rounded-lg bg-surface px-1 py-1">
                  <div
                    className={`w-full rounded-md transition-all ${isToday ? "bg-sky" : "bg-teal/70"}`}
                    style={{ height: `${Math.max(p, totalMl > 0 ? 8 : 0)}%` }}
                    title={formatWater(totalMl, unit)}
                  />
                </div>
                <span className={`text-[10px] sm:text-xs ${isToday ? "font-bold text-teal" : "text-muted"}`}>
                  {formatDisplayDate(date, "EEE")}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
            Today&apos;s log
          </h2>
          <select
            value={unit}
            onChange={(e) => updateSettings({ waterUnit: e.target.value as WaterUnit })}
            className="touch-target rounded-xl border border-line bg-white px-3 text-sm"
            aria-label="Display unit"
          >
            <option value="ml">Millilitres</option>
            <option value="l">Litres</option>
            <option value="fl_oz">Fluid ounces</option>
          </select>
        </div>
        {todayEntries.length === 0 ? (
          <EmptyState title="No entries yet" description="Tap a quick-add button to log water." />
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {todayEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line/60 bg-white/70 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-ink">{formatWater(entry.amountMl, unit)}</p>
                  <p className="text-xs text-muted">
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <IconButton label="Delete entry" onClick={() => removeWater(entry.id)}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard>
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Reminders
        </h2>
        <p className="mt-1 text-sm text-muted">
          Reminders can fire while this site is open in a browser tab. They are not
          guaranteed when the browser is fully closed.
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
          Interval (minutes)
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
        <label className="mt-3 block text-sm font-medium text-ink-soft">
          Daily goal ({unitLabel(unit)})
          <input
            type="number"
            min={1}
            step="any"
            value={fromMl(settings.waterGoalMl, unit)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!n || n <= 0) return;
              updateSettings({ waterGoalMl: toMl(n, unit) });
            }}
            className="mt-1 w-full max-w-xs touch-target rounded-xl border border-line bg-white px-3"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <SecondaryButton
            onClick={() => setWaterReminder({ snoozedUntil: today })}
          >
            Snooze for today
          </SecondaryButton>
          <SecondaryButton
            onClick={() => setWaterReminder({ disabledForDate: today })}
          >
            <BellOff className="h-4 w-4" /> Disable today
          </SecondaryButton>
        </div>
      </SectionCard>
    </div>
  );
}
