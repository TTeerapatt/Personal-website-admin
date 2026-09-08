"use client";

import { FiChevronDown, FiPlus, FiSearch, FiXCircle } from "react-icons/fi";
import FilterPanel, {
  FilterField,
  filterInputClass,
  filterSelectClass,
} from "@/app/ui/filterPanel";

type AdminFilterProps = {
  search: string;
  role: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onClear: () => void;
  onAdd?: () => void;
};

const ROLE_OPTIONS = [
  { value: "", label: "All" },
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
];

export default function AdminFilter({
  search,
  role,
  onSearchChange,
  onRoleChange,
  onClear,
  onAdd,
}: AdminFilterProps) {
  return (
    <FilterPanel>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterField label="Search" htmlFor="admin-search" className="w-full sm:w-[280px]">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="admin-search"
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by name or email"
                className={`${filterInputClass} pl-10`}
              />
            </div>
          </FilterField>

          <FilterField label="Role" htmlFor="admin-role" className="w-full sm:w-[200px]">
            <div className="relative">
              <select
                id="admin-role"
                value={role}
                onChange={(e) => onRoleChange(e.target.value)}
                className={`${filterSelectClass} cursor-pointer hover:border-[var(--brand-primary)]/40`}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            </div>
          </FilterField>

        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[13px] font-semibold text-[var(--text-primary)] shadow-sm transition hover:border-[var(--brand-primary)] hover:bg-[var(--surface)] hover:shadow-md active:scale-[0.98]"
        >
          <FiXCircle className="h-4 w-4" />
          Clear filters
        </button>
        </div>

        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:brightness-110 hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40"
          >
            <FiPlus className="h-4 w-4" />
            Add admin
          </button>
        ) : null}
      </div>
    </FilterPanel>
  );
}
