"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiLogOut } from "react-icons/fi";
import { MdAdminPanelSettings } from "react-icons/md";
import type {
  StoredAdmin,
  StoredMenuLabel,
  StoredMenuTab,
} from "@/app/lib/adminStorage";
import {
  clearAdminSession,
  getStoredAdmin,
} from "@/app/lib/adminStorage";
import {
  getTabHrefByCode,
  getTabIconByCode,
  NAV_ITEMS,
} from "@/app/lib/navItems";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { useAdminSession } from "@/app/providers/AdminSessionProvider";

type GroupedMenu = {
  label: StoredMenuLabel;
  tabs: StoredMenuTab[];
};

export default function SideBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { withLoading } = useLoading();
  const { permissionMenu, menuAll } = useAdminSession();
  const [admin, setAdmin] = useState<StoredAdmin | null>(null);

  useEffect(() => {
    // Read the browser session after the client has mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdmin(getStoredAdmin());
  }, []);

  const handleLogout = async () => {
    const confirmed = await popup.logout();
    if (!confirmed) return;

    await withLoading(async () => {
      clearAdminSession();
      setAdmin(null);
    }, "Signing out...");
    await popup.success("Signed out successfully", "You have been signed out");
    router.replace("/login");
  };

  const groups = useMemo(() => {
    if (!menuAll) return [] as GroupedMenu[];

    const canViewTab = new Set<string>();
    for (const menu of permissionMenu) {
      for (const tab of menu.tabs || []) {
        if (tab.actions?.view === true) {
          canViewTab.add(String(tab.code || "").trim().toLowerCase());
        }
      }
    }

    const labels = [...menuAll.labels]
      .filter((label) => label.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
    const tabs = [...menuAll.tabs]
      .filter((tab) => tab.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);

    return labels
      .map((label) => {
        const allowedTabs = tabs.filter((tab) => {
          const tabCode = String(tab.code || "").trim().toLowerCase();
          return (
            tab.menu_label_id === label.id &&
            canViewTab.has(tabCode) &&
            Boolean(getTabHrefByCode(tabCode))
          );
        });
        return { label, tabs: allowedTabs };
      })
      .filter((group) => group.tabs.length > 0);
  }, [permissionMenu, menuAll]);

  const fallbackItems = useMemo(() => NAV_ITEMS, []);
  const hasDynamicMenu = groups.length > 0;

  return (
    <aside className="flex h-screen w-[250px] shrink-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="flex h-[76px] shrink-0 items-center border-b border-[var(--border)] px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--surface-raised)] shadow-[0_6px_14px_rgba(36,46,66,0.18)] ring-1 ring-[var(--brand-primary)]/10">
            <MdAdminPanelSettings className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-[16px] font-extrabold tracking-[-0.01em] text-[var(--text-primary)]">
              Nexus Admin
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {hasDynamicMenu
          ? groups.map((group) => (
              <div key={group.label.code} className="space-y-1.5">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {group.label.name}
                </p>
                {group.tabs.map((tab) => {
                  const href = getTabHrefByCode(tab.code) as string;
                  const Icon = getTabIconByCode(tab.code);
                  const isActive =
                    href === "/"
                      ? pathname === "/"
                      : pathname === href || pathname.startsWith(`${href}/`);

                  return (
                    <Link
                      key={`${group.label.code}-${tab.code}`}
                      href={href}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition ${
                        isActive
                          ? "bg-[rgba(91,134,255,0.16)] text-[#b4c8ff] shadow-sm ring-1 ring-[rgba(91,134,255,0.32)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 ${
                          isActive ? "text-[#b4c8ff]" : "text-[var(--text-muted)]"
                        }`}
                      />
                      <span>{tab.name}</span>
                    </Link>
                  );
                })}
              </div>
            ))
          : fallbackItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition ${
                    isActive
                      ? "bg-[rgba(91,134,255,0.16)] text-[#b4c8ff] shadow-sm ring-1 ring-[rgba(91,134,255,0.32)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? "text-[#b4c8ff]" : "text-[var(--text-muted)]"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
      </nav>

      <div className="shrink-0 border-t border-[var(--border)] p-2.5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[12px] font-bold text-white">
              {(admin?.display_name || "Admin")
                .split(/[\s_]+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("") || "A"}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                {admin?.display_name?.trim() || "Admin"}
              </p>
              <p className="truncate text-[11px] text-[var(--text-muted)]">
                {admin?.email?.trim() || "Administrator"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--text-primary)] transition hover:scale-110 hover:text-[#dc2626] focus:outline-none focus:ring-2 focus:ring-[#dc2626]/25"
              aria-label="Sign out"
              title="Sign out"
            >
              <FiLogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
