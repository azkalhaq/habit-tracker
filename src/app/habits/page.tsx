"use client";

import { PageHeader } from "@/components/ui";
import { HabitsManager } from "@/components/Habits";

export default function HabitsPage() {
  return (
    <div>
      <PageHeader
        title="Habits"
        subtitle="Create, schedule, reorder, archive, and review streaks."
      />
      <HabitsManager />
    </div>
  );
}
