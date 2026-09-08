"use client";

import { useMemo } from "react";
import { getActiveTone } from "@/app/lib/uiTone";
import { type ExperienceItem } from "@/app/services/experience/experienceAPI";
import DataTable, { type TableColumn } from "@/app/ui/table";
import TableIconActions from "@/app/ui/tableIconActions";

type ExperienceTableProps = {
  items: ExperienceItem[];
  loading?: boolean;
  onEdit?: (item: ExperienceItem) => void;
  onDelete?: (item: ExperienceItem) => void;
  onToggleActive?: (item: ExperienceItem) => void;
};

function toDateLabel(value: string | null): string {
  if (!value) return "Present";
  return String(value).slice(0, 10);
}

export default function ExperienceTable({
  items,
  loading = false,
  onEdit,
  onDelete,
  onToggleActive,
}: ExperienceTableProps) {
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";
  const canToggle = typeof onToggleActive === "function";

  const columns = useMemo<TableColumn<ExperienceItem>[]>(() => {
    const cols: TableColumn<ExperienceItem>[] = [
      {
        key: "index",
        title: "No.",
        cellClassName: "font-medium text-[var(--text-secondary)]",
        render: (_item, index) => index + 1,
      },
      {
        key: "name_en",
        title: "Organization",
        render: (item) => (
          <div>
            <span className="font-semibold text-[var(--text-primary)]">
              {item.name_en}
            </span>
            <p className="text-[12px] text-[var(--text-muted)]">{item.name_th}</p>
          </div>
        ),
      },
      {
        key: "position",
        title: "Position",
        render: (item) => item.position,
      },
      {
        key: "dates",
        title: "Period",
        render: (item) =>
          `${toDateLabel(item.start_date)} → ${toDateLabel(item.end_date)}`,
      },
      {
        key: "is_active",
        title: "Status",
        render: (item) => (
          <button
            type="button"
            disabled={!canToggle}
            onClick={() => onToggleActive?.(item)}
            className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold transition ${getActiveTone(item.is_active)} ${canToggle ? "cursor-pointer" : "cursor-default"}`}
          >
            {item.is_active ? "Active" : "Inactive"}
          </button>
        ),
      },
    ];

    if (canEdit || canDelete) {
      cols.push({
        key: "actions",
        title: "Actions",
        headerClassName: "text-right",
        cellClassName: "text-right",
        render: (item) => (
          <TableIconActions
            editLabel={`Edit ${item.name_en}`}
            deleteLabel={`Delete ${item.name_en}`}
            showEdit={canEdit}
            showDelete={canDelete}
            onEdit={() => onEdit?.(item)}
            onDelete={() => onDelete?.(item)}
          />
        ),
      });
    }

    return cols;
  }, [canDelete, canEdit, canToggle, onDelete, onEdit, onToggleActive]);

  return (
    <DataTable
      columns={columns}
      data={items}
      loading={loading}
      getRowKey={(item) => item.id}
      emptyText="No experiences found"
      loadingText="Loading experiences..."
    />
  );
}
