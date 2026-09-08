/**
 * Soft status / category tones for the dark Nexus theme.
 * Prefer translucent fills + luminous text over solid pastels or heavy solids.
 */

export const TONE = {
  brand:
    "bg-[rgba(91,134,255,0.16)] text-[#b4c8ff] ring-1 ring-[rgba(91,134,255,0.32)]",
  cyan:
    "bg-[rgba(34,211,238,0.14)] text-[#67e8f9] ring-1 ring-[rgba(34,211,238,0.28)]",
  sky:
    "bg-[rgba(56,189,248,0.14)] text-[#7dd3fc] ring-1 ring-[rgba(56,189,248,0.28)]",
  blue:
    "bg-[rgba(96,165,250,0.14)] text-[#93c5fd] ring-1 ring-[rgba(96,165,250,0.28)]",
  indigo:
    "bg-[rgba(129,140,248,0.14)] text-[#a5b4fc] ring-1 ring-[rgba(129,140,248,0.28)]",
  violet:
    "bg-[rgba(167,139,250,0.14)] text-[#c4b5fd] ring-1 ring-[rgba(167,139,250,0.28)]",
  fuchsia:
    "bg-[rgba(232,121,249,0.14)] text-[#f0abfc] ring-1 ring-[rgba(232,121,249,0.28)]",
  rose:
    "bg-[rgba(251,113,133,0.14)] text-[#fda4af] ring-1 ring-[rgba(251,113,133,0.28)]",
  amber:
    "bg-[rgba(251,191,36,0.14)] text-[#fcd34d] ring-1 ring-[rgba(251,191,36,0.28)]",
  orange:
    "bg-[rgba(251,146,60,0.14)] text-[#fdba74] ring-1 ring-[rgba(251,146,60,0.28)]",
  emerald:
    "bg-[rgba(52,211,153,0.14)] text-[#6ee7b7] ring-1 ring-[rgba(52,211,153,0.28)]",
  teal:
    "bg-[rgba(45,212,191,0.14)] text-[#5eead4] ring-1 ring-[rgba(45,212,191,0.28)]",
  slate:
    "bg-[rgba(148,163,184,0.12)] text-[#cbd5e1] ring-1 ring-[rgba(148,163,184,0.22)]",
  red:
    "bg-[rgba(248,113,113,0.14)] text-[#fca5a5] ring-1 ring-[rgba(248,113,113,0.28)]",
} as const;

export type ToneKey = keyof typeof TONE;

/** Chart fills — luminous enough on dark surfaces, not neon-harsh. */
export const CHART_TONE = {
  success: "#34d399",
  running: "#5b86ff",
  failed: "#f87171",
  other: "#94a3b8",
  active: "#22d3ee",
  inactive: "#64748b",
  project: "#22d3ee",
  service: "#fb7185",
  frontend: "#60a5fa",
  backend: "#fbbf24",
  database: "#4ade80",
  services: "#a78bfa",
  muted: "#64748b",
} as const;

export const RESOURCE_CHART_COLORS = [
  CHART_TONE.frontend,
  CHART_TONE.backend,
  CHART_TONE.database,
  CHART_TONE.services,
] as const;

/** Icon chip backgrounds (metric / health rows). */
export const ICON_TONE = {
  cyan: "bg-[rgba(34,211,238,0.14)] text-[#67e8f9]",
  blue: "bg-[rgba(91,134,255,0.16)] text-[#b4c8ff]",
  emerald: "bg-[rgba(52,211,153,0.14)] text-[#6ee7b7]",
  violet: "bg-[rgba(167,139,250,0.14)] text-[#c4b5fd]",
  amber: "bg-[rgba(251,191,36,0.14)] text-[#fcd34d]",
  rose: "bg-[rgba(251,113,133,0.14)] text-[#fda4af]",
  orange: "bg-[rgba(251,146,60,0.14)] text-[#fdba74]",
  teal: "bg-[rgba(45,212,191,0.14)] text-[#5eead4]",
  slate: "bg-[rgba(148,163,184,0.12)] text-[#cbd5e1]",
} as const;

export function normalizeKey(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function getProjectTypeTone(type: string | null | undefined): string {
  const key = normalizeKey(type);
  if (key === "project") return TONE.cyan;
  if (key === "service") return TONE.rose;
  return TONE.slate;
}

export function getResourceTypeTone(code: string | null | undefined): string {
  const key = normalizeKey(code);
  if (key === "frontend") return TONE.blue;
  if (key === "backend") return TONE.amber;
  if (key === "database") return TONE.emerald;
  if (key === "services") return TONE.violet;
  return TONE.slate;
}

/** Port number chip — soft border fill matched to resource type. */
export function getPortChipTone(code: string | null | undefined): string {
  const key = normalizeKey(code);
  if (key === "frontend") {
    return "border-[rgba(96,165,250,0.35)] bg-[rgba(96,165,250,0.12)] text-[#93c5fd]";
  }
  if (key === "backend") {
    return "border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.12)] text-[#fcd34d]";
  }
  if (key === "database") {
    return "border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.12)] text-[#86efac]";
  }
  if (key === "services") {
    return "border-[rgba(167,139,250,0.35)] bg-[rgba(167,139,250,0.12)] text-[#c4b5fd]";
  }
  return "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-primary)]";
}

export function getDatabaseEngineTone(code: string | null | undefined): string {
  const key = normalizeKey(code);
  if (key === "postgres" || key === "postgresql") return TONE.sky;
  if (key === "mysql") return TONE.amber;
  if (key === "mongodb") return TONE.emerald;
  if (key === "firebase") return TONE.orange;
  if (key === "supabase") return TONE.teal;
  return TONE.slate;
}

export function getActiveTone(isActive: boolean): string {
  return isActive
    ? `${TONE.emerald} hover:bg-[rgba(52,211,153,0.22)]`
    : `${TONE.slate} hover:bg-[rgba(148,163,184,0.18)]`;
}

export function getActionTone(action: string | null | undefined): string {
  const key = normalizeKey(action);
  if (key === "login") return TONE.blue;
  if (key === "create" || key === "start") return TONE.emerald;
  if (key === "update" || key === "restart") return TONE.amber;
  if (
    key === "soft_delete" ||
    key === "hard_delete" ||
    key === "delete" ||
    key === "stop"
  ) {
    return TONE.red;
  }
  return TONE.indigo;
}

export function getRoleTone(role: string | null | undefined): string {
  const key = normalizeKey(role);
  if (key === "owner") return TONE.violet;
  if (key === "admin") return TONE.brand;
  if (key === "staff") return TONE.slate;
  return TONE.slate;
}

export function getStatusTone(status: string | null | undefined): string {
  const key = normalizeKey(status);
  if (
    key === "active" ||
    key === "ok" ||
    key === "running" ||
    key === "success"
  ) {
    return TONE.emerald;
  }
  if (key === "stopped" || key === "off") {
    return TONE.slate;
  }
  if (
    key === "expired" ||
    key === "fail" ||
    key === "failed" ||
    key === "error"
  ) {
    return TONE.red;
  }
  if (
    key === "pending" ||
    key === "processing" ||
    key === "starting" ||
    key === "stopping" ||
    key === "restarting"
  ) {
    return TONE.blue;
  }
  if (key === "unstable") return TONE.amber;
  if (
    key === "aborted" ||
    key === "disabled" ||
    key === "not_built" ||
    key === "unknown"
  ) {
    return TONE.slate;
  }
  return TONE.indigo;
}

export function getDnsTypeTone(type: string | null | undefined): string {
  const key = String(type || "").trim().toUpperCase();
  if (key === "A") return TONE.blue;
  if (key === "AAAA") return TONE.violet;
  if (key === "CNAME") return TONE.teal;
  if (key === "MX") return TONE.amber;
  if (key === "TXT") return TONE.slate;
  if (key === "NS") return TONE.rose;
  return TONE.slate;
}

export function getJenkinsStatusTone(
  status: string | null | undefined
): string {
  const key = normalizeKey(status);
  switch (key) {
    case "success":
      return TONE.emerald;
    case "failed":
      return TONE.red;
    case "unstable":
      return TONE.amber;
    case "running":
      return TONE.blue;
    case "aborted":
    case "disabled":
    case "not_built":
      return TONE.slate;
    default:
      return TONE.slate;
  }
}
