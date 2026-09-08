export const ADMIN_TOKEN_KEY = "nexus_admin_token";
export const ADMIN_PROFILE_KEY = "nexus_admin_admin";

/** Legacy keys — cleared on logout only; no longer written. */
const LEGACY_PERMISSION_MENU_KEY = "nexus_admin_permission_menu";
const LEGACY_MENU_ALL_KEY = "nexus_admin_menu_all";

export type StoredAdmin = {
  id: string | number;
  email: string;
  display_name: string;
  role: string;
  created_at?: string;
  updated_at?: string;
};

export type StoredPermissionTab = {
  code: string;
  name: string;
  actions: Record<string, boolean>;
};

export type StoredPermissionMenu = {
  code: string;
  name: string;
  tabs: StoredPermissionTab[];
};

export type StoredMenuLabel = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type StoredMenuTab = {
  id: number;
  menu_label_id: number;
  menu_label_code: string;
  menu_label_name: string;
  code: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  actions?: Array<{ code: string; name: string; sort_order: number }>;
};

export type StoredMenuAll = {
  labels: StoredMenuLabel[];
  tabs: StoredMenuTab[];
};

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)?.trim() || "";
  return token || null;
}

export function getStoredAdmin(): StoredAdmin | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAdmin;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_PROFILE_KEY);
  localStorage.removeItem(LEGACY_PERMISSION_MENU_KEY);
  localStorage.removeItem(LEGACY_MENU_ALL_KEY);
}
