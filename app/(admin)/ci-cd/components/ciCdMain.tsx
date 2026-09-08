"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GoWorkflow } from "react-icons/go";
import ciCdAPI, { type CiCdJobItem } from "@/app/services/ciCd/ciCdAPI";
import { popup } from "@/app/ui/popUp";
import CiCdAccordionItem from "./ciCdAccordionItem";

type JobListApiResult =
  | {
      success?: boolean;
      data?: CiCdJobItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

export default function CiCdMain() {
  const [jobs, setJobs] = useState<CiCdJobItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);

    try {
      const result = (await ciCdAPI.getJobs()) as JobListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        const message =
          result?.errMessage ||
          result?.message ||
          "Unable to fetch CI-CD jobs";
        await popup.error("Error", message);
        setJobs([]);
        return;
      }

      setJobs(Array.isArray(result.data) ? result.data : []);
    } catch {
      await popup.error("Error", "Unable to fetch CI-CD jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const summary = useMemo(() => {
    const total = jobs.length;
    const success = jobs.filter((j) => j.status === "success").length;
    const failed = jobs.filter((j) => j.status === "failed").length;
    const running = jobs.filter((j) => j.status === "running").length;
    return { total, success, failed, running };
  }, [jobs]);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 shadow-[0_8px_24px_rgba(36,46,66,0.08)]">
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-raised)] text-white">
              <GoWorkflow className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
                Jenkins CI/CD
              </h1>
            </div>
          </div>
        </div>

        {!loading && jobs.length > 0 ? (
          <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Jobs",
                value: summary.total,
                tone: "text-[var(--text-primary)]",
              },
              {
                label: "Success",
                value: summary.success,
                tone: "text-[#34d399]",
              },
              {
                label: "Failed",
                value: summary.failed,
                tone: "text-[#f87171]",
              },
              {
                label: "Running",
                value: summary.running,
                tone: "text-[#5b86ff]",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.22)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {item.label}
                </p>
                <p className={`mt-1 text-[22px] font-bold ${item.tone}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-14">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)]" />
          <p className="text-[14px] font-medium text-[var(--text-muted)]">
            Loading Jenkins jobs…
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-5 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--text-primary)]">
            <GoWorkflow className="h-6 w-6" />
          </div>
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">
            No Jenkins jobs found
          </p>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">
            Check Jenkins connection configuration
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <CiCdAccordionItem key={job.name} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
