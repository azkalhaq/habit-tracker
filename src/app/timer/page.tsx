"use client";

import { PageHeader } from "@/components/ui";
import { SitStandTimer } from "@/components/Timer";

export default function TimerPage() {
  return (
    <div>
      <PageHeader
        title="Timer"
        subtitle="Sit, stand, and break intervals that stay accurate after refresh."
      />
      <SitStandTimer />
    </div>
  );
}
