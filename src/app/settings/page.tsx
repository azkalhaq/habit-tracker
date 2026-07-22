"use client";

import { PageHeader } from "@/components/ui";
import { SettingsPanel } from "@/components/Settings";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Theme, reminders, preferences, backups, and data reset."
      />
      <SettingsPanel />
    </div>
  );
}
