"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiActivity, FiDatabase, FiFolder, FiServer } from "react-icons/fi";
import adminAPI, { type AdminItem } from "@/app/services/admin/adminAPI";
import ciCdAPI, { type CiCdJobItem } from "@/app/services/ciCd/ciCdAPI";
import databaseAPI, {
  type DatabaseItem,
} from "@/app/services/database/databaseAPI";
import domainAPI, {
  type DomainListItem,
} from "@/app/services/domain/domainAPI";
import portAPI, { type PortItem } from "@/app/services/port/portAPI";
import projectAPI, {
  type ProjectItem,
} from "@/app/services/project/projectAPI";
import vpsAPI, {
  type VpsVirtualMachine,
} from "@/app/services/vps/vpsAPI";
import {
  CHART_TONE,
  ICON_TONE,
  RESOURCE_CHART_COLORS,
} from "@/app/lib/uiTone";
import OverviewDistributionChart from "./components/overview/OverviewDistributionChart";
import OverviewDonutChart from "./components/overview/OverviewDonutChart";
import OverviewHeader from "./components/overview/OverviewHeader";
import OverviewHealthSection from "./components/overview/OverviewHealthSection";
import OverviewMetricCard from "./components/overview/OverviewMetricCard";
import OverviewStackedBarChart from "./components/overview/OverviewStackedBarChart";
import {
  EMPTY_OVERVIEW,
  type ChartSlice,
  type DistributionItem,
  type OverviewData,
  type StackedBarGroup,
} from "./components/overview/overviewTypes";
import {
  getStatus,
  readList,
} from "./components/overview/overviewUtils";

const CHART_COLORS = {
  success: CHART_TONE.success,
  running: CHART_TONE.running,
  failed: CHART_TONE.failed,
  other: CHART_TONE.other,
  active: CHART_TONE.active,
  inactive: CHART_TONE.inactive,
} as const;

const ACTIVE_INACTIVE_LEGEND: ChartSlice[] = [
  { label: "Active", value: 0, color: CHART_COLORS.active },
  { label: "Inactive", value: 0, color: CHART_COLORS.inactive },
];

type OverviewLoadingState = {
  projects: boolean;
  ports: boolean;
  databases: boolean;
  admins: boolean;
  domains: boolean;
  jobs: boolean;
  vps: boolean;
};

const INITIAL_LOADING_STATE: OverviewLoadingState = {
  projects: true,
  ports: true,
  databases: true,
  admins: true,
  domains: true,
  jobs: true,
  vps: true,
};

export default function OverviewPage() {
  const [overview, setOverview] = useState<OverviewData>(EMPTY_OVERVIEW);
  const [loadingSections, setLoadingSections] =
    useState<OverviewLoadingState>(INITIAL_LOADING_STATE);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoadingSections(INITIAL_LOADING_STATE);

    const loadSection = async <T,>(
      key: keyof OverviewLoadingState,
      request: Promise<unknown>
    ) => {
      try {
        const result = await request;
        setOverview((current) => ({
          ...current,
          [key]: readList<T>(result),
        }));
      } catch {
        setOverview((current) => ({
          ...current,
          [key]: [],
        }));
      } finally {
        setLoadingSections((current) => ({ ...current, [key]: false }));
      }
    };

    await Promise.all([
      loadSection<ProjectItem>("projects", projectAPI.getProjectAll()),
      loadSection<PortItem>("ports", portAPI.getPortAll()),
      loadSection<DatabaseItem>("databases", databaseAPI.getDatabaseAll()),
      loadSection<AdminItem>("admins", adminAPI.getAdminAll()),
      loadSection<DomainListItem>("domains", domainAPI.getDomainsAll()),
      loadSection<CiCdJobItem>("jobs", ciCdAPI.getJobs()),
      loadSection<VpsVirtualMachine>("vps", vpsAPI.getVpsAll()),
    ]);
    setLastUpdated(new Date().toISOString());
  }, []);

  useEffect(() => {
    // Initial data loading is intentionally triggered from this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOverview();
  }, [fetchOverview]);

  const summary = useMemo(() => {
    const runningVps = overview.vps.filter(
      (vm) => getStatus(vm.state) === "running"
    ).length;
    const failedJobs = overview.jobs.filter((job) =>
      ["failed", "unstable"].includes(getStatus(job.status))
    ).length;
    const runningJobs = overview.jobs.filter(
      (job) => getStatus(job.status) === "running"
    ).length;
    const activeDomains = overview.domains.filter((domain) =>
      ["active", "registered", "ok"].includes(getStatus(domain.status))
    ).length;

    return {
      activeProjects: overview.projects.filter((item) => item.is_active).length,
      activePorts: overview.ports.filter((item) => item.is_active).length,
      activeDatabases: overview.databases.filter((item) => item.is_active).length,
      runningVps,
      failedJobs,
      runningJobs,
      activeDomains,
    };
  }, [overview]);

  const projectDistribution = useMemo<DistributionItem[]>(() => {
    const projectCount = overview.projects.filter(
      (item) => getStatus(item.type) === "project"
    ).length;
    const serviceCount = overview.projects.filter(
      (item) => getStatus(item.type) === "service"
    ).length;

    return [
      { label: "Project", value: projectCount, color: CHART_TONE.project },
      { label: "Service", value: serviceCount, color: CHART_TONE.service },
    ].filter((item) => item.value > 0);
  }, [overview.projects]);

  const portDistribution = useMemo<DistributionItem[]>(() => {
    const counts = new Map<string, number>();

    for (const port of overview.ports) {
      const label = port.resource_type_name || port.resource_type_code || "Other";
      counts.set(label, (counts.get(label) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([label, value], index) => ({
        label,
        value,
        color: RESOURCE_CHART_COLORS[index % RESOURCE_CHART_COLORS.length],
      }));
  }, [overview.ports]);

  const ciCdStatusDistribution = useMemo<ChartSlice[]>(() => {
    let success = 0;
    let running = 0;
    let failed = 0;
    let other = 0;

    for (const job of overview.jobs) {
      const status = getStatus(job.status);
      if (status === "success") success += 1;
      else if (status === "running") running += 1;
      else if (status === "failed" || status === "unstable") failed += 1;
      else other += 1;
    }

    return [
      { label: "Success", value: success, color: CHART_COLORS.success },
      { label: "Running", value: running, color: CHART_COLORS.running },
      { label: "Failed", value: failed, color: CHART_COLORS.failed },
      { label: "Other", value: other, color: CHART_COLORS.other },
    ].filter((item) => item.value > 0);
  }, [overview.jobs]);

  const activeInactiveGroups = useMemo<StackedBarGroup[]>(() => {
    const buildGroup = (
      label: string,
      items: Array<{ is_active: boolean }>
    ): StackedBarGroup => {
      const active = items.filter((item) => item.is_active).length;
      const inactive = items.length - active;
      return {
        label,
        segments: [
          { label: "Active", value: active, color: CHART_COLORS.active },
          { label: "Inactive", value: inactive, color: CHART_COLORS.inactive },
        ],
      };
    };

    return [
      buildGroup("Projects", overview.projects),
      buildGroup("Ports", overview.ports),
      buildGroup("Databases", overview.databases),
    ].filter((group) =>
      group.segments.some((segment) => segment.value > 0)
    );
  }, [overview.projects, overview.ports, overview.databases]);

  const chartsLoading =
    loadingSections.projects ||
    loadingSections.ports ||
    loadingSections.databases;

  const loading = Object.values(loadingSections).some(Boolean);

  return (
    <div className="space-y-5">
      <OverviewHeader loading={loading} lastUpdated={lastUpdated} />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetricCard
          label="Active projects"
          value={summary.activeProjects}
          icon={FiFolder}
          tone={ICON_TONE.cyan}
          href="/projects"
          loading={loadingSections.projects}
        />
        <OverviewMetricCard
          label="Active ports"
          value={summary.activePorts}
          icon={FiActivity}
          tone={ICON_TONE.blue}
          href="/port"
          loading={loadingSections.ports}
        />
        <OverviewMetricCard
          label="Active databases"
          value={summary.activeDatabases}
          icon={FiDatabase}
          tone={ICON_TONE.emerald}
          href="/database"
          loading={loadingSections.databases}
        />
        <OverviewMetricCard
          label="Running VPS"
          value={summary.runningVps}
          icon={FiServer}
          tone={ICON_TONE.violet}
          href="/vps"
          loading={loadingSections.vps}
        />
      </section>

      <OverviewHealthSection
        overview={overview}
        runningVps={summary.runningVps}
        activeDomains={summary.activeDomains}
        failedJobs={summary.failedJobs}
        runningJobs={summary.runningJobs}
        loading={{
          vps: loadingSections.vps,
          jobs: loadingSections.jobs,
          domains: loadingSections.domains,
          admins: loadingSections.admins,
        }}
      />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <OverviewDonutChart
          title="CI/CD status"
          subtitle="Job health across Jenkins pipelines"
          items={ciCdStatusDistribution}
          emptyText="No CI/CD job data available"
          loading={loadingSections.jobs}
          centerLabel="Jobs"
        />
        <OverviewStackedBarChart
          title="Active vs inactive"
          subtitle="Projects, ports, and databases in use"
          groups={activeInactiveGroups}
          legend={ACTIVE_INACTIVE_LEGEND}
          emptyText="No resource data available"
          loading={chartsLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <OverviewDistributionChart
          title="Projects by type"
          items={projectDistribution}
          emptyText="No project data available"
          loading={loadingSections.projects}
        />
        <OverviewDistributionChart
          title="Ports by resource type"
          items={portDistribution}
          emptyText="No port data available"
          loading={loadingSections.ports}
        />
      </section>
    </div>
  );
}
