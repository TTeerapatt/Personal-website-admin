"use client";

import { useMemo } from "react";
import { getActiveTone } from "@/app/lib/uiTone";
import { type ProjectItem } from "@/app/services/project/projectAPI";
import DataTable, { type TableColumn } from "@/app/ui/table";
import TableIconActions from "@/app/ui/tableIconActions";

type ProjectTableProps = {
  items: ProjectItem[];
  loading?: boolean;
  onEdit?: (item: ProjectItem) => void;
  onDelete?: (item: ProjectItem) => void;
  onToggleActive?: (item: ProjectItem) => void;
};

export default function ProjectTable({
  items,
  loading = false,
  onEdit,
  onDelete,
  onToggleActive,
}: ProjectTableProps) {
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";
  const canToggle = typeof onToggleActive === "function";

  const columns = useMemo<TableColumn<ProjectItem>[]>(() => {
    const cols: TableColumn<ProjectItem>[] = [
      {
        key: "index",
        title: "No.",
        cellClassName: "font-medium text-[var(--text-secondary)]",
        render: (_item, index) => index + 1,
      },
      {
        key: "name_en",
        title: "Name (EN)",
        render: (item) => (
          <span className="font-semibold text-[var(--text-primary)]">
            {item.name_en}
          </span>
        ),
      },
      {
        key: "name_th",
        title: "Name (TH)",
        render: (item) => item.name_th,
      },
      {
        key: "display_order",
        title: "Order",
        render: (item) => item.display_order,
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
      emptyText="No projects found"
      loadingText="Loading projects..."
    />
  );
}
