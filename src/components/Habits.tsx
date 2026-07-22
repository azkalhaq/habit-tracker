"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Pencil, Trash2, Archive } from "lucide-react";
import { useApp } from "@/lib/app-context";
import {
  calculateCompletionRate,
  calculateCurrentStreak,
  calculateLongestStreak,
  filterHabits,
  habitsDueOn,
  isCompletedOn,
} from "@/lib/habits";
import { addLocalDays, formatDisplayDate, todayLocal } from "@/lib/date";
import type { Habit, HabitScheduleType } from "@/lib/types";
import { HABIT_COLORS } from "@/lib/types";
import {
  EmptyState,
  IconButton,
  PrimaryButton,
  SecondaryButton,
  SectionCard,
} from "@/components/ui";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HabitForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Habit;
  onSubmit: (data: {
    name: string;
    description?: string;
    color: string;
    scheduleType: HabitScheduleType;
    customDays: number[];
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [color, setColor] = useState(initial?.color ?? HABIT_COLORS[0]);
  const [scheduleType, setScheduleType] = useState<HabitScheduleType>(
    initial?.scheduleType ?? "daily",
  );
  const [customDays, setCustomDays] = useState<number[]>(
    initial?.customDays ?? [1, 2, 3, 4, 5],
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          scheduleType,
          customDays,
        });
      }}
    >
      <label className="block text-sm font-medium text-ink-soft">
        Name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full touch-target rounded-xl border border-line bg-white px-3 text-ink"
          placeholder="Morning stretch"
        />
      </label>

      <label className="block text-sm font-medium text-ink-soft">
        Notes
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-ink"
          placeholder="Optional"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-ink-soft">Color</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {HABIT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              onClick={() => setColor(c)}
              className={`touch-target h-11 w-11 rounded-full border-2 ${
                color === c ? "border-ink scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium text-ink-soft">
        Schedule
        <select
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value as HabitScheduleType)}
          className="mt-1 w-full touch-target rounded-xl border border-line bg-white px-3 text-ink"
        >
          <option value="daily">Daily</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekends">Weekends</option>
          <option value="custom">Custom</option>
        </select>
      </label>

      {scheduleType === "custom" && (
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, day) => {
            const on = customDays.includes(day);
            return (
              <button
                key={label}
                type="button"
                onClick={() =>
                  setCustomDays((prev) =>
                    on ? prev.filter((d) => d !== day) : [...prev, day].sort(),
                  )
                }
                className={`touch-target rounded-xl px-3 text-sm font-medium ${
                  on ? "bg-teal text-white" : "border border-line bg-white text-ink-soft"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <PrimaryButton type="submit">{initial ? "Save" : "Create habit"}</PrimaryButton>
        <SecondaryButton type="button" onClick={onCancel}>
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}

export function HabitCheckRow({
  habit,
  date = todayLocal(),
}: {
  habit: Habit;
  date?: string;
}) {
  const { completions, toggleCompletion } = useApp();
  const done = isCompletedOn(completions, habit.id, date);
  const streak = calculateCurrentStreak(habit, completions, date);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line/60 bg-white/70 px-3 py-2">
      <button
        type="button"
        onClick={() => toggleCompletion(habit.id, date)}
        aria-pressed={done}
        aria-label={done ? `Mark ${habit.name} incomplete` : `Complete ${habit.name}`}
        className={`touch-target flex shrink-0 items-center justify-center rounded-xl transition ${
          done ? "text-white" : "border border-line bg-surface text-muted"
        }`}
        style={done ? { backgroundColor: habit.color } : undefined}
      >
        <Check className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-medium ${done ? "text-muted line-through" : "text-ink"}`}>
          {habit.name}
        </p>
        <p className="text-xs text-muted">
          {streak > 0 ? `${streak}-day streak` : "No streak yet"} · {habit.scheduleType}
        </p>
      </div>
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: habit.color }}
        aria-hidden
      />
    </div>
  );
}

export function TodayHabits() {
  const { habits, hydrated } = useApp();
  const today = todayLocal();
  const due = useMemo(() => habitsDueOn(habits, today), [habits, today]);

  if (!hydrated) {
    return <SectionCard><p className="text-sm text-muted">Loading…</p></SectionCard>;
  }

  if (due.length === 0) {
    return (
      <SectionCard>
        <EmptyState
          title="Nothing due today"
          description="Add a habit or check that your schedules include today."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-ink">
          Today&apos;s habits
        </h2>
        <p className="text-xs text-muted">{formatDisplayDate(today)}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {due.map((h) => (
          <li key={h.id}>
            <HabitCheckRow habit={h} />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export function HabitsManager() {
  const {
    habits,
    completions,
    addHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    reorderHabits,
    hydrated,
  } = useApp();

  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [scheduleFilter, setScheduleFilter] = useState<HabitScheduleType | "all">("all");
  const [editing, setEditing] = useState<Habit | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () =>
      filterHabits(habits, {
        query,
        archived: showArchived ? "all" : false,
        scheduleType: scheduleFilter,
      }),
    [habits, query, showArchived, scheduleFilter],
  );

  const activeIds = filtered.filter((h) => !h.archived).map((h) => h.id);

  if (!hydrated) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search habits…"
          className="touch-target w-full flex-1 rounded-xl border border-line bg-white px-3 text-ink"
          aria-label="Search habits"
        />
        <select
          value={scheduleFilter}
          onChange={(e) => setScheduleFilter(e.target.value as HabitScheduleType | "all")}
          className="touch-target rounded-xl border border-line bg-white px-3 text-sm text-ink"
          aria-label="Filter by schedule"
        >
          <option value="all">All schedules</option>
          <option value="daily">Daily</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekends">Weekends</option>
          <option value="custom">Custom</option>
        </select>
        <SecondaryButton
          onClick={() => setShowArchived((v) => !v)}
          aria-pressed={showArchived}
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </SecondaryButton>
        <PrimaryButton onClick={() => { setCreating(true); setEditing(null); }}>
          New habit
        </PrimaryButton>
      </div>

      {(creating || editing) && (
        <SectionCard>
          <h2 className="mb-3 font-[family-name:var(--font-fraunces)] text-xl">
            {editing ? "Edit habit" : "New habit"}
          </h2>
          <HabitForm
            initial={editing ?? undefined}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
            }}
            onSubmit={(data) => {
              if (editing) {
                updateHabit(editing.id, data);
              } else {
                addHabit(data);
              }
              setCreating(false);
              setEditing(null);
            }}
          />
        </SectionCard>
      )}

      {filtered.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="No habits yet"
            description="Create your first habit to start building streaks."
            action={
              <PrimaryButton onClick={() => setCreating(true)}>Add habit</PrimaryButton>
            }
          />
        </SectionCard>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((habit) => {
            const from = addLocalDays(todayLocal(), -29);
            const rate = calculateCompletionRate(habit, completions, from);
            const current = calculateCurrentStreak(habit, completions);
            const longest = calculateLongestStreak(habit, completions);
            const idx = activeIds.indexOf(habit.id);

            return (
              <li key={habit.id}>
                <SectionCard className={habit.archived ? "opacity-70" : ""}>
                  <div className="flex flex-wrap items-start gap-3">
                    <span
                      className="mt-1 h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-ink">{habit.name}</h3>
                        {habit.archived && (
                          <span className="rounded-md bg-line px-2 py-0.5 text-xs text-muted">
                            Archived
                          </span>
                        )}
                      </div>
                      {habit.description && (
                        <p className="mt-0.5 text-sm text-muted">{habit.description}</p>
                      )}
                      <p className="mt-2 text-xs text-muted sm:text-sm">
                        {habit.scheduleType} · streak {current} · best {longest} · {rate}% (30d)
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {!habit.archived && idx >= 0 && (
                        <>
                          <IconButton
                            label="Move up"
                            disabled={idx === 0}
                            onClick={() => {
                              if (idx > 0) reorderHabits(habit.id, activeIds[idx - 1]);
                            }}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            label="Move down"
                            disabled={idx === activeIds.length - 1}
                            onClick={() => {
                              if (idx < activeIds.length - 1)
                                reorderHabits(habit.id, activeIds[idx + 1]);
                            }}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </IconButton>
                        </>
                      )}
                      <IconButton
                        label="Edit"
                        onClick={() => {
                          setEditing(habit);
                          setCreating(false);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label={habit.archived ? "Unarchive" : "Archive"}
                        onClick={() => archiveHabit(habit.id, !habit.archived)}
                      >
                        <Archive className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Delete"
                        className="text-danger"
                        onClick={() => {
                          if (confirm(`Delete “${habit.name}”? This cannot be undone.`)) {
                            deleteHabit(habit.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>
                </SectionCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
