"use client";

import { useMemo } from "react";
import { getRoleTone } from "@/app/lib/uiTone";
import { type AdminItem } from "@/app/services/admin/adminAPI";
import DataTable, { type TableColumn } from "@/app/ui/table";
import TableIconActions from "@/app/ui/tableIconActions";

type AdminTableProps = {
  admins: AdminItem[];
  loading?: boolean;
  onEdit?: (admin: AdminItem) => void;
  onDelete?: (admin: AdminItem) => void;
};

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function getRoleLabel(role: string): string {
  const key = String(role || "").trim().toLowerCase();
  if (key === "owner") return "Owner";
  if (key === "admin") return "Admin";
  if (key === "staff") return "Staff";
  return role || "-";
}

export default function AdminTable({
  admins,
  loading = false,
  onEdit,
  onDelete,
}: AdminTableProps) {
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";

  const columns = useMemo<TableColumn<AdminItem>[]>(() => {
    const cols: TableColumn<AdminItem>[] = [
      {
        key: "index",
        title: "No.",
        cellClassName: "font-medium text-[var(--text-secondary)]",
        render: (_admin, index) => index + 1,
      },
      {
        key: "display_name",
        title: "Name",
        render: (admin) => (
          <span className="font-semibold text-[var(--text-primary)]">
            {admin.display_name}
          </span>
        ),
      },
      {
        key: "email",
        title: "Email",
        render: (admin) => admin.email,
      },
      {
        key: "role",
        title: "Role",
        render: (admin) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${getRoleTone(admin.role)}`}
          >
            {getRoleLabel(admin.role)}
          </span>
        ),
      },
      {
        key: "last_login_at",
        title: "Last login",
        render: (admin) => formatDateTime(admin.last_login_at),
      },
    ];

    if (canEdit || canDelete) {
      cols.push({
        key: "actions",
        title: "Actions",
        headerClassName: "text-right",
        cellClassName: "text-right",
        render: (admin) => (
          <TableIconActions
            editLabel={`Edit ${admin.display_name}`}
            deleteLabel={`Delete ${admin.display_name}`}
            showEdit={canEdit}
            showDelete={canDelete}
            onEdit={() => onEdit?.(admin)}
            onDelete={() => onDelete?.(admin)}
          />
        ),
      });
    }

    return cols;
  }, [canDelete, canEdit, onDelete, onEdit]);

  return (
    <DataTable
      columns={columns}
      data={admins}
      loading={loading}
      getRowKey={(admin) => admin.id}
      emptyText="No admins found"
      loadingText="Loading admins..."
    />
  );
}
