"use client";

import Link from "next/link";
import type { IconType } from "react-icons";
import { FiArrowRight } from "react-icons/fi";
import { LoadingDots } from "@/app/components/loading";
import type { BiKpi } from "./biTypes";

type BiKpiCardProps = {
  kpi: BiKpi;
  icon: IconType;
  loading?: boolean;
};

export function BiKpiCard({ kpi, icon: Icon, loading = false }: BiKpiCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.tone}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        {kpi.href ? (
          <FiArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)]" />
        ) : null}
      </div>
      <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {kpi.label}
      </p>
      <p className="mt-1 text-[28px] font-bold leading-none text-[var(--text-primary)]">
        {loading ? (
          <LoadingDots className="text-[var(--text-muted)]" />
        ) : (
          kpi.value
        )}
      </p>
      <p className="mt-2 text-[12px] text-[var(--text-muted)]">{kpi.hint}</p>
    </>
  );

  const className =
    "group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_8px_24px_rgba(36,46,66,0.06)] transition hover:-translate-y-0.5 hover:border-[rgba(91,134,255,0.45)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.28)]";

  if (kpi.href) {
    return (
      <Link href={kpi.href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

type BiKpiGridProps = {
  kpis: BiKpi[];
  icons: Record<string, IconType>;
  loading?: boolean;
};

export default function BiKpiGrid({
  kpis,
  icons,
  loading = false,
}: BiKpiGridProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = icons[kpi.id] || icons.inventory;
        return (
          <BiKpiCard key={kpi.id} kpi={kpi} icon={Icon} loading={loading} />
        );
      })}
    </section>
  );
}
