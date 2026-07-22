"use client";

import { PageHeader } from "@/components/ui";
import { WaterTracker } from "@/components/Water";

export default function WaterPage() {
  return (
    <div>
      <PageHeader
        title="Water"
        subtitle="Log intake toward your daily goal. Values are stored in millilitres."
      />
      <WaterTracker />
    </div>
  );
}
