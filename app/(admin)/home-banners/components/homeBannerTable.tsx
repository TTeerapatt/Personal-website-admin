"use client";

import { useMemo } from "react";
import { getActiveTone } from "@/app/lib/uiTone";
import { type HomeBannerItem } from "@/app/services/homeBanner/homeBannerAPI";
import DataTable, { type TableColumn } from "@/app/ui/table";
import TableIconActions from "@/app/ui/tableIconActions";

type HomeBannerTableProps = {
  items: HomeBannerItem[];
  loading?: boolean;
  onEdit?: (item: HomeBannerItem) => void;
  onDelete?: (item: HomeBannerItem) => void;
  onToggleActive?: (item: HomeBannerItem) => void;
};

export default function HomeBannerTable({
  items,
  loading = false,
  onEdit,
  onDelete,
  onToggleActive,
}: HomeBannerTableProps) {
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";
  const canToggle = typeof onToggleActive === "function";

  const columns = useMemo<TableColumn<HomeBannerItem>[]>(() => {
    const cols: TableColumn<HomeBannerItem>[] = [
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
        key: "media_type",
        title: "Media",
        render: (item) => item.media_type,
      },
      {
        key: "url",
        title: "URL",
        render: (item) => (
          <span className="max-w-[240px] truncate block" title={item.url}>
            {item.url}
          </span>
        ),
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
      emptyText="No banners found"
      loadingText="Loading banners..."
    />
  );
}
