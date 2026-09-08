"use client";

import { useMemo } from "react";
import {
  getActiveTone,
  getProjectTypeTone,
  getResourceTypeTone,
} from "@/app/lib/uiTone";
import { type ProjectItem } from "@/app/services/project/projectAPI";
import DataTable, { type TableColumn } from "@/app/ui/table";
import TableIconActions from "@/app/ui/tableIconActions";

type ProjectTableProps = {
  projects: ProjectItem[];
  loading?: boolean;
  togglingId?: number | null;
  onEdit?: (project: ProjectItem) => void;
  onDelete?: (project: ProjectItem) => void;
  onToggleActive?: (project: ProjectItem) => void;
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

export default function ProjectTable({
  projects,
  loading = false,
  togglingId = null,
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
        render: (_project, index) => index + 1,
      },
      {
        key: "name",
        title: "Name",
        render: (project) => (
          <span className="font-semibold text-[var(--text-primary)]">
            {project.name}
          </span>
        ),
      },
      {
        key: "type",
        title: "Type",
        render: (project) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${getProjectTypeTone(project.type)}`}
          >
            {getProjectTypeLabel(project.type)}
          </span>
        ),
      },
      {
        key: "resource_type",
        title: "Resource Type",
        render: (project) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${getResourceTypeTone(project.resource_type_code)}`}
          >
            {project.resource_type_name || "-"}
          </span>
        ),
      },
      {
        key: "is_active",
        title: "Status",
        render: (project) => {
          const label = project.is_active ? "Active" : "Inactive";
          const tone = getActiveTone(project.is_active);
          if (!canToggle) {
            return (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${tone}`}
              >
                {label}
              </span>
            );
          }
          const busy = togglingId === project.id;
          return (
            <button
              type="button"
              disabled={busy}
              onClick={() => onToggleActive?.(project)}
              title={project.is_active ? "Deactivate" : "Activate"}
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
        render: (project) => formatDateTime(project.created_at),
      },
    ];

    if (canEdit || canDelete) {
      cols.push({
        key: "actions",
        title: "Actions",
        headerClassName: "text-right",
        cellClassName: "text-right",
        render: (project) => (
          <TableIconActions
            editLabel={`Edit ${project.name}`}
            deleteLabel={`Delete ${project.name}`}
            showEdit={canEdit}
            showDelete={canDelete}
            onEdit={() => onEdit?.(project)}
            onDelete={() => onDelete?.(project)}
          />
        ),
      });
    }

    return cols;
  }, [canDelete, canEdit, canToggle, onDelete, onEdit, onToggleActive, togglingId]);

  return (
    <DataTable
      columns={columns}
      data={projects}
      loading={loading}
      getRowKey={(project) => project.id}
      emptyText="No projects found"
      loadingText="Loading projects..."
    />
  );
}
