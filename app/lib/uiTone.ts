/**
 * Soft status tones for the white + navy admin theme.
 */

export const TONE = {
  brand:
    "bg-[rgba(11,31,58,0.08)] text-[#0b1f3a] ring-1 ring-[rgba(11,31,58,0.16)]",
  navy:
    "bg-[rgba(30,58,95,0.1)] text-[#1e3a5f] ring-1 ring-[rgba(30,58,95,0.2)]",
  emerald:
    "bg-[rgba(31,122,77,0.1)] text-[#1f7a4d] ring-1 ring-[rgba(31,122,77,0.22)]",
  amber:
    "bg-[rgba(180,120,20,0.1)] text-[#8a5a00] ring-1 ring-[rgba(180,120,20,0.22)]",
  red:
    "bg-[rgba(192,57,43,0.1)] text-[#c0392b] ring-1 ring-[rgba(192,57,43,0.22)]",
  slate:
    "bg-[rgba(74,93,120,0.1)] text-[#4a5d78] ring-1 ring-[rgba(74,93,120,0.18)]",
} as const;

export type ToneKey = keyof typeof TONE;

export function normalizeKey(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function getActiveTone(isActive: boolean): string {
  return isActive
    ? `${TONE.emerald} hover:bg-[rgba(31,122,77,0.16)]`
    : `${TONE.slate} hover:bg-[rgba(74,93,120,0.16)]`;
}

export function getActionTone(action: string | null | undefined): string {
  const key = normalizeKey(action);
  if (key === "login") return TONE.navy;
  if (key === "create" || key === "set_active") return TONE.emerald;
  if (key === "update") return TONE.amber;
  if (
    key === "soft_delete" ||
    key === "hard_delete" ||
    key === "delete"
  ) {
    return TONE.red;
  }
  return TONE.brand;
}

export function getRoleTone(role: string | null | undefined): string {
  const key = normalizeKey(role);
  if (key === "owner") return TONE.brand;
  if (key === "admin") return TONE.navy;
  if (key === "staff") return TONE.slate;
  return TONE.slate;
}

export function getStatusTone(status: string | null | undefined): string {
  const key = normalizeKey(status);
  if (key === "active" || key === "ok" || key === "success") return TONE.emerald;
  if (key === "inactive" || key === "off") return TONE.slate;
  if (key === "fail" || key === "failed" || key === "error") return TONE.red;
  if (key === "pending" || key === "processing") return TONE.amber;
  return TONE.navy;
}
