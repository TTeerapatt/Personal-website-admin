"use client";

import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";
import type { BiInsight } from "./biTypes";
import { LoadingDots } from "@/app/components/loading";

const TONE_UI = {
  ok: {
    icon: FiCheckCircle,
    chip: "bg-[rgba(52,211,153,0.14)] text-[#6ee7b7]",
    border: "border-[rgba(52,211,153,0.28)]",
  },
  warn: {
    icon: FiAlertTriangle,
    chip: "bg-[rgba(251,191,36,0.14)] text-[#fcd34d]",
    border: "border-[rgba(251,191,36,0.28)]",
  },
  critical: {
    icon: FiAlertCircle,
    chip: "bg-[rgba(248,113,113,0.14)] text-[#fca5a5]",
    border: "border-[rgba(248,113,113,0.28)]",
  },
  info: {
    icon: FiInfo,
    chip: "bg-[rgba(91,134,255,0.16)] text-[#b4c8ff]",
    border: "border-[rgba(91,134,255,0.28)]",
  },
} as const;

type BiInsightListProps = {
  insights: BiInsight[];
  loading?: boolean;
};

export default function BiInsightList({
  insights,
  loading = false,
}: BiInsightListProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_8px_24px_rgba(36,46,66,0.06)]">
      <h2 className="text-[16px] font-bold text-[var(--text-primary)]">
        Insights
      </h2>

      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center text-[var(--brand-primary)]">
          <LoadingDots />
        </div>
      ) : insights.length === 0 ? (
        <p className="mt-6 text-center text-[13px] text-[var(--text-muted)]">
          No insights available yet
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {insights.map((insight) => {
            const ui = TONE_UI[insight.tone];
            const Icon = ui.icon;
            return (
              <li
                key={insight.id}
                className={`rounded-xl border bg-[var(--surface-soft)] px-4 py-3 ${ui.border}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ui.chip}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {insight.title}
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                      {insight.detail}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
