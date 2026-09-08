"use client";

import { FiBarChart2, FiClock } from "react-icons/fi";
import type { BiRangeDays } from "./biTypes";
import { formatDateTime } from "./biUtils";

const RANGE_OPTIONS: Array<{ value: BiRangeDays; label: string }> = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

type BiHeaderProps = {
  loading: boolean;
  lastUpdated?: string | null;
  rangeDays: BiRangeDays;
  onRangeChange: (days: BiRangeDays) => void;
};

export default function BiHeader({
  loading,
  lastUpdated = null,
  rangeDays,
  onRangeChange,
}: BiHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 shadow-[0_8px_24px_rgba(36,46,66,0.08)]">
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <FiBarChart2 className="h-3.5 w-3.5" />
            Business intelligence
          </p>
          <h1 className="mt-2 text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
            BI
          </h1>
          <p className="mt-2 inline-flex items-center gap-2 text-[12px] font-medium text-[var(--text-muted)]">
            <FiClock className="h-3.5 w-3.5 shrink-0" />
            {loading && !lastUpdated
              ? "Updating analytics…"
              : `Last updated ${lastUpdated ? formatDateTime(lastUpdated) : "—"}`}
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1">
          {RANGE_OPTIONS.map((option) => {
            const active = option.value === rangeDays;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onRangeChange(option.value)}
                disabled={loading}
                className={`h-8 min-w-[44px] cursor-pointer rounded-lg px-3 text-[12px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/35 disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "bg-[var(--surface-raised)] text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
