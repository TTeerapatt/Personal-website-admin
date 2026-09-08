import { CHART_TONE, RESOURCE_CHART_COLORS } from "@/app/lib/uiTone";
import type { AdminLogItem } from "@/app/services/adminLog/adminLogAPI";
import type { CiCdJobItem } from "@/app/services/ciCd/ciCdAPI";
import type { DatabaseItem } from "@/app/services/database/databaseAPI";
import type { DomainListItem } from "@/app/services/domain/domainAPI";
import type { PortItem } from "@/app/services/port/portAPI";
import type { ProjectItem } from "@/app/services/project/projectAPI";
import type { VpsVirtualMachine } from "@/app/services/vps/vpsAPI";
import type {
  BiChartSlice,
  BiData,
  BiInsight,
  BiKpi,
  BiRangeDays,
  BiTrendPoint,
} from "./biTypes";

export type ApiListResult<T> = {
  success?: boolean;
  status?: string;
  data?: T[];
};

export function readList<T>(result: unknown): T[] {
  if (!result || typeof result !== "object") return [];
  const response = result as ApiListResult<T>;
  if (response.status === "failed" || response.success === false) return [];
  return Array.isArray(response.data) ? response.data : [];
}

export function getStatus(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

export function rangeToDateFrom(days: BiRangeDays): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDayLabel(date: Date, days: BiRangeDays): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(days > 30 ? { year: "2-digit" as const } : {}),
  }).format(date);
}

function isMutateAction(action: string): boolean {
  const key = getStatus(action);
  return [
    "create",
    "update",
    "soft_delete",
    "hard_delete",
    "delete",
    "start",
    "stop",
    "restart",
  ].includes(key);
}

export function buildActivityTrend(
  logs: AdminLogItem[],
  days: BiRangeDays
): BiTrendPoint[] {
  const today = startOfDay(new Date());
  const buckets = new Map<string, BiTrendPoint>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = toDayKey(day);
    buckets.set(key, {
      date: key,
      label: formatDayLabel(day, days),
      total: 0,
      login: 0,
      mutate: 0,
    });
  }

  for (const log of logs) {
    const created = new Date(log.created_at);
    if (Number.isNaN(created.getTime())) continue;
    const key = toDayKey(startOfDay(created));
    const bucket = buckets.get(key);
    if (!bucket) continue;

    bucket.total += 1;
    if (getStatus(log.action) === "login") bucket.login += 1;
    if (isMutateAction(log.action)) bucket.mutate += 1;
  }

  return Array.from(buckets.values());
}

export function countByLabel(
  items: Array<{ label: string }>,
  colors: readonly string[]
): BiChartSlice[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = item.label || "Other";
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([label, value], index) => ({
      label,
      value,
      color: colors[index % colors.length],
    }));
}

const ACTION_COLORS: Record<string, string> = {
  login: "#60a5fa",
  create: "#34d399",
  update: "#fbbf24",
  soft_delete: "#f87171",
  hard_delete: "#ef4444",
  delete: "#f87171",
  start: "#34d399",
  stop: "#94a3b8",
  restart: "#fb923c",
};

export function buildActionDistribution(logs: AdminLogItem[]): BiChartSlice[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    const key = getStatus(log.action) || "other";
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([label, value], index) => ({
      label: label.replace(/_/g, " "),
      value,
      color:
        ACTION_COLORS[label] ||
        RESOURCE_CHART_COLORS[index % RESOURCE_CHART_COLORS.length],
    }));
}

export function buildTopAdmins(
  logs: AdminLogItem[],
  limit = 6
): BiChartSlice[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    const label =
      log.admin_display_name?.trim() ||
      log.admin_email?.trim() ||
      `Admin #${log.admin_id}`;
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([label, value], index) => ({
      label,
      value,
      color: RESOURCE_CHART_COLORS[index % RESOURCE_CHART_COLORS.length],
    }));
}

export function buildDomainExpiry(domains: DomainListItem[]): BiChartSlice[] {
  const now = Date.now();
  let expired = 0;
  let within30 = 0;
  let within90 = 0;
  let healthy = 0;
  let unknown = 0;

  for (const domain of domains) {
    if (!domain.expires_at) {
      unknown += 1;
      continue;
    }
    const expires = new Date(domain.expires_at).getTime();
    if (Number.isNaN(expires)) {
      unknown += 1;
      continue;
    }
    const daysLeft = (expires - now) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0) expired += 1;
    else if (daysLeft <= 30) within30 += 1;
    else if (daysLeft <= 90) within90 += 1;
    else healthy += 1;
  }

  return [
    { label: "Expired", value: expired, color: CHART_TONE.failed },
    { label: "≤ 30 days", value: within30, color: "#fb923c" },
    { label: "≤ 90 days", value: within90, color: CHART_TONE.running },
    { label: "Healthy", value: healthy, color: CHART_TONE.success },
    { label: "Unknown", value: unknown, color: CHART_TONE.other },
  ].filter((item) => item.value > 0);
}

export function buildVpsState(vps: VpsVirtualMachine[]): BiChartSlice[] {
  const counts = new Map<string, number>();
  for (const vm of vps) {
    const label = getStatus(vm.state) || "unknown";
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  const colorMap: Record<string, string> = {
    running: CHART_TONE.success,
    stopped: CHART_TONE.inactive,
    starting: CHART_TONE.running,
    stopping: "#fb923c",
    restarting: "#fb923c",
    unknown: CHART_TONE.other,
  };

  return Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([label, value], index) => ({
      label,
      value,
      color:
        colorMap[label] ||
        RESOURCE_CHART_COLORS[index % RESOURCE_CHART_COLORS.length],
    }));
}

export function buildCiCdStatus(jobs: CiCdJobItem[]): BiChartSlice[] {
  let success = 0;
  let running = 0;
  let failed = 0;
  let other = 0;

  for (const job of jobs) {
    const status = getStatus(job.status);
    if (status === "success") success += 1;
    else if (status === "running") running += 1;
    else if (status === "failed" || status === "unstable") failed += 1;
    else other += 1;
  }

  return [
    { label: "Success", value: success, color: CHART_TONE.success },
    { label: "Running", value: running, color: CHART_TONE.running },
    { label: "Failed", value: failed, color: CHART_TONE.failed },
    { label: "Other", value: other, color: CHART_TONE.other },
  ].filter((item) => item.value > 0);
}

export function buildProjectType(projects: ProjectItem[]): BiChartSlice[] {
  return countByLabel(
    projects.map((item) => ({
      label: item.type === "service" ? "Service" : "Project",
    })),
    [CHART_TONE.project, CHART_TONE.service]
  );
}

export function buildPortResources(ports: PortItem[]): BiChartSlice[] {
  return countByLabel(
    ports.map((item) => ({
      label: item.resource_type_name || item.resource_type_code || "Other",
    })),
    RESOURCE_CHART_COLORS
  );
}

export function buildDatabaseEngines(databases: DatabaseItem[]): BiChartSlice[] {
  return countByLabel(
    databases.map((item) => ({
      label: item.all_database_name || item.all_database_code || "Other",
    })),
    RESOURCE_CHART_COLORS
  );
}

export function buildInventoryMix(data: BiData): BiChartSlice[] {
  return [
    { label: "Projects", value: data.projects.length, color: CHART_TONE.project },
    { label: "Ports", value: data.ports.length, color: CHART_TONE.frontend },
    {
      label: "Databases",
      value: data.databases.length,
      color: CHART_TONE.database,
    },
    { label: "Domains", value: data.domains.length, color: "#a78bfa" },
    { label: "VPS", value: data.vps.length, color: "#fb7185" },
    { label: "CI/CD jobs", value: data.jobs.length, color: CHART_TONE.running },
  ].filter((item) => item.value > 0);
}

export function buildActiveInactive(data: BiData): Array<{
  name: string;
  Active: number;
  Inactive: number;
}> {
  const groups = [
    { name: "Projects", items: data.projects },
    { name: "Ports", items: data.ports },
    { name: "Databases", items: data.databases },
  ];

  return groups
    .map((group) => {
      const active = group.items.filter((item) => item.is_active).length;
      return {
        name: group.name,
        Active: active,
        Inactive: group.items.length - active,
      };
    })
    .filter((row) => row.Active + row.Inactive > 0);
}

export function buildKpis(
  data: BiData,
  rangeDays: BiRangeDays
): BiKpi[] {
  const runningVps = data.vps.filter((vm) => getStatus(vm.state) === "running")
    .length;
  const failedJobs = data.jobs.filter((job) =>
    ["failed", "unstable"].includes(getStatus(job.status))
  ).length;
  const successJobs = data.jobs.filter(
    (job) => getStatus(job.status) === "success"
  ).length;
  const successRate =
    data.jobs.length > 0
      ? Math.round((successJobs / data.jobs.length) * 100)
      : 0;

  const now = Date.now();
  const expiringSoon = data.domains.filter((domain) => {
    if (!domain.expires_at) return false;
    const expires = new Date(domain.expires_at).getTime();
    if (Number.isNaN(expires)) return false;
    const daysLeft = (expires - now) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 30;
  }).length;

  const activeResources =
    data.projects.filter((item) => item.is_active).length +
    data.ports.filter((item) => item.is_active).length +
    data.databases.filter((item) => item.is_active).length;

  return [
    {
      id: "inventory",
      label: "Active inventory",
      value: activeResources,
      hint: "Projects + ports + databases",
      tone: "bg-[rgba(34,211,238,0.14)] text-[#67e8f9]",
      href: "/projects",
    },
    {
      id: "cicd",
      label: "CI/CD success",
      value: `${successRate}%`,
      hint: `${failedJobs} failed / unstable job${failedJobs === 1 ? "" : "s"}`,
      tone: "bg-[rgba(52,211,153,0.14)] text-[#6ee7b7]",
      href: "/ci-cd",
    },
    {
      id: "domains",
      label: "Domains ≤ 30d",
      value: expiringSoon,
      hint: "Renewal window",
      tone: "bg-[rgba(251,191,36,0.14)] text-[#fcd34d]",
      href: "/domain",
    },
    {
      id: "vps",
      label: "VPS running",
      value: runningVps,
      hint: `${data.vps.length} total machines`,
      tone: "bg-[rgba(167,139,250,0.14)] text-[#c4b5fd]",
      href: "/vps",
    },
    {
      id: "activity",
      label: "Admin actions",
      value: data.logs.length,
      hint: `Last ${rangeDays} days`,
      tone: "bg-[rgba(91,134,255,0.16)] text-[#b4c8ff]",
      href: "/logs",
    },
    {
      id: "admins",
      label: "Admins",
      value: data.admins.length,
      hint: "Accounts with access",
      tone: "bg-[rgba(251,113,133,0.14)] text-[#fda4af]",
      href: "/admins",
    },
  ];
}

export function buildInsights(
  data: BiData,
  rangeDays: BiRangeDays
): BiInsight[] {
  const insights: BiInsight[] = [];
  const failedJobs = data.jobs.filter((job) =>
    ["failed", "unstable"].includes(getStatus(job.status))
  );
  const stoppedVps = data.vps.filter(
    (vm) => getStatus(vm.state) === "stopped"
  );
  const inactiveProjects = data.projects.filter((item) => !item.is_active);
  const now = Date.now();
  const expiredDomains = data.domains.filter((domain) => {
    if (!domain.expires_at) return false;
    const expires = new Date(domain.expires_at).getTime();
    return !Number.isNaN(expires) && expires < now;
  });
  const expiringSoon = data.domains.filter((domain) => {
    if (!domain.expires_at) return false;
    const expires = new Date(domain.expires_at).getTime();
    if (Number.isNaN(expires)) return false;
    const daysLeft = (expires - now) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 30;
  });

  if (failedJobs.length > 0) {
    insights.push({
      id: "failed-jobs",
      tone: "critical",
      title: `${failedJobs.length} CI/CD job${failedJobs.length === 1 ? "" : "s"} unhealthy`,
      detail: failedJobs
        .slice(0, 3)
        .map((job) => job.name)
        .join(", "),
    });
  }

  if (expiredDomains.length > 0) {
    insights.push({
      id: "expired-domains",
      tone: "critical",
      title: `${expiredDomains.length} domain${expiredDomains.length === 1 ? "" : "s"} expired`,
      detail: expiredDomains
        .slice(0, 3)
        .map((domain) => domain.domain)
        .join(", "),
    });
  } else if (expiringSoon.length > 0) {
    insights.push({
      id: "expiring-domains",
      tone: "warn",
      title: `${expiringSoon.length} domain${expiringSoon.length === 1 ? "" : "s"} expire within 30 days`,
      detail: expiringSoon
        .slice(0, 3)
        .map((domain) => domain.domain)
        .join(", "),
    });
  }

  if (stoppedVps.length > 0) {
    insights.push({
      id: "stopped-vps",
      tone: "warn",
      title: `${stoppedVps.length} VPS stopped`,
      detail: stoppedVps
        .slice(0, 3)
        .map((vm) => vm.hostname)
        .join(", "),
    });
  }

  if (inactiveProjects.length > 0) {
    insights.push({
      id: "inactive-projects",
      tone: "info",
      title: `${inactiveProjects.length} inactive project${inactiveProjects.length === 1 ? "" : "s"}`,
      detail: "Review whether they still need ports or database links.",
    });
  }

  const loginCount = data.logs.filter(
    (log) => getStatus(log.action) === "login"
  ).length;
  insights.push({
    id: "activity-summary",
    tone: data.logs.length === 0 ? "info" : "ok",
    title:
      data.logs.length === 0
        ? `No admin activity in the last ${rangeDays} days`
        : `${data.logs.length} admin actions · ${loginCount} logins`,
    detail: "Activity is derived from the admin audit log for the selected range.",
  });

  return insights.slice(0, 5);
}
