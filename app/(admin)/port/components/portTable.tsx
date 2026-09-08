"use client";

import { useMemo } from "react";
import { FaNetworkWired } from "react-icons/fa";
import {
  getActiveTone,
  getPortChipTone,
  getProjectTypeTone,
  getResourceTypeTone,
} from "@/app/lib/uiTone";
import { type PortItem } from "@/app/services/port/portAPI";
import DataTable, { type TableColumn } from "@/app/ui/table";
import TableIconActions from "@/app/ui/tableIconActions";

type PortTableProps = {
  ports: PortItem[];
  loading?: boolean;
  togglingId?: number | null;
  onEdit?: (port: PortItem) => void;
  onDelete?: (port: PortItem) => void;
  onToggleActive?: (port: PortItem) => void;
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

function getProjectTypeLabel(type: string): string {
  const key = String(type || "").trim().toLowerCase();
  if (key === "project") return "Project";
  if (key === "service") return "Service";
  return type || "-";
}

function PortNumberBadge({
  portNumber,
  resourceTypeCode,
}: {
  portNumber: number;
  resourceTypeCode: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${getPortChipTone(resourceTypeCode)}`}
      title={`Port ${portNumber}`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
        <FaNetworkWired className="h-4 w-4" />
      </span>
      <span className="font-mono text-[14px] font-bold tabular-nums tracking-wide">
        {portNumber}
      </span>
    </span>
  );
}

export default function PortTable({
  ports,
  loading = false,
  togglingId = null,
  onEdit,
  onDelete,
  onToggleActive,
}: PortTableProps) {
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";
  const canToggle = typeof onToggleActive === "function";

  const columns = useMemo<TableColumn<PortItem>[]>(() => {
    const cols: TableColumn<PortItem>[] = [
      {
        key: "index",
        title: "No.",
        cellClassName: "font-medium text-[var(--text-secondary)]",
        render: (_port, index) => index + 1,
      },
      {
        key: "port_number",
        title: "Port",
        render: (port) => (
          <PortNumberBadge
            portNumber={port.port_number}
            resourceTypeCode={port.resource_type_code}
          />
        ),
      },
      {
        key: "project_name",
        title: "Project",
        render: (port) => (
          <span className="font-semibold text-[var(--text-primary)]">
            {port.project_name}
          </span>
        ),
      },
      {
        key: "project_type",
        title: "Type",
        render: (port) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${getProjectTypeTone(port.project_type)}`}
          >
            {getProjectTypeLabel(port.project_type)}
          </span>
        ),
      },
      {
        key: "resource_type",
        title: "Resource Type",
        render: (port) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${getResourceTypeTone(port.resource_type_code)}`}
          >
            {port.resource_type_name || "-"}
          </span>
        ),
      },
      {
        key: "is_active",
        title: "Status",
        render: (port) => {
          const label = port.is_active ? "Active" : "Inactive";
          const tone = getActiveTone(port.is_active);
          if (!canToggle) {
            return (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${tone}`}
              >
                {label}
              </span>
            );
          }
          const busy = togglingId === port.id;
          return (
            <button
              type="button"
              disabled={busy}
              onClick={() => onToggleActive?.(port)}
              title={port.is_active ? "Deactivate" : "Activate"}
              className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold transition disabled:cursor-wait disabled:opacity-60 ${tone}`}
            >
              {busy ? "..." : label}
            </button>
          );
        },
      },
      {
        key: "created_at",
        title: "Created at",
        render: (port) => formatDateTime(port.created_at),
      },
    ];

    if (canEdit || canDelete) {
      cols.push({
        key: "actions",
        title: "Actions",
        headerClassName: "text-right",
        cellClassName: "text-right",
        render: (port) => (
          <TableIconActions
            editLabel={`Edit port ${port.port_number}`}
            deleteLabel={`Delete port ${port.port_number}`}
            showEdit={canEdit}
            showDelete={canDelete}
            onEdit={() => onEdit?.(port)}
            onDelete={() => onDelete?.(port)}
          />
        ),
      });
    }

    return cols;
  }, [canDelete, canEdit, canToggle, onDelete, onEdit, onToggleActive, togglingId]);

  return (
    <DataTable
      columns={columns}
      data={ports}
      loading={loading}
      getRowKey={(port) => port.id}
      emptyText="No ports found"
      loadingText="Loading ports..."
    />
  );
}
