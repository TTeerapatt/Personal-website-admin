"use client";

import SideBar from "@/app/components/layout/sideBar";
import LoadingOverlayHost from "@/app/components/layout/LoadingOverlayHost";
import AuthGuard from "@/app/hooks/AuthGuard";
import { LoadingProvider } from "@/app/providers/LoadingProvider";
import { AdminSessionProvider } from "@/app/providers/AdminSessionProvider";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoadingProvider>
      <AuthGuard requireAuth>
        <AdminSessionProvider>
          <div className="flex h-screen overflow-hidden bg-[var(--canvas)]">
            <SideBar />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <main className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-6">
                {children}
                <LoadingOverlayHost />
              </main>
            </div>
          </div>
        </AdminSessionProvider>
      </AuthGuard>
    </LoadingProvider>
  );
}
