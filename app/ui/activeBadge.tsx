"use client";

import { getActiveTone } from "@/app/lib/uiTone";

type ActiveBadgeProps = {
  isActive: boolean;
  onToggle?: () => void;
  className?: string;
};

/** Shared Active / Inactive status pill used across admin lists. */
export default function ActiveBadge({
  isActive,
  onToggle,
  className = "",
}: ActiveBadgeProps) {
  const canToggle = typeof onToggle === "function";

  return (
    <button
      type="button"
      disabled={!canToggle}
      onClick={onToggle}
      className={`inline-flex h-9 shrink-0 items-center rounded-full px-3 text-[12px] font-semibold transition ${getActiveTone(isActive)} ${canToggle ? "cursor-pointer" : "cursor-default"} ${className}`.trim()}
    >
      {isActive ? "Active" : "Inactive"}
    </button>
  );
}
