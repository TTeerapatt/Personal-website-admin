"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import type { IconType } from "react-icons";
import { LoadingDots } from "@/app/components/loading";

type OverviewMetricCardProps = {
  label: string;
  value: number;
  loading?: boolean;
  icon: IconType;
  tone: string;
  href: string;
};

export default function OverviewMetricCard({
  label,
  value,
  loading = false,
  icon: Icon,
  tone,
  href,
}: OverviewMetricCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_8px_24px_rgba(36,46,66,0.06)] transition hover:-translate-y-0.5 hover:border-[rgba(91,134,255,0.45)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <FiArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)]" />
      </div>
      <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-[28px] font-bold leading-none text-[var(--text-primary)]">
        {loading ? (
          <LoadingDots className="text-[var(--text-muted)]" />
        ) : (
          value
        )}
      </p>
    </Link>
  );
}
