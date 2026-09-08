import type { AdminItem } from "@/app/services/admin/adminAPI";
import type { AdminLogItem } from "@/app/services/adminLog/adminLogAPI";
import type { CiCdJobItem } from "@/app/services/ciCd/ciCdAPI";
import type { DatabaseItem } from "@/app/services/database/databaseAPI";
import type { DomainListItem } from "@/app/services/domain/domainAPI";
import type { PortItem } from "@/app/services/port/portAPI";
import type { ProjectItem } from "@/app/services/project/projectAPI";
import type { VpsVirtualMachine } from "@/app/services/vps/vpsAPI";

export type BiRangeDays = 7 | 30 | 90;

export type BiChartSlice = {
  label: string;
  value: number;
  color: string;
};

export type BiTrendPoint = {
  date: string;
  label: string;
  total: number;
  login: number;
  mutate: number;
};

export type BiKpi = {
  id: string;
  label: string;
  value: number | string;
  hint: string;
  tone: string;
  href?: string;
};

export type BiInsight = {
  id: string;
  tone: "ok" | "warn" | "critical" | "info";
  title: string;
  detail: string;
};

export type BiData = {
  projects: ProjectItem[];
  ports: PortItem[];
  databases: DatabaseItem[];
  admins: AdminItem[];
  domains: DomainListItem[];
  jobs: CiCdJobItem[];
  vps: VpsVirtualMachine[];
  logs: AdminLogItem[];
};

export type BiLoadingState = {
  projects: boolean;
  ports: boolean;
  databases: boolean;
  admins: boolean;
  domains: boolean;
  jobs: boolean;
  vps: boolean;
  logs: boolean;
};

export const EMPTY_BI_DATA: BiData = {
  projects: [],
  ports: [],
  databases: [],
  admins: [],
  domains: [],
  jobs: [],
  vps: [],
  logs: [],
};

export const INITIAL_BI_LOADING: BiLoadingState = {
  projects: true,
  ports: true,
  databases: true,
  admins: true,
  domains: true,
  jobs: true,
  vps: true,
  logs: true,
};
