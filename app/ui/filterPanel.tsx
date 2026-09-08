"use client";

import type { ReactNode } from "react";

type FilterPanelProps = {
  children: ReactNode;
};

export default function FilterPanel({ children }: FilterPanelProps) {
  return (
    <section className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
      {children}
    </section>
  );
}

export function FilterField({
  label,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export const filterInputClass =
  "h-11 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)] px-4 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--brand-primary)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--brand-primary)]/15";

export const filterSelectClass = `${filterInputClass} appearance-none pr-11`;
