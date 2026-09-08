"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import projectAPI, { type ProjectItem } from "@/app/services/project/projectAPI";
import resourceTypeAPI, {
  type ResourceTypeItem,
} from "@/app/services/resourceType/resourceTypeAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { useTabPermission } from "@/app/hooks/useTabPermission";
import ProjectFilter from "./projectFilter";
import ProjectTable from "./projectTable";
import ProjectFormModal from "./projectAction/projectFormModal";

type ProjectListApiResult =
  | {
      success?: boolean;
      data?: ProjectItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

type ResourceTypeListApiResult =
  | {
      success?: boolean;
      data?: ResourceTypeItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

export default function ProjectMain() {
  const { withLoading } = useLoading();
  const { canAdd, canEdit, canDelete } = useTabPermission("projects");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [projectType, setProjectType] = useState("");
  const [resourceTypeId, setResourceTypeId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(
    null
  );
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await projectAPI.getProjectAll()) as ProjectListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        const message =
          result?.errMessage ||
          result?.message ||
          "Unable to fetch Projects";
        await popup.error("Error", message);
        setProjects([]);
        return;
      }

      setProjects(Array.isArray(result.data) ? result.data : []);
    } catch {
      await popup.error("Error", "Unable to fetch Projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResourceTypes = useCallback(async () => {
    try {
      const result =
        (await resourceTypeAPI.getResourceTypeAll()) as ResourceTypeListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        setResourceTypes([]);
        return;
      }

      setResourceTypes(Array.isArray(result.data) ? result.data : []);
    } catch {
      setResourceTypes([]);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
    void fetchResourceTypes();
  }, [fetchProjects, fetchResourceTypes]);

  const filteredProjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const statusFilter = status.trim().toLowerCase();
    const kindFilter = projectType.trim().toLowerCase();
    const typeFilter = resourceTypeId.trim();

    return projects.filter((project) => {
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && project.is_active) ||
        (statusFilter === "inactive" && !project.is_active);

      const matchesKind =
        !kindFilter ||
        String(project.type || "").trim().toLowerCase() === kindFilter;

      const matchesType =
        !typeFilter || String(project.resource_type_id) === typeFilter;

      if (!keyword) return matchesStatus && matchesKind && matchesType;

      const name = String(project.name || "").toLowerCase();
      const description = String(project.description || "").toLowerCase();
      const typeName = String(project.resource_type_name || "").toLowerCase();
      const kind = String(project.type || "").toLowerCase();
      const matchesSearch =
        name.includes(keyword) ||
        description.includes(keyword) ||
        typeName.includes(keyword) ||
        kind.includes(keyword);

      return matchesStatus && matchesKind && matchesType && matchesSearch;
    });
  }, [projectType, projects, resourceTypeId, search, status]);

  const handleClearFilter = () => {
    setSearch("");
    setStatus("");
    setProjectType("");
    setResourceTypeId("");
  };

  const handleToggleActive = async (project: ProjectItem) => {
    const nextActive = !project.is_active;
    setTogglingId(project.id);

    try {
      const result = (await projectAPI.patchProjectIsActive(
        project.id,
        nextActive
      )) as {
        success?: boolean;
        status?: string;
        data?: ProjectItem;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Status update failed",
          result?.errMessage ||
            result?.message ||
            "Unable to update Project status"
        );
        return;
      }

      const updated = result.data;
      setProjects((prev) =>
        prev.map((item) =>
          item.id === project.id
            ? updated
              ? updated
              : { ...item, is_active: nextActive }
            : item
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteProject = async (project: ProjectItem) => {
    const confirmed = await popup.confirmDelete({
      title: "Delete this Project?",
      text: `Delete ${project.name}?`,
    });
    if (!confirmed) return;

    let deleted = false;

    await withLoading(async () => {
      const result = (await projectAPI.softDeleteProject(project.id)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Delete failed",
          result?.errMessage || result?.message || "Unable to delete Project"
        );
        return;
      }

      deleted = true;
    }, "Deleting Project...");

    if (!deleted) return;

    void fetchProjects();
    await popup.success("Deleted successfully", "Project deleted successfully");
  };

  return (
    <div className="space-y-5">
      <ProjectFilter
        search={search}
        status={status}
        projectType={projectType}
        resourceTypeId={resourceTypeId}
        resourceTypes={resourceTypes}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onProjectTypeChange={setProjectType}
        onResourceTypeChange={setResourceTypeId}
        onClear={handleClearFilter}
        onAdd={canAdd ? () => setCreateOpen(true) : undefined}
      />

      <ProjectTable
        projects={filteredProjects}
        loading={loading}
        togglingId={togglingId}
        onEdit={canEdit ? setEditingProject : undefined}
        onDelete={
          canDelete ? (project) => void handleDeleteProject(project) : undefined
        }
        onToggleActive={
          canEdit ? (project) => void handleToggleActive(project) : undefined
        }
      />

      {canAdd ? (
        <ProjectFormModal
          open={createOpen}
          resourceTypes={resourceTypes}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            void fetchProjects();
          }}
        />
      ) : null}

      {canEdit ? (
        <ProjectFormModal
          open={editingProject != null}
          project={editingProject}
          resourceTypes={resourceTypes}
          onClose={() => setEditingProject(null)}
          onSaved={() => {
            void fetchProjects();
          }}
        />
      ) : null}
    </div>
  );
}
