import { MdAdminPanelSettings, MdManageAccounts, MdBadge } from "react-icons/md";
import type { AdminPermissionInput, AdminPermissionMenu } from "@/app/services/admin/adminAPI";
import type { MenuTab } from "@/app/services/menu/menuAPI";

export type AdminFormModalProps = {
  open: boolean;
  /** If set = edit mode; load from `GET admins/:id/permissions` */
  adminId?: number | null;
  onClose: () => void;
  onCreated: () => void;
  onUpdated?: () => void;
};

export type AdminRole = "owner" | "admin" | "staff";

export type PermissionMap = Record<string, Record<string, boolean>>;

export type FormField =
  | "display_name"
  | "email"
  | "password"
  | "confirmPassword";

export type AdminFormValues = {
  display_name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function getSteps(isEdit: boolean) {
  return [
    { id: 1, label: "Select role" },
    { id: 2, label: "User details" },
    { id: 3, label: "Permission scope" },
    { id: 4, label: isEdit ? "Confirm update" : "Confirm create" },
  ] as const;
}

export const ROLE_OPTIONS: Array<{
  value: AdminRole;
  title: string;
  subtitle: string;
  description: string;
  Icon: typeof MdAdminPanelSettings;
}> = [
  {
    value: "owner",
    title: "Owner",
    subtitle: "System owner",
    description: "Full access to all menus; skips permission checks",
    Icon: MdAdminPanelSettings,
  },
  {
    value: "admin",
    title: "Admin",
    subtitle: "Administrator",
    description: "Manage core data based on assigned permissions",
    Icon: MdManageAccounts,
  },
  {
    value: "staff",
    title: "Staff",
    subtitle: "Staff",
    description: "Access only allowed menu scopes",
    Icon: MdBadge,
  },
];

export const ACTION_ORDER = ["view", "add", "edit", "delete", "export"] as const;

export function emptyForm(): AdminFormValues {
  return {
    display_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };
}

const inputBaseClass =
  "h-11 w-full rounded-xl border bg-[var(--surface)] text-[14px] text-[var(--text-primary)] outline-none transition";
const inputNormalClass =
  "border-[var(--border-strong)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15";
const inputErrorClass =
  "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";

export function getInputClass(hasError: boolean, extra = "") {
  return `${inputBaseClass} ${hasError ? inputErrorClass : inputNormalClass} ${extra}`.trim();
}

export function buildDefaultPermissions(
  tabs: MenuTab[],
  role: AdminRole
): PermissionMap {
  const next: PermissionMap = {};
  for (const tab of tabs) {
    const actions = tab.actions ?? [];
    next[tab.code] = {};
    for (const action of actions) {
      if (role === "owner") {
        next[tab.code][action.code] = true;
      } else if (role === "admin") {
        next[tab.code][action.code] = ["view", "add", "edit", "delete"].includes(
          action.code
        );
      } else {
        next[tab.code][action.code] = action.code === "view";
      }
    }
  }
  return next;
}

export function permissionsToPayload(map: PermissionMap): AdminPermissionInput[] {
  return Object.entries(map)
    .map(([tab_code, actions]) => ({
      tab_code,
      action_codes: Object.entries(actions)
        .filter(([, allowed]) => allowed)
        .map(([code]) => code),
    }))
    .filter((item) => item.action_codes.length > 0);
}

export function permissionsFromAdminMenu(
  tabs: MenuTab[],
  menu: AdminPermissionMenu[],
  role: AdminRole
): PermissionMap {
  if (role === "owner") {
    return buildDefaultPermissions(tabs, "owner");
  }

  const next = buildDefaultPermissions(tabs, "staff");
  for (const tab of tabs) {
    for (const action of tab.actions ?? []) {
      next[tab.code][action.code] = false;
    }
  }

  for (const group of menu) {
    for (const tab of group.tabs || []) {
      if (!next[tab.code]) next[tab.code] = {};
      for (const [actionCode, allowed] of Object.entries(tab.actions || {})) {
        next[tab.code][actionCode] = Boolean(allowed);
      }
    }
  }
  return next;
}
