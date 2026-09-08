"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import authAPI from "@/app/services/auth/authAPI";
import menuAPI from "@/app/services/menu/menuAPI";
import {
  clearAdminSession,
  getAdminToken,
  type StoredMenuAll,
  type StoredPermissionMenu,
} from "@/app/lib/adminStorage";
import Loading from "@/app/components/loading";
import { popup } from "@/app/ui/popUp";

type AdminSessionContextValue = {
  permissionMenu: StoredPermissionMenu[];
  menuAll: StoredMenuAll | null;
  ready: boolean;
  refreshSession: () => Promise<void>;
};

const AdminSessionContext = createContext<AdminSessionContextValue | null>(
  null
);

function isFailedResult(result: unknown): boolean {
  return (
    !!result &&
    typeof result === "object" &&
    "status" in result &&
    (result as { status?: string }).status === "failed"
  );
}

export function AdminSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [permissionMenu, setPermissionMenu] = useState<StoredPermissionMenu[]>(
    []
  );
  const [menuAll, setMenuAll] = useState<StoredMenuAll | null>(null);
  const [ready, setReady] = useState(false);

  const refreshSession = useCallback(async () => {
    if (!getAdminToken()) {
      setPermissionMenu([]);
      setMenuAll(null);
      setReady(true);
      return;
    }

    setReady(false);
    try {
      const [meResult, menuResult] = await Promise.all([
        authAPI.getMe(),
        menuAPI.getMenuAll(),
      ]);

      if (isFailedResult(meResult) || isFailedResult(menuResult)) {
        clearAdminSession();
        setPermissionMenu([]);
        setMenuAll(null);
        await popup.error(
          "Session expired",
          "Unable to load permissions. Please sign in again"
        );
        router.replace("/login");
        return;
      }

      const mePayload = (meResult as { data?: { menu?: StoredPermissionMenu[] } })
        ?.data;
      const menuAllPayload = (menuResult as { data?: StoredMenuAll })?.data;

      if (!mePayload?.menu || !menuAllPayload?.labels || !menuAllPayload?.tabs) {
        clearAdminSession();
        setPermissionMenu([]);
        setMenuAll(null);
        await popup.error(
          "Invalid session",
          "Incomplete user permission data from server"
        );
        router.replace("/login");
        return;
      }

      setPermissionMenu(mePayload.menu);
      setMenuAll(menuAllPayload);
    } catch {
      clearAdminSession();
      setPermissionMenu([]);
      setMenuAll(null);
      await popup.error(
        "Session expired",
        "Unable to load permissions. Please sign in again"
      );
      router.replace("/login");
    } finally {
      setReady(true);
    }
  }, [router]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      permissionMenu,
      menuAll,
      ready,
      refreshSession,
    }),
    [permissionMenu, menuAll, ready, refreshSession]
  );

  if (!ready) {
    return <Loading variant="fullscreen" message="Loading menu permissions..." />;
  }

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession(): AdminSessionContextValue {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }
  return ctx;
}
