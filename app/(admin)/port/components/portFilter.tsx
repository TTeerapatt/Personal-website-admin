"use client";

import { FiChevronDown, FiPlus, FiSearch, FiXCircle } from "react-icons/fi";
import type { ResourceTypeItem } from "@/app/services/resourceType/resourceTypeAPI";
import FilterPanel, {
  FilterField,
  filterInputClass,
  filterSelectClass,
} from "@/app/ui/filterPanel";

type PortFilterProps = {
  search: string;
  status: string;
  projectType: string;
  resourceTypeId: string;
  resourceTypes: ResourceTypeItem[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onProjectTypeChange: (value: string) => void;
  onResourceTypeChange: (value: string) => void;
  onClear: () => void;
  onAdd?: () => void;
};

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PROJECT_TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "project", label: "Project" },
  { value: "service", label: "Service" },
];

export default function PortFilter({
  search,
  status,
  projectType,
  resourceTypeId,
  resourceTypes,
  onSearchChange,
  onStatusChange,
  onProjectTypeChange,
  onResourceTypeChange,
  onClear,
  onAdd,
}: PortFilterProps) {
  return (
    <FilterPanel>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterField
            label="Search"
            htmlFor="port-search"
            className="w-full sm:w-[240px]"
          >
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="port-search"
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by port or project"
                className={`${filterInputClass} pl-10`}
              />
            </div>
          </FilterField>

          <FilterField
            label="Type"
            htmlFor="port-project-type"
            className="w-full sm:w-[160px]"
          >
            <div className="relative">
              <select
                id="port-project-type"
                value={projectType}
                onChange={(e) => onProjectTypeChange(e.target.value)}
                className={`${filterSelectClass} cursor-pointer hover:border-[var(--brand-primary)]/40`}
              >
                {PROJECT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            </div>
          </FilterField>

          <FilterField
            label="Resource Type"
            htmlFor="port-resource-type"
            className="w-full sm:w-[180px]"
          >
            <div className="relative">
              <select
                id="port-resource-type"
                value={resourceTypeId}
                onChange={(e) => onResourceTypeChange(e.target.value)}
                className={`${filterSelectClass} cursor-pointer hover:border-[var(--brand-primary)]/40`}
              >
                <option value="">All</option>
                {resourceTypes.map((type) => (
                  <option key={type.id} value={String(type.id)}>
                    {type.name}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            </div>
          </FilterField>

          <FilterField
            label="Status"
            htmlFor="port-status"
            className="w-full sm:w-[160px]"
          >
            <div className="relative">
              <select
                id="port-status"
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                className={`${filterSelectClass} cursor-pointer hover:border-[var(--brand-primary)]/40`}
              >
                {STATUS_OPTIONS.map((option) => (
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
            Add Port
          </button>
        ) : null}
      </div>
    </FilterPanel>
  );
}
