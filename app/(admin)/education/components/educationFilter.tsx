"use client";

import { FiChevronDown, FiPlus, FiSearch, FiXCircle } from "react-icons/fi";
import FilterPanel, {
  FilterField,
  filterInputClass,
  filterSelectClass,
} from "@/app/ui/filterPanel";

type EducationFilterProps = {
  search: string;
  isActive: string;
  onSearchChange: (value: string) => void;
  onIsActiveChange: (value: string) => void;
  onClear: () => void;
  onAdd?: () => void;
};

const ACTIVE_OPTIONS = [
  { value: "", label: "All" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

export default function EducationFilter({
  search,
  isActive,
  onSearchChange,
  onIsActiveChange,
  onClear,
  onAdd,
}: EducationFilterProps) {
  return (
    <FilterPanel>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterField
            label="Search"
            htmlFor="education-search"
            className="w-full sm:w-[280px]"
          >
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="education-search"
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by name (TH / EN)"
                className={`${filterInputClass} pl-10`}
              />
            </div>
          </FilterField>

          <FilterField
            label="Status"
            htmlFor="education-active"
            className="w-full sm:w-[180px]"
          >
            <div className="relative">
              <select
                id="education-active"
                value={isActive}
                onChange={(e) => onIsActiveChange(e.target.value)}
                className={`${filterSelectClass} cursor-pointer hover:border-[var(--brand-primary)]/40`}
              >
                {ACTIVE_OPTIONS.map((option) => (
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
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[13px] font-semibold text-[var(--text-primary)] shadow-sm transition hover:border-[var(--brand-primary)] hover:shadow-md active:scale-[0.98]"
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
            Add education
          </button>
        ) : null}
      </div>
    </FilterPanel>
  );
}
