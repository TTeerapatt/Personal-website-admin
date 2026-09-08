"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiGlobe } from "react-icons/fi";
import domainAPI, {
  type DomainListItem,
} from "@/app/services/domain/domainAPI";
import { popup } from "@/app/ui/popUp";
import DomainCard from "./domainCard";

type DomainListApiResult =
  | {
      success?: boolean;
      data?: DomainListItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

export default function DomainMain() {
  const [domains, setDomains] = useState<DomainListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDomains = useCallback(async () => {
    setLoading(true);

    try {
      const result = (await domainAPI.getDomainsAll()) as DomainListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        const message =
          result?.errMessage ||
          result?.message ||
          "Unable to fetch domains";
        await popup.error("Error", message);
        setDomains([]);
        return;
      }

      setDomains(Array.isArray(result.data) ? result.data : []);
    } catch {
      await popup.error("Error", "Unable to fetch domains");
      setDomains([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDomains();
  }, [fetchDomains]);

  const summary = useMemo(() => {
    const total = domains.length;
    const active = domains.filter((item) => {
      const status = String(item.status).toLowerCase();
      return status === "active" || status === "ok";
    }).length;
    const expired = domains.filter((item) => {
      const status = String(item.status).toLowerCase();
      return status === "expired" || status === "fail" || status === "failed";
    }).length;
    const other = Math.max(total - active - expired, 0);
    return { total, active, expired, other };
  }, [domains]);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 shadow-[0_8px_24px_rgba(36,46,66,0.08)]">

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-raised)] text-white">
              <FiGlobe className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-[var(--text-primary)]">
                Hostinger Domains
              </h1>
              {/* <p className="mt-1 text-[14px] text-[var(--text-muted)]">
                Portfolio domains and DNS zone records
              </p> */}
            </div>
          </div>
        </div>

        {!loading && domains.length > 0 ? (
          <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: summary.total, tone: "text-[var(--text-primary)]" },
              {
                label: "Active",
                value: summary.active,
                tone: "text-[#34d399]",
              },
              {
                label: "Expired",
                value: summary.expired,
                tone: "text-[#f87171]",
              },
              {
                label: "Other",
                value: summary.other,
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
            Loading Hostinger domains…
          </p>
        </div>
      ) : domains.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-5 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--text-primary)]">
            <FiGlobe className="h-6 w-6" />
          </div>
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">
            No domains found
          </p>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">
            Check Hostinger API token configuration
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {domains.map((item) => (
            <DomainCard
              key={`${item.id ?? item.domain}-${item.domain}`}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}
