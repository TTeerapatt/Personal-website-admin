"use client";

import type { CSSProperties, ReactNode } from "react";
import { LoadingDots } from "@/app/components/loading";

export const BI_CHART_ANIMATION_MS = 750;

export const biAxisTick = {
  fill: "var(--text-muted)",
  fontSize: 12,
} as const;

export const biTooltipStyle: CSSProperties = {
  backgroundColor: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(36,46,66,0.12)",
  color: "var(--text-primary)",
  fontSize: 12,
};

export const biTooltipLabelStyle: CSSProperties = {
  color: "var(--text-secondary)",
  fontWeight: 600,
  marginBottom: 4,
};

export const biTooltipItemStyle: CSSProperties = {
  color: "var(--text-primary)",
  fontWeight: 600,
};

type BiChartShellProps = {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyText: string;
  minHeight?: number;
  children: ReactNode;
};

export function BiChartShell({
  title,
  subtitle,
  headerRight,
  loading = false,
  empty = false,
  emptyText,
  minHeight = 240,
  children,
}: BiChartShellProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_8px_24px_rgba(36,46,66,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-[var(--text-primary)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-[12px] text-[var(--text-muted)]">{subtitle}</p>
          ) : null}
        </div>
        {!loading && !empty ? headerRight : null}
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center text-[var(--brand-primary)]"
          style={{ minHeight }}
        >
          <LoadingDots />
        </div>
      ) : empty ? (
        <p
          className="flex items-center justify-center text-center text-[13px] text-[var(--text-muted)]"
          style={{ minHeight }}
        >
          {emptyText}
        </p>
      ) : (
        <div className="mt-4" style={{ minHeight }}>
          {children}
        </div>
      )}
    </section>
  );
}
