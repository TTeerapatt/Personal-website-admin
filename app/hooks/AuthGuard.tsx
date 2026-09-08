"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Loading from "@/app/components/loading";
import { getAdminToken } from "@/app/lib/adminStorage";

type AuthGuardProps = {
  children: React.ReactNode;
  /** When true, require token or redirect to /login */
  requireAuth?: boolean;
  /** When true, if token exists redirect away from guest pages (e.g. /login) */
  redirectIfAuthenticated?: boolean;
  redirectTo?: string;
};

export default function AuthGuard({
  children,
  requireAuth = true,
  redirectIfAuthenticated = false,
  redirectTo = "/",
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = getAdminToken()?.trim() || "";

    if (requireAuth && !token) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    if (redirectIfAuthenticated && token) {
      router.replace(redirectTo);
      return;
    }

    setAllowed(true);
  }, [pathname, redirectIfAuthenticated, redirectTo, requireAuth, router]);

  if (!allowed) {
    return (
      <Loading
        variant="fullscreen"
        message="Checking permissions..."
      />
    );
  }

  return <>{children}</>;
}
