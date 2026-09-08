"use client";

import { useCallback, useMemo } from "react";
import { getStoredAdmin } from "@/app/lib/adminStorage";
import { useAdminSession } from "@/app/providers/AdminSessionProvider";

export type PermissionAction =
  | "view"
  | "add"
  | "edit"
  | "delete"
  | "export"
  | (string & {});

function normalize(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * Tab-scoped permission checks from the signed-in admin session.
 * Owners bypass all checks (same rule as the API middleware).
 */
export function useTabPermission(tabCode: string) {
  const { permissionMenu } = useAdminSession();
  const code = normalize(tabCode);

  const isOwner = useMemo(() => {
    const role = normalize(getStoredAdmin()?.role);
    return role === "owner";
  }, [permissionMenu]);

  const actionMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const menu of permissionMenu) {
      for (const tab of menu.tabs || []) {
        if (normalize(tab.code) !== code) continue;
        const actions = tab.actions || {};
        for (const [action, allowed] of Object.entries(actions)) {
          map[normalize(action)] = allowed === true;
        }
      }
    }
    return map;
  }, [permissionMenu, code]);

  const can = useCallback(
    (action: PermissionAction) => {
      if (isOwner) return true;
      return actionMap[normalize(action)] === true;
    },
    [actionMap, isOwner]
  );

  return {
    isOwner,
    can,
    canView: can("view"),
    canAdd: can("add"),
    canEdit: can("edit"),
    canDelete: can("delete"),
    canExport: can("export"),
  };
}
