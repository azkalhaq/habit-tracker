"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — redirects to Insights. */
export default function HistoryRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/insights/");
  }, [router]);
  return <p className="text-sm text-muted">Redirecting to Insights…</p>;
}
