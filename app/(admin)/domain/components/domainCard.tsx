"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronDown, FiGlobe, FiLock, FiShield } from "react-icons/fi";
import { getDnsTypeTone, getStatusTone, TONE } from "@/app/lib/uiTone";
import domainAPI, {
  type DnsRecordItem,
  type DomainDetail,
  type DomainListItem,
} from "@/app/services/domain/domainAPI";

type DomainCardProps = {
  item: DomainListItem;
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

export default function DomainCard({ item }: DomainCardProps) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<DomainDetail | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DnsRecordItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const hasCacheRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadDetail = useCallback(async (soft = false) => {
    const requestId = ++requestIdRef.current;
    if (!soft) {
      setLoadingDetail(true);
    }
    setDetailError(null);

    try {
      const [detailResult, dnsResult] = (await Promise.all([
        domainAPI.getDomainByName(item.domain),
        domainAPI.getDomainDns(item.domain),
      ])) as [
        {
          success?: boolean;
          status?: string;
          data?: DomainDetail;
          errMessage?: string;
          message?: string;
        },
        {
          success?: boolean;
          status?: string;
          data?: DnsRecordItem[];
          errMessage?: string;
          message?: string;
        },
      ];

      if (requestId !== requestIdRef.current) return;

      let nextError: string | null = null;

      if (
        !detailResult ||
        detailResult.status === "failed" ||
        detailResult.success === false
      ) {
        if (!soft) setDetail(null);
        nextError =
          detailResult?.errMessage ||
          detailResult?.message ||
          "Unable to load domain detail";
      } else {
        setDetail(detailResult.data ?? null);
        hasCacheRef.current = true;
      }

      if (
        !dnsResult ||
        dnsResult.status === "failed" ||
        dnsResult.success === false
      ) {
        if (!soft) setDnsRecords([]);
        nextError =
          nextError ||
          dnsResult?.errMessage ||
          dnsResult?.message ||
          "Unable to load DNS records";
      } else {
        setDnsRecords(Array.isArray(dnsResult.data) ? dnsResult.data : []);
        hasCacheRef.current = true;
      }

      setDetailError(nextError);
    } catch {
      if (requestId !== requestIdRef.current) return;
      if (!soft) {
        setDetail(null);
        setDnsRecords([]);
      }
      setDetailError("Unable to load domain detail");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingDetail(false);
      }
    }
  }, [item.domain]);

  useEffect(() => {
    if (!open) return;
    void loadDetail(hasCacheRef.current);
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadDetail, open]);

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !hasCacheRef.current) {
        setLoadingDetail(true);
      }
      if (!next) {
        requestIdRef.current += 1;
        setLoadingDetail(false);
      }
      return next;
    });
  };

  const status = String(item.status || "unknown");
  const showInitialLoading = loadingDetail && !hasCacheRef.current;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition hover:bg-[var(--surface)]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--text-primary)]">
          <FiGlobe className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[16px] font-bold text-[var(--text-primary)]">
              {item.domain}
            </h3>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${getStatusTone(status)}`}
            >
              {status}
            </span>
            {item.type ? (
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE.slate}`}>
                {item.type}
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-[13px] text-[var(--text-muted)]">
            Expires {formatDate(item.expires_at)}
          </p>
        </div>

        <FiChevronDown
          className={`h-5 w-5 shrink-0 text-[var(--text-secondary)] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="space-y-4 border-t border-[var(--border)] px-5 py-5">
          {showInitialLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-[13px] text-[var(--text-muted)]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)]" />
              Loading domain & DNS…
            </div>
          ) : (
            <>
              {loadingDetail ? (
                <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)]" />
                  Refreshing…
                </div>
              ) : null}

              {detailError && !detail ? (
                <div className="rounded-xl border border-[rgba(248,113,113,0.28)] bg-[rgba(248,113,113,0.12)] px-4 py-3 text-[13px] text-[#fca5a5]">
                  {detailError}
                </div>
              ) : null}

              {detail ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Nameservers
                    </p>
                    <p className="mt-1 break-all text-[12px] font-semibold text-[var(--text-primary)]">
                      {detail.ns1 || "-"}
                      <br />
                      {detail.ns2 || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Lock
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-primary)]">
                      <FiLock className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                      {detail.is_locked == null
                        ? "-"
                        : detail.is_locked
                          ? "Locked"
                          : "Unlocked"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Privacy
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-primary)]">
                      <FiShield className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                      {detail.is_privacy_protected == null
                        ? "-"
                        : detail.is_privacy_protected
                          ? "Protected"
                          : "Off"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Registered
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                      {formatDate(detail.registered_at || detail.created_at)}
                    </p>
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-[14px] font-bold text-[var(--text-primary)]">
                    DNS records
                  </h4>
                  <span className="text-[12px] font-medium text-[var(--text-muted)]">
                    {dnsRecords.length} records
                  </span>
                </div>

                {dnsRecords.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">
                    No DNS records found (or zone not managed by Hostinger DNS)
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-[13px]">
                        <thead className="bg-[var(--surface-raised)] text-white">
                          <tr>
                            <th className="px-3 py-2.5 font-semibold">Type</th>
                            <th className="px-3 py-2.5 font-semibold">Name</th>
                            <th className="px-3 py-2.5 font-semibold">
                              Content
                            </th>
                            <th className="px-3 py-2.5 font-semibold">TTL</th>
                            <th className="px-3 py-2.5 font-semibold">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dnsRecords.map((record, index) => (
                            <tr
                              key={`${record.type}-${record.name}-${record.content}-${index}`}
                              className="border-t border-[var(--border)] bg-[var(--surface)]"
                            >
                              <td className="px-3 py-2.5">
                                <span
                                  className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold ${getDnsTypeTone(record.type)}`}
                                >
                                  {record.type}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">
                                {record.name}
                              </td>
                              <td className="max-w-[320px] truncate px-3 py-2.5 font-mono text-[12px] text-[var(--text-secondary)]">
                                {record.content}
                              </td>
                              <td className="px-3 py-2.5 text-[var(--text-secondary)]">
                                {record.ttl ?? "-"}
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    record.is_disabled ? TONE.slate : TONE.emerald
                                  }`}
                                >
                                  {record.is_disabled ? "Disabled" : "Active"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
