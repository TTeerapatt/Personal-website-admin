"use client";

import { useMemo } from "react";
import { getActiveTone } from "@/app/lib/uiTone";
import { type SkillItem } from "@/app/services/skill/skillAPI";
import DataTable, { type TableColumn } from "@/app/ui/table";
import TableIconActions from "@/app/ui/tableIconActions";

type SkillTableProps = {
  items: SkillItem[];
  loading?: boolean;
  onEdit?: (item: SkillItem) => void;
  onDelete?: (item: SkillItem) => void;
  onToggleActive?: (item: SkillItem) => void;
};

export default function SkillTable({
  items,
  loading = false,
  onEdit,
  onDelete,
  onToggleActive,
}: SkillTableProps) {
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";
  const canToggle = typeof onToggleActive === "function";

  const columns = useMemo<TableColumn<SkillItem>[]>(() => {
    const cols: TableColumn<SkillItem>[] = [
      {
        key: "index",
        title: "No.",
        cellClassName: "font-medium text-[var(--text-secondary)]",
        render: (_item, index) => index + 1,
      },
      {
        key: "name",
        title: "Name",
        render: (item) => (
          <span className="font-semibold text-[var(--text-primary)]">
            {item.name}
          </span>
        ),
      },
      {
        key: "category",
        title: "Category",
        render: (item) => item.category,
      },
      {
        key: "media_type",
        title: "Media",
        render: (item) => item.media_type,
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
            editLabel={`Edit ${item.name}`}
            deleteLabel={`Delete ${item.name}`}
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
      emptyText="No skills found"
      loadingText="Loading skills..."
    />
  );
}
