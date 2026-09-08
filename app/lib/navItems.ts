import type { IconType } from "react-icons";
import {
  MdAdminPanelSettings,
  MdAnalytics,
  MdCloud,
  MdDashboard,
  MdFolder,
  MdHistory,
  MdLanguage,
  MdSettingsEthernet,
  MdStorage,
  MdSync,
} from "react-icons/md";
import { GoWorkflow } from "react-icons/go";
import { FaNetworkWired } from "react-icons/fa";

export type NavItem = {
  href: string;
  label: string;
  icon: IconType;
};

export const TAB_CODE_TO_HREF: Record<string, string> = {
  overview: "/",
  bi: "/bi",
  vps: "/vps",
  "ci-cd": "/ci-cd",
  port: "/port",
  domain: "/domain",
  database: "/database",
  projects: "/projects",
  admins: "/admins",
  logs: "/logs",
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: MdDashboard },
  { href: "/admins", label: "Admins", icon: MdAdminPanelSettings },
  { href: "/logs", label: "Logs", icon: MdHistory },
];

const TAB_CODE_TO_ICON: Record<string, IconType> = {
  overview: MdDashboard,
  bi: MdAnalytics,
  vps: MdCloud,
  "ci-cd": GoWorkflow,
  port: FaNetworkWired,
  domain: MdLanguage,
  database: MdStorage,
  projects: MdFolder,
  admins: MdAdminPanelSettings,
  logs: MdHistory,
};

export function getTabHrefByCode(tabCode: string): string | null {
  const key = String(tabCode || "").trim().toLowerCase();
  return TAB_CODE_TO_HREF[key] ?? null;
}

export function getTabCodeByPath(pathname: string): string | null {
  const path = String(pathname || "").trim();
  const entries = Object.entries(TAB_CODE_TO_HREF);
  const exact = entries.find(([, href]) => href === path);
  if (exact) return exact[0];

  const nested = entries.find(
    ([, href]) => href !== "/" && path.startsWith(`${href}/`)
  );
  return nested?.[0] ?? null;
}

export function getTabIconByCode(tabCode: string): IconType {
  const key = String(tabCode || "").trim().toLowerCase();
  return TAB_CODE_TO_ICON[key] ?? MdDashboard;
}

export function getNavLabelByPath(pathname: string): string {
  const exact = NAV_ITEMS.find((item) => item.href === pathname);
  if (exact) return exact.label;

  const nested = NAV_ITEMS.find(
    (item) => item.href !== "/" && pathname.startsWith(item.href)
  );
  return nested?.label ?? "Overview";
}
