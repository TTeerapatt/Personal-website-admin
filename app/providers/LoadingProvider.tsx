"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type LoadingContextValue = {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(task: () => Promise<T>, message?: string) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

function normalizeAppPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.length > 1 && trimmed.endsWith("/")
    ? trimmed.slice(0, -1)
    : trimmed;
}

/**
 * usePathname() omits Next.js basePath (e.g. "/vps"),
 * while DOM <a href> includes it (e.g. "/nexus/vps").
 * Strip basePath before comparing so same-tab clicks don't stick loading.
 */
function toAppPath(pathnameFromHref: string, routerPathname: string): string {
  const full = normalizeAppPath(pathnameFromHref);
  const current = normalizeAppPath(routerPathname);

  if (typeof window === "undefined") return full;

  const locationPath = normalizeAppPath(window.location.pathname);
  let basePath = "";

  if (current === "/") {
    basePath =
      locationPath === "/"
        ? ""
        : locationPath.endsWith("/")
          ? locationPath.slice(0, -1)
          : locationPath;
  } else if (locationPath.endsWith(current)) {
    basePath = locationPath.slice(0, locationPath.length - current.length);
  }

  if (basePath && (full === basePath || full.startsWith(`${basePath}/`))) {
    return normalizeAppPath(full.slice(basePath.length) || "/");
  }

  return full;
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [manualCount, setManualCount] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const [message, setMessage] = useState("Loading...");
  const routeTimerRef = useRef<number | null>(null);
  const pathnameRef = useRef(pathname);

  pathnameRef.current = pathname;

  const clearRouteTimer = useCallback(() => {
    if (routeTimerRef.current !== null) {
      window.clearTimeout(routeTimerRef.current);
      routeTimerRef.current = null;
    }
  }, []);

  const showLoading = useCallback((nextMessage?: string) => {
    if (nextMessage?.trim()) {
      setMessage(nextMessage.trim());
    } else {
      setMessage("Loading...");
    }
    setManualCount((count) => count + 1);
  }, []);

  const hideLoading = useCallback(() => {
    setManualCount((count) => Math.max(0, count - 1));
  }, []);

  const withLoading = useCallback(
    async <T,>(task: () => Promise<T>, nextMessage?: string) => {
      showLoading(nextMessage);
      try {
        return await task();
      } finally {
        hideLoading();
      }
    },
    [hideLoading, showLoading]
  );

  useEffect(() => {
    setRouteLoading(false);
    clearRouteTimer();
  }, [pathname, clearRouteTimer]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      let hrefPathname = href;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        hrefPathname = url.pathname;
      } catch {
        return;
      }

      const nextPath = toAppPath(hrefPathname, pathnameRef.current);
      const currentPath = normalizeAppPath(pathnameRef.current);

      // Same page — clear any pending overlay so it never sticks.
      if (nextPath === currentPath) {
        setRouteLoading(false);
        clearRouteTimer();
        return;
      }

      setMessage("Changing page...");
      setRouteLoading(true);
      clearRouteTimer();
      routeTimerRef.current = window.setTimeout(() => {
        setRouteLoading(false);
        routeTimerRef.current = null;
      }, 8000);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      clearRouteTimer();
    };
  }, [clearRouteTimer]);

  const value = useMemo<LoadingContextValue>(
    () => ({
      isLoading: manualCount > 0 || routeLoading,
      message,
      showLoading,
      hideLoading,
      withLoading,
    }),
    [hideLoading, manualCount, message, routeLoading, showLoading, withLoading]
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
}
