import type { IconType } from "react-icons";
import {
  MdAdminPanelSettings,
  MdCode,
  MdDashboard,
  MdFolder,
  MdHistory,
  MdImage,
  MdSchool,
  MdSettings,
  MdWork,
} from "react-icons/md";

export type NavItem = {
  href: string;
  label: string;
  icon: IconType;
};

export const TAB_CODE_TO_HREF: Record<string, string> = {
  overview: "/",
  "site-settings": "/site-settings",
  "home-banners": "/home-banners",
  skills: "/skills",
  projects: "/projects",
  experiences: "/experiences",
  education: "/education",
  admins: "/admins",
  logs: "/logs",
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", icon: MdDashboard },
  { href: "/site-settings", label: "Site Settings", icon: MdSettings },
  { href: "/home-banners", label: "Home Banners", icon: MdImage },
  { href: "/skills", label: "Skills", icon: MdCode },
  { href: "/projects", label: "Projects", icon: MdFolder },
  { href: "/experiences", label: "Experiences", icon: MdWork },
  { href: "/education", label: "Education", icon: MdSchool },
  { href: "/admins", label: "Admins", icon: MdAdminPanelSettings },
  { href: "/logs", label: "Logs", icon: MdHistory },
];

const TAB_CODE_TO_ICON: Record<string, IconType> = {
  overview: MdDashboard,
  "site-settings": MdSettings,
  "home-banners": MdImage,
  skills: MdCode,
  projects: MdFolder,
  experiences: MdWork,
  education: MdSchool,
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
