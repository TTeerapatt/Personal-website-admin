"use client";

import { FiClock } from "react-icons/fi";
import { formatDateTime } from "./overviewUtils";

type OverviewHeaderProps = {
  loading: boolean;
  lastUpdated?: string | null;
};

export default function OverviewHeader({
  loading,
  lastUpdated = null,
}: OverviewHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 shadow-[0_8px_24px_rgba(36,46,66,0.08)]">
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Nexus control center
          </p>
          <h1 className="mt-2 text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
            Overview
          </h1>
          <p className="mt-2 inline-flex items-center gap-2 text-[12px] font-medium text-[var(--text-muted)]">
            <FiClock className="h-3.5 w-3.5 shrink-0" />
            {loading && !lastUpdated
              ? "Updating status…"
              : `Last updated ${lastUpdated ? formatDateTime(lastUpdated) : "—"}`}
          </p>
        </div>
      </div>
    </section>
  );
}
