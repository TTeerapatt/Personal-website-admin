"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiCheck,
  FiChevronDown,
  FiCopy,
  FiCpu,
  FiHardDrive,
  FiPlay,
  FiRefreshCw,
  FiSquare,
  FiWifi,
} from "react-icons/fi";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import {
  CHART_ANIMATION_MS,
  downsamplePoints,
  prefersReducedMotion,
} from "@/app/lib/chartPerf";
import { getStatusTone, ICON_TONE } from "@/app/lib/uiTone";
import vpsAPI, {
  type VpsMetricSeries,
  type VpsMetrics,
  type VpsPowerAction,
  type VpsVirtualMachine,
} from "@/app/services/vps/vpsAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { useTabPermission } from "@/app/hooks/useTabPermission";

const SPARKLINE_MAX_POINTS = 40;

type VpsCardProps = {
  vm: VpsVirtualMachine;
  onChanged: () => void;
};

function formatMb(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "-";
  if (value >= 1024) {
    const gb = value / 1024;
    return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  }
  return `${Math.round(value)} MB`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function formatMetric(value: number | null, unit: string | null): string {
  if (value == null || !Number.isFinite(value)) return "-";
  const u = (unit || "").toLowerCase();
  if (u.includes("%") || u === "percent" || u === "percentage") {
    return `${value.toFixed(1)}%`;
  }
  if (u.includes("byte") || u === "b" || u === "bytes") {
    return formatMb(value / (1024 * 1024));
  }
  if (u.includes("mb") || u === "mib") {
    return formatMb(value);
  }
  if (u.includes("gb") || u === "gib") {
    return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)} GB`;
  }
  if (u.includes("sec")) {
    const hours = value / 3600;
    if (hours >= 24) return `${(hours / 24).toFixed(1)} d`;
    return `${hours.toFixed(1)} h`;
  }
  return `${value.toFixed(1)}${unit ? ` ${unit}` : ""}`;
}

function getLatestMetricTimestamp(metrics: VpsMetrics | null): number | null {
  if (!metrics) return null;

  const timestamps = Object.values(metrics).flatMap((series) =>
    series?.points
      .map((point) => point.timestamp)
      .filter((timestamp) => Number.isFinite(timestamp)) ?? []
  );

  return timestamps.length > 0 ? Math.max(...timestamps) : null;
}

function formatMetricTimestamp(timestamp: number | null): string | null {
  if (timestamp == null || !Number.isFinite(timestamp)) return null;

  // Hostinger metric timestamps are normally Unix seconds; support milliseconds too.
  const milliseconds = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type MetricTone = {
  stroke: string;
  fillFrom: string;
  chip: string;
};

const METRIC_TONES: Record<string, MetricTone> = {
  CPU: {
    stroke: "#5b86ff",
    fillFrom: "rgba(91,134,255,0.28)",
    chip: ICON_TONE.blue,
  },
  RAM: {
    stroke: "#a78bfa",
    fillFrom: "rgba(167,139,250,0.24)",
    chip: ICON_TONE.violet,
  },
  Disk: {
    stroke: "#2dd4bf",
    fillFrom: "rgba(45,212,191,0.24)",
    chip: ICON_TONE.teal,
  },
  "In traffic": {
    stroke: "#34d399",
    fillFrom: "rgba(52,211,153,0.24)",
    chip: ICON_TONE.emerald,
  },
  "Out traffic": {
    stroke: "#fb923c",
    fillFrom: "rgba(251,146,60,0.24)",
    chip: ICON_TONE.orange,
  },
  Uptime: {
    stroke: "#22d3ee",
    fillFrom: "rgba(34,211,238,0.24)",
    chip: ICON_TONE.cyan,
  },
};

function MetricSparkline({
  points,
  tone,
  gradientId,
  animationIndex = 0,
}: {
  points: Array<{ timestamp: number; value: number }>;
  tone: MetricTone;
  gradientId: string;
  animationIndex?: number;
}) {
  const reduceMotion = useMemo(() => prefersReducedMotion(), []);
  const data = useMemo(
    () =>
      downsamplePoints(points, SPARKLINE_MAX_POINTS).map((point, index) => ({
        index,
        value: point.value,
      })),
    [points]
  );

  // Remount when series changes so the draw animation plays again.
  const chartKey = useMemo(() => {
    if (!data.length) return "empty";
    const last = data[data.length - 1];
    return `${data.length}-${last.value}-${points[points.length - 1]?.timestamp ?? 0}`;
  }, [data, points]);

  if (!data.length) {
    return (
      <div className="flex h-[84px] items-center justify-center text-[12px] text-[var(--text-muted)]">
        No chart data
      </div>
    );
  }

  return (
    <div className="h-[84px] w-full [contain:layout]">
      <ResponsiveContainer width="100%" height="100%" debounce={100}>
        <AreaChart
          key={chartKey}
          data={data}
          margin={{ top: 10, right: 8, left: 4, bottom: 8 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={tone.stroke} stopOpacity={0.38} />
              <stop offset="100%" stopColor={tone.stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={["dataMin", "dataMax"]} hide width={0} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={tone.stroke}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            isAnimationActive={!reduceMotion}
            animationBegin={reduceMotion ? 0 : 40 + animationIndex * 70}
            animationDuration={CHART_ANIMATION_MS}
            animationEasing="ease-out"
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricChartCard({
  label,
  series,
  chartId,
  animationIndex = 0,
}: {
  label: string;
  series: VpsMetricSeries | null | undefined;
  chartId: string;
  animationIndex?: number;
}) {
  const tone = METRIC_TONES[label] ?? METRIC_TONES.CPU;
  const points = series?.points ?? [];
  const latest = series?.latest ?? null;
  const unit = series?.unit ?? null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {label}
          </p>
          <p className="mt-1 text-[20px] font-bold tracking-tight text-[var(--text-primary)]">
            {formatMetric(latest, unit)}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone.chip}`}
        >
          24h
        </span>
      </div>
      <div className="px-2 pb-2 pt-1">
        <MetricSparkline
          points={points}
          tone={tone}
          gradientId={chartId}
          animationIndex={animationIndex}
        />
      </div>
    </div>
  );
}

function getStateBadgeClass(state: string): string {
  return getStatusTone(state);
}

function primaryIp(vm: VpsVirtualMachine): string {
  return vm.ipv4[0]?.address || vm.ipv6[0]?.address || "-";
}

export default function VpsCard({ vm, onChanged }: VpsCardProps) {
  const { withLoading } = useLoading();
  const { canEdit } = useTabPermission("vps");
  const [open, setOpen] = useState(false);
  const [metrics, setMetrics] = useState<VpsMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [copiedIpv4, setCopiedIpv4] = useState(false);
  const hasMetricsCacheRef = useRef(false);
  const metricsRequestIdRef = useRef(0);

  const loadMetrics = useCallback(async (soft = false) => {
    const requestId = ++metricsRequestIdRef.current;
    if (!soft) {
      setMetricsLoading(true);
    }
    try {
      const result = (await vpsAPI.getVpsMetrics(vm.id)) as {
        success?: boolean;
        status?: string;
        data?: VpsMetrics;
        errMessage?: string;
        message?: string;
      };

      if (requestId !== metricsRequestIdRef.current) return;

      if (!result || result.status === "failed" || result.success === false) {
        if (!soft) setMetrics(null);
        return;
      }

      setMetrics(result.data ?? null);
      hasMetricsCacheRef.current = true;
    } catch {
      if (requestId !== metricsRequestIdRef.current) return;
      if (!soft) setMetrics(null);
    } finally {
      if (requestId === metricsRequestIdRef.current) {
        setMetricsLoading(false);
      }
    }
  }, [vm.id]);

  useEffect(() => {
    if (!open) return;
    void loadMetrics(hasMetricsCacheRef.current);
    return () => {
      metricsRequestIdRef.current += 1;
    };
  }, [loadMetrics, open]);

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !hasMetricsCacheRef.current) {
        setMetricsLoading(true);
      }
      if (!next) {
        metricsRequestIdRef.current += 1;
        setMetricsLoading(false);
      }
      return next;
    });
  };

  const ipv4Value = vm.ipv4.map((ip) => ip.address).join(", ");
  const handleCopyIpv4 = async () => {
    if (!ipv4Value || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(ipv4Value);
      setCopiedIpv4(true);
      window.setTimeout(() => setCopiedIpv4(false), 1600);
    } catch {
      setCopiedIpv4(false);
    }
  };

  const handlePower = async (action: VpsPowerAction) => {
    const labels: Record<VpsPowerAction, string> = {
      start: "Start",
      stop: "Stop",
      restart: "Restart",
    };

    const confirmed = await popup.confirm({
      title: `${labels[action]} this VPS?`,
      text: `${labels[action]} ${vm.hostname}`,
      confirmText: labels[action],
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setActionBusy(true);
    let ok = false;

    await withLoading(async () => {
      const result = (await vpsAPI.powerAction(vm.id, action)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          `${labels[action]} failed`,
          result?.errMessage ||
            result?.message ||
            `Unable to ${action} VPS`
        );
        return;
      }

      ok = true;
    }, `${labels[action]}ing VPS...`);

    setActionBusy(false);
    if (!ok) return;

    await popup.success(
      `${labels[action]} requested`,
      "Hostinger is processing the action"
    );
    onChanged();
    if (open) void loadMetrics(true);
  };

  const state = String(vm.state || "unknown");
  const canStart = state === "stopped" || state === "off";
  const canStop = state === "running";
  const canRestart = state === "running";
  const metricsUpdatedAt = formatMetricTimestamp(
    getLatestMetricTimestamp(metrics)
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-md">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition hover:bg-[var(--surface)]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--text-primary)]">
          <FiCpu className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[16px] font-bold text-[var(--text-primary)]">
              {vm.hostname}
            </h3>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${getStateBadgeClass(state)}`}
            >
              {state}
            </span>
          </div>
          <p className="mt-1 truncate text-[13px] text-[var(--text-muted)]">
            {primaryIp(vm)}
            {vm.plan ? ` · ${vm.plan}` : ""}
            {vm.template?.name ? ` · ${vm.template.name}` : ""}
          </p>
        </div>

        <div className="hidden items-center gap-4 text-[12px] font-semibold text-[var(--text-secondary)] sm:flex">
          <span>{vm.cpus != null ? `${vm.cpus} vCPU` : "-"}</span>
          <span>{formatMb(vm.memory_mb)}</span>
          <span>{formatMb(vm.disk_mb)}</span>
        </div>

        <FiChevronDown
          className={`h-5 w-5 shrink-0 text-[var(--text-secondary)] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="space-y-4 border-t border-[var(--border)] px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  IPv4
                </p>
                <button
                  type="button"
                  onClick={() => void handleCopyIpv4()}
                  disabled={!ipv4Value}
                  title={copiedIpv4 ? "Copied" : "Copy IPv4"}
                  aria-label={copiedIpv4 ? "IPv4 copied" : "Copy IPv4"}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition hover:border-[var(--brand-primary)] hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copiedIpv4 ? (
                    <FiCheck className="h-3.5 w-3.5" />
                  ) : (
                    <FiCopy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="mt-1 break-all font-mono text-[13px] font-semibold text-[var(--text-primary)]">
                {ipv4Value || "-"}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Specs
              </p>
              <p className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                {vm.cpus != null ? `${vm.cpus} vCPU` : "-"} ·{" "}
                {formatMb(vm.memory_mb)} · {formatMb(vm.disk_mb)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Bandwidth
              </p>
              <p className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                {formatMb(vm.bandwidth_mb)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Created
              </p>
              <p className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                {formatDateTime(vm.created_at)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
            <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Power controls
              </p>
              {actionBusy ? (
                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                  Processing…
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {canEdit ? (
                <>
                  <button
                    type="button"
                    disabled={actionBusy || !canStart}
                    onClick={() => void handlePower("start")}
                    className="group inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-xl bg-[#16a34a] px-4 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgba(22,163,74,0.28)] transition hover:bg-[#15803d] hover:shadow-[0_8px_18px_rgba(22,163,74,0.34)] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#86efac] disabled:shadow-none disabled:opacity-70"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface)]/20 transition group-hover:bg-[var(--surface)]/25">
                      <FiPlay className="h-3.5 w-3.5 fill-current" />
                    </span>
                    Start
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy || !canStop}
                    onClick={() => void handlePower("stop")}
                    className="group inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-xl bg-[#dc2626] px-4 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgba(220,38,38,0.28)] transition hover:bg-[#b91c1c] hover:shadow-[0_8px_18px_rgba(220,38,38,0.34)] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#fca5a5] disabled:shadow-none disabled:opacity-70"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface)]/20 transition group-hover:bg-[var(--surface)]/25">
                      <FiSquare className="h-3.5 w-3.5 fill-current" />
                    </span>
                    Stop
                  </button>

                  <button
                    type="button"
                    disabled={actionBusy || !canRestart}
                    onClick={() => void handlePower("restart")}
                    className="group inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-xl bg-[var(--surface-raised)] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[var(--surface-soft)] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#93b0f5] disabled:shadow-none disabled:opacity-70"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface)]/20 transition group-hover:bg-[var(--surface)]/25">
                      <FiRefreshCw className="h-3.5 w-3.5" />
                    </span>
                    Restart
                  </button>

                  <div className="mx-0.5 hidden h-8 w-px bg-[var(--border-strong)] sm:block" />
                </>
              ) : null}

              <button
                type="button"
                disabled={metricsLoading}
                onClick={() => void loadMetrics(false)}
                className="group inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-[13px] font-semibold text-[var(--text-primary)] shadow-sm transition hover:border-[rgba(91,134,255,0.45)] hover:bg-[var(--surface-soft)] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--text-primary)] transition group-hover:bg-[var(--surface)]">
                  <FiWifi
                    className={`h-3.5 w-3.5 ${metricsLoading ? "animate-pulse" : ""}`}
                  />
                </span>
                Refresh metrics
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <FiHardDrive className="h-4 w-4 shrink-0 text-[var(--text-primary)]" />
                <h4 className="text-[14px] font-bold text-[var(--text-primary)]">
                  Metrics (last 24h)
                </h4>
              </div>
              {metricsUpdatedAt ? (
                <span className="shrink-0 text-[11px] font-medium text-[var(--text-muted)]">
                  Updated {metricsUpdatedAt}
                </span>
              ) : null}
            </div>

            {metricsLoading && !metrics ? (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-[13px] text-[var(--text-muted)]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)]" />
                Loading metrics…
              </div>
            ) : (
              <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {metricsLoading ? (
                  <div className="absolute right-0 top-[-1.75rem] flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)]" />
                    Refreshing…
                  </div>
                ) : null}
                {[
                  {
                    label: "CPU",
                    series: metrics?.cpu_usage,
                  },
                  {
                    label: "RAM",
                    series: metrics?.ram_usage,
                  },
                  {
                    label: "Disk",
                    series: metrics?.disk_space,
                  },
                  {
                    label: "In traffic",
                    series: metrics?.incoming_traffic,
                  },
                  {
                    label: "Out traffic",
                    series: metrics?.outgoing_traffic,
                  },
                  {
                    label: "Uptime",
                    series: metrics?.uptime,
                  },
                ].map((item, index) => (
                  <MetricChartCard
                    key={item.label}
                    label={item.label}
                    series={item.series}
                    chartId={`vps-${vm.id}-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    animationIndex={index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
