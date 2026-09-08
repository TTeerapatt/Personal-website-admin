import type { AdminItem } from "@/app/services/admin/adminAPI";
import type { CiCdJobItem } from "@/app/services/ciCd/ciCdAPI";
import type { DatabaseItem } from "@/app/services/database/databaseAPI";
import type { DomainListItem } from "@/app/services/domain/domainAPI";
import type { PortItem } from "@/app/services/port/portAPI";
import type { ProjectItem } from "@/app/services/project/projectAPI";
import type { VpsVirtualMachine } from "@/app/services/vps/vpsAPI";

export type ApiListResult<T> = {
  success?: boolean;
  status?: string;
  data?: T[];
};

export type OverviewData = {
  projects: ProjectItem[];
  ports: PortItem[];
  databases: DatabaseItem[];
  admins: AdminItem[];
  domains: DomainListItem[];
  jobs: CiCdJobItem[];
  vps: VpsVirtualMachine[];
};

/** Chart slice — `color` is a CSS color (hex) for Recharts. */
export type DistributionItem = {
  label: string;
  value: number;
  color: string;
};

/** Alias kept for donut / stacked chart call sites. */
export type ChartSlice = DistributionItem;

export type StackedBarGroup = {
  label: string;
  segments: ChartSlice[];
};

export const EMPTY_OVERVIEW: OverviewData = {
  projects: [],
  ports: [],
  databases: [],
  admins: [],
  domains: [],
  jobs: [],
  vps: [],
};
