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
  // Default = filled look (also covers selects / dates without placeholders).
  "h-11 w-full rounded-xl border border-solid border-[var(--border-strong)] bg-[var(--surface)] px-4 text-[14px] text-[var(--text-primary)] shadow-[inset_3px_0_0_0_var(--brand-primary)] outline-none transition " +
  // Empty = placeholder still showing.
  "placeholder-shown:border-dashed placeholder-shown:bg-[var(--surface-soft)] placeholder-shown:shadow-none placeholder:text-[var(--text-muted)] " +
  // Focus / disabled.
  "focus:border-solid focus:border-[var(--brand-primary)] focus:bg-[var(--surface)] focus:shadow-none focus:ring-2 focus:ring-[var(--brand-primary)]/15 " +
  "disabled:cursor-not-allowed disabled:opacity-65";

export const filterSelectClass = `${filterInputClass} appearance-none pr-11`;

/** Value-aware class for controls that do not use placeholders (e.g. date). */
export function filterValueClass(value?: string | null, extra = "") {
  const filled = Boolean(String(value ?? "").trim());
  return [
    "h-11 w-full rounded-xl px-4 text-[14px] text-[var(--text-primary)] outline-none transition",
    filled
      ? "border border-solid border-[var(--border-strong)] bg-[var(--surface)] shadow-[inset_3px_0_0_0_var(--brand-primary)]"
      : "border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] shadow-none placeholder:text-[var(--text-muted)]",
    "focus:border-solid focus:border-[var(--brand-primary)] focus:bg-[var(--surface)] focus:shadow-none focus:ring-2 focus:ring-[var(--brand-primary)]/15",
    "disabled:cursor-not-allowed disabled:opacity-65",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
