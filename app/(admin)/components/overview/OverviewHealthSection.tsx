"use client";

import Link from "next/link";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiLayers,
  FiServer,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { LoadingDots } from "@/app/components/loading";
import { ICON_TONE } from "@/app/lib/uiTone";
import type { OverviewData } from "./overviewTypes";

type OverviewHealthSectionProps = {
  overview: OverviewData;
  runningVps: number;
  activeDomains: number;
  failedJobs: number;
  runningJobs: number;
  loading?: {
    vps?: boolean;
    jobs?: boolean;
    domains?: boolean;
    admins?: boolean;
  };
};

function HealthRow({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
  icon: IconType;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--surface-muted)] px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">{label}</p>
          <p className="truncate text-[11px] text-[var(--text-muted)]">{detail}</p>
        </div>
      </div>
      <span className="flex min-w-[36px] shrink-0 justify-end text-[13px] font-bold text-[var(--text-primary)]">
        {value === "—" ? <LoadingDots className="text-[var(--text-muted)]" /> : value}
      </span>
    </div>
  );
}

export default function OverviewHealthSection({
  overview,
  runningVps,
  activeDomains,
  failedJobs,
  runningJobs,
  loading = {},
}: OverviewHealthSectionProps) {
  const statusLoading =
    loading.vps ||
    loading.jobs ||
    loading.domains ||
    loading.admins;

  const hasIssues = !loading.jobs && failedJobs > 0;
  const healthTitle = statusLoading
    ? "Checking status"
    : hasIssues
      ? "Attention needed"
      : "All systems healthy";
  const healthSubtitle = statusLoading
    ? "Loading status across connected services"
    : hasIssues
      ? `${failedJobs} CI/CD job${failedJobs === 1 ? "" : "s"} failed`
      : "Current status across connected services";

  return (
    <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_8px_24px_rgba(36,46,66,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[var(--text-primary)]">
              System health
            </h2>
            <p className="mt-1 text-[12px] text-[var(--text-muted)]">
              {healthSubtitle}
            </p>
          </div>
          {statusLoading ? (
            <FiClock className="h-5 w-5 text-[var(--text-muted)]" />
          ) : hasIssues ? (
            <FiAlertCircle className="h-5 w-5 text-[#f87171]" />
          ) : (
            <FiCheckCircle className="h-5 w-5 text-[#34d399]" />
          )}
        </div>
        <p className="mt-2 text-[12px] font-semibold text-[var(--text-secondary)]">
          {healthTitle}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <HealthRow
            label="VPS"
            value={loading.vps ? "—" : `${runningVps}/${overview.vps.length}`}
            detail={loading.vps ? "Loading VPS status" : "Running virtual machines"}
            tone={ICON_TONE.violet}
            icon={FiServer}
          />
          <HealthRow
            label="CI/CD"
            value={
              loading.jobs
                ? "—"
                : failedJobs > 0
                  ? `${failedJobs} failed`
                  : "Healthy"
            }
            detail={
              loading.jobs
                ? "Loading job status"
                : `${runningJobs} jobs currently running`
            }
            tone={failedJobs > 0 ? ICON_TONE.rose : ICON_TONE.emerald}
            icon={failedJobs > 0 ? FiAlertCircle : FiCheckCircle}
          />
          <HealthRow
            label="Domains"
            value={
              loading.domains
                ? "—"
                : `${activeDomains}/${overview.domains.length}`
            }
            detail={
              loading.domains
                ? "Loading domain status"
                : "Active or registered domains"
            }
            tone={ICON_TONE.blue}
            icon={FiGlobe}
          />
          <HealthRow
            label="Admins"
            value={loading.admins ? "—" : String(overview.admins.length)}
            detail={
              loading.admins
                ? "Loading administrator data"
                : "Registered administrator accounts"
            }
            tone={ICON_TONE.orange}
            icon={FiActivity}
          />
        </div>
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_8px_24px_rgba(36,46,66,0.06)]">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[rgba(91,134,255,0.06)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-32 w-32 rounded-full bg-[rgba(52,211,153,0.04)] blur-3xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold text-[var(--text-primary)]">
              Deployment status
            </h2>
            <p className="mt-1 text-[12px] text-[var(--text-muted)]">
              Jenkins job summary
            </p>
          </div>
          {/* <Link
            href="/ci-cd"
            className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[var(--brand-primary)] transition hover:underline"
          >
            View jobs
            <FiArrowRight className="h-3.5 w-3.5" />
          </Link> */}
        </div>

        <div className="relative mt-5 grid flex-1 grid-cols-3 gap-3">
          {[
            {
              label: "Total",
              value: loading.jobs ? null : overview.jobs.length,
              icon: FiLayers,
              iconTone: ICON_TONE.slate,
              valueTone: "text-[var(--text-primary)]",
              card: "border-[var(--border)] bg-[var(--surface-muted)]",
              accent: "from-white/[0.04] via-transparent to-transparent",
            },
            {
              label: "Running",
              value: loading.jobs ? null : runningJobs,
              icon: FiActivity,
              iconTone: ICON_TONE.blue,
              valueTone: "text-[#93c5fd]",
              card: "border-[rgba(91,134,255,0.16)] bg-[rgba(91,134,255,0.05)]",
              accent: "from-[#5b86ff]/15 via-transparent to-transparent",
            },
            {
              label: "Failed",
              value: loading.jobs ? null : failedJobs,
              icon: FiAlertCircle,
              iconTone: ICON_TONE.rose,
              valueTone: "text-[#fca5a5]",
              card: "border-[rgba(248,113,113,0.16)] bg-[rgba(248,113,113,0.05)]",
              accent: "from-[#f87171]/15 via-transparent to-transparent",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`relative flex min-h-[120px] min-w-0 flex-col overflow-hidden rounded-2xl border px-3 py-4 ${item.card}`}
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b ${item.accent}`}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${item.iconTone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {item.label}
                  </span>
                </div>
                <div className="relative mt-auto flex flex-1 items-end pt-4">
                  <p
                    className={`text-[28px] font-bold leading-none tabular-nums tracking-tight ${item.valueTone}`}
                  >
                    {item.value === null ? (
                      <LoadingDots className="text-[var(--text-muted)]" />
                    ) : (
                      item.value
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {!loading.jobs && overview.jobs.length > 0 ? (
          <div className="relative mt-4">
            <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)]">
              <span>Pipeline mix</span>
              <span>
                {Math.max(
                  0,
                  overview.jobs.length - failedJobs - runningJobs
                )}{" "}
                healthy
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
              {(() => {
                const total = overview.jobs.length || 1;
                const healthy = Math.max(
                  0,
                  overview.jobs.length - failedJobs - runningJobs
                );
                return (
                  <>
                    {healthy > 0 ? (
                      <span
                        className="bg-[#34d399]"
                        style={{ width: `${(healthy / total) * 100}%` }}
                      />
                    ) : null}
                    {runningJobs > 0 ? (
                      <span
                        className="bg-[#5b86ff]"
                        style={{ width: `${(runningJobs / total) * 100}%` }}
                      />
                    ) : null}
                    {failedJobs > 0 ? (
                      <span
                        className="bg-[#f87171]"
                        style={{ width: `${(failedJobs / total) * 100}%` }}
                      />
                    ) : null}
                  </>
                );
              })()}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
