"use client";

import { PageHeader } from "@/components/ui";
import { InsightsView } from "@/components/Insights";

export default function InsightsPage() {
  return (
    <div>
      <PageHeader
        title="Insights"
        subtitle="Streaks, history, weekly trends, and completion analytics."
      />
      <InsightsView />
    </div>
  );
}
