"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiFolder,
  FiGlobe,
  FiServer,
  FiUsers,
} from "react-icons/fi";
import { MdOutlineSpeed } from "react-icons/md";
import type { IconType } from "react-icons";
import adminAPI, { type AdminItem } from "@/app/services/admin/adminAPI";
import adminLogAPI, {
  type AdminLogItem,
} from "@/app/services/adminLog/adminLogAPI";
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
import BiActivityAreaChart from "./BiActivityAreaChart";
import BiDonutChart from "./BiDonutChart";
import BiHeader from "./BiHeader";
import BiHBarChart from "./BiHBarChart";
import BiInsightList from "./BiInsightList";
import BiKpiGrid from "./BiKpiGrid";
import BiStackedBarChart from "./BiStackedBarChart";
import BiVBarChart from "./BiVBarChart";
import {
  EMPTY_BI_DATA,
  INITIAL_BI_LOADING,
  type BiData,
  type BiLoadingState,
  type BiRangeDays,
} from "./biTypes";
import {
  buildActionDistribution,
  buildActiveInactive,
  buildActivityTrend,
  buildCiCdStatus,
  buildDatabaseEngines,
  buildDomainExpiry,
  buildInsights,
  buildInventoryMix,
  buildKpis,
  buildPortResources,
  buildProjectType,
  buildTopAdmins,
  buildVpsState,
  rangeToDateFrom,
  readList,
} from "./biUtils";

const KPI_ICONS: Record<string, IconType> = {
  inventory: FiFolder,
  cicd: MdOutlineSpeed,
  domains: FiGlobe,
  vps: FiServer,
  activity: FiActivity,
  admins: FiUsers,
};

export default function BiMain() {
  const [data, setData] = useState<BiData>(EMPTY_BI_DATA);
  const [loadingSections, setLoadingSections] =
    useState<BiLoadingState>(INITIAL_BI_LOADING);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<BiRangeDays>(30);

  const fetchBi = useCallback(async (days: BiRangeDays) => {
    setLoadingSections(INITIAL_BI_LOADING);

    const loadSection = async <T,>(
      key: keyof BiLoadingState,
      request: Promise<unknown>
    ) => {
      try {
        const result = await request;
        setData((current) => ({
          ...current,
          [key]: readList<T>(result),
        }));
      } catch {
        setData((current) => ({
          ...current,
          [key]: [],
        }));
      } finally {
        setLoadingSections((current) => ({ ...current, [key]: false }));
      }
    };

    const dateFrom = rangeToDateFrom(days);

    await Promise.all([
      loadSection<ProjectItem>("projects", projectAPI.getProjectAll()),
      loadSection<PortItem>("ports", portAPI.getPortAll()),
      loadSection<DatabaseItem>("databases", databaseAPI.getDatabaseAll()),
      loadSection<AdminItem>("admins", adminAPI.getAdminAll()),
      loadSection<DomainListItem>("domains", domainAPI.getDomainsAll()),
      loadSection<CiCdJobItem>("jobs", ciCdAPI.getJobs()),
      loadSection<VpsVirtualMachine>("vps", vpsAPI.getVpsAll()),
      loadSection<AdminLogItem>(
        "logs",
        adminLogAPI.getAdminLogAll({ date_from: dateFrom })
      ),
    ]);

    setLastUpdated(new Date().toISOString());
  }, []);

  useEffect(() => {
    void fetchBi(rangeDays);
  }, [fetchBi, rangeDays]);

  const kpis = useMemo(() => buildKpis(data, rangeDays), [data, rangeDays]);
  const insights = useMemo(
    () => buildInsights(data, rangeDays),
    [data, rangeDays]
  );
  const activityTrend = useMemo(
    () => buildActivityTrend(data.logs, rangeDays),
    [data.logs, rangeDays]
  );
  const actionDistribution = useMemo(
    () => buildActionDistribution(data.logs),
    [data.logs]
  );
  const topAdmins = useMemo(() => buildTopAdmins(data.logs), [data.logs]);
  const inventoryMix = useMemo(() => buildInventoryMix(data), [data]);
  const activeInactive = useMemo(() => buildActiveInactive(data), [data]);
  const ciCdStatus = useMemo(() => buildCiCdStatus(data.jobs), [data.jobs]);
  const domainExpiry = useMemo(
    () => buildDomainExpiry(data.domains),
    [data.domains]
  );
  const vpsState = useMemo(() => buildVpsState(data.vps), [data.vps]);
  const projectTypes = useMemo(
    () => buildProjectType(data.projects),
    [data.projects]
  );
  const portResources = useMemo(
    () => buildPortResources(data.ports),
    [data.ports]
  );
  const databaseEngines = useMemo(
    () => buildDatabaseEngines(data.databases),
    [data.databases]
  );

  const loading = Object.values(loadingSections).some(Boolean);
  const inventoryLoading =
    loadingSections.projects ||
    loadingSections.ports ||
    loadingSections.databases ||
    loadingSections.domains ||
    loadingSections.vps ||
    loadingSections.jobs;

  return (
    <div className="space-y-5">
      <BiHeader
        loading={loading}
        lastUpdated={lastUpdated}
        rangeDays={rangeDays}
        onRangeChange={setRangeDays}
      />

      <BiKpiGrid kpis={kpis} icons={KPI_ICONS} loading={loading} />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <BiActivityAreaChart
            title="Admin activity trend"
            points={activityTrend}
            emptyText="No admin log activity in this range"
            loading={loadingSections.logs}
          />
        </div>
        <BiInsightList insights={insights} loading={loading} />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BiDonutChart
          title="Actions by type"
          items={actionDistribution}
          emptyText="No actions recorded in this range"
          loading={loadingSections.logs}
          centerLabel="Actions"
        />
        <BiHBarChart
          title="Top admins"
          items={topAdmins}
          emptyText="No admin activity to rank"
          loading={loadingSections.logs}
          valueLabel="Actions"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BiVBarChart
          title="Inventory mix"
          items={inventoryMix}
          emptyText="No inventory data available"
          loading={inventoryLoading}
        />
        <BiStackedBarChart
          title="Active vs inactive"
          rows={activeInactive}
          emptyText="No resource status data available"
          loading={
            loadingSections.projects ||
            loadingSections.ports ||
            loadingSections.databases
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <BiDonutChart
          title="CI/CD health"
          items={ciCdStatus}
          emptyText="No CI/CD job data available"
          loading={loadingSections.jobs}
          centerLabel="Jobs"
        />
        <BiDonutChart
          title="Domain expiry risk"
          items={domainExpiry}
          emptyText="No domain expiry data available"
          loading={loadingSections.domains}
          centerLabel="Domains"
        />
        <BiDonutChart
          title="VPS state"
          items={vpsState}
          emptyText="No VPS data available"
          loading={loadingSections.vps}
          centerLabel="VMs"
        />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <BiHBarChart
          title="Projects by type"
          items={projectTypes}
          emptyText="No project data available"
          loading={loadingSections.projects}
        />
        <BiHBarChart
          title="Ports by resource"
          items={portResources}
          emptyText="No port data available"
          loading={loadingSections.ports}
        />
        <BiHBarChart
          title="Databases by engine"
          items={databaseEngines}
          emptyText="No database data available"
          loading={loadingSections.databases}
        />
      </section>
    </div>
  );
}
