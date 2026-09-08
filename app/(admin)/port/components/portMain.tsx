"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import portAPI, { type PortItem } from "@/app/services/port/portAPI";
import projectAPI, { type ProjectItem } from "@/app/services/project/projectAPI";
import resourceTypeAPI, {
  type ResourceTypeItem,
} from "@/app/services/resourceType/resourceTypeAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { useTabPermission } from "@/app/hooks/useTabPermission";
import PortFilter from "./portFilter";
import PortTable from "./portTable";
import PortFormModal from "./portAction/portFormModal";

type PortListApiResult =
  | {
      success?: boolean;
      data?: PortItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

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

export default function PortMain() {
  const { withLoading } = useLoading();
  const { canAdd, canEdit, canDelete } = useTabPermission("port");
  const [ports, setPorts] = useState<PortItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceTypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [projectType, setProjectType] = useState("");
  const [resourceTypeId, setResourceTypeId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<PortItem | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchPorts = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await portAPI.getPortAll()) as PortListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        const message =
          result?.errMessage ||
          result?.message ||
          "Unable to fetch Ports";
        await popup.error("Error", message);
        setPorts([]);
        return;
      }

      setPorts(Array.isArray(result.data) ? result.data : []);
    } catch {
      await popup.error("Error", "Unable to fetch Ports");
      setPorts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const result = (await projectAPI.getProjectAll()) as ProjectListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        setProjects([]);
        return;
      }

      setProjects(Array.isArray(result.data) ? result.data : []);
    } catch {
      setProjects([]);
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
    void fetchPorts();
    void fetchProjects();
    void fetchResourceTypes();
  }, [fetchPorts, fetchProjects, fetchResourceTypes]);

  const filteredPorts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const statusFilter = status.trim().toLowerCase();
    const kindFilter = projectType.trim().toLowerCase();
    const typeFilter = resourceTypeId.trim();

    return ports.filter((port) => {
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && port.is_active) ||
        (statusFilter === "inactive" && !port.is_active);

      const matchesKind =
        !kindFilter ||
        String(port.project_type || "").trim().toLowerCase() === kindFilter;

      const matchesType =
        !typeFilter || String(port.resource_type_id) === typeFilter;

      if (!keyword) return matchesStatus && matchesKind && matchesType;

      const projectName = String(port.project_name || "").toLowerCase();
      const description = String(port.description || "").toLowerCase();
      const typeName = String(port.resource_type_name || "").toLowerCase();
      const kind = String(port.project_type || "").toLowerCase();
      const portNumber = String(port.port_number);
      const matchesSearch =
        projectName.includes(keyword) ||
        description.includes(keyword) ||
        typeName.includes(keyword) ||
        kind.includes(keyword) ||
        portNumber.includes(keyword);

      return matchesStatus && matchesKind && matchesType && matchesSearch;
    });
  }, [ports, projectType, resourceTypeId, search, status]);

  const handleClearFilter = () => {
    setSearch("");
    setStatus("");
    setProjectType("");
    setResourceTypeId("");
  };

  const handleToggleActive = async (port: PortItem) => {
    const nextActive = !port.is_active;
    setTogglingId(port.id);

    try {
      const result = (await portAPI.patchPortIsActive(port.id, nextActive)) as {
        success?: boolean;
        status?: string;
        data?: PortItem;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Status update failed",
          result?.errMessage ||
            result?.message ||
            "Unable to update Port status"
        );
        return;
      }

      const updated = result.data;
      setPorts((prev) =>
        prev.map((item) =>
          item.id === port.id
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

  const handleDeletePort = async (port: PortItem) => {
    const confirmed = await popup.confirmDelete({
      title: "Delete this Port?",
      text: `Delete port ${port.port_number} (${port.project_name})?`,
    });
    if (!confirmed) return;

    let deleted = false;

    await withLoading(async () => {
      const result = (await portAPI.softDeletePort(port.id)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Delete failed",
          result?.errMessage || result?.message || "Unable to delete Port"
        );
        return;
      }

      deleted = true;
    }, "Deleting Port...");

    if (!deleted) return;

    void fetchPorts();
    await popup.success("Deleted successfully", "Port deleted successfully");
  };

  const usedPairs = useMemo(
    () =>
      ports.map((item) => ({
        project_id: Number(item.project_id),
        resource_type_id: Number(item.resource_type_id),
        port_number: Number(item.port_number),
      })),
    [ports]
  );

  return (
    <div className="space-y-5">
      <PortFilter
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

      <PortTable
        ports={filteredPorts}
        loading={loading}
        togglingId={togglingId}
        onEdit={canEdit ? setEditingPort : undefined}
        onDelete={
          canDelete ? (port) => void handleDeletePort(port) : undefined
        }
        onToggleActive={
          canEdit ? (port) => void handleToggleActive(port) : undefined
        }
      />

      {canAdd ? (
        <PortFormModal
          open={createOpen}
          projects={projects}
          resourceTypes={resourceTypes}
          usedPairs={usedPairs}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            void fetchPorts();
          }}
        />
      ) : null}

      {canEdit ? (
        <PortFormModal
          open={editingPort != null}
          port={editingPort}
          projects={projects}
          resourceTypes={resourceTypes}
          usedPairs={usedPairs}
          onClose={() => setEditingPort(null)}
          onSaved={() => {
            void fetchPorts();
          }}
        />
      ) : null}
    </div>
  );
}
