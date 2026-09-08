import type { ApiListResult } from "./overviewTypes";

export function readList<T>(result: unknown): T[] {
  if (!result || typeof result !== "object") return [];

  const response = result as ApiListResult<T>;
  if (response.status === "failed" || response.success === false) return [];
  return Array.isArray(response.data) ? response.data : [];
}

export function getSettledList<T>(
  result: PromiseSettledResult<unknown>
): T[] {
  return result.status === "fulfilled" ? readList<T>(result.value) : [];
}

export function getStatus(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}
