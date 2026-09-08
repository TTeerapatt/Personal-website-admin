"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import projectAPI, {
  type ProjectItem,
} from "@/app/services/project/projectAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { useTabPermission } from "@/app/hooks/useTabPermission";
import ProjectFormModal from "./projectAction/projectFormModal";
import ProjectFilter from "./projectFilter";
import ProjectTable from "./projectTable";

type ListApiResult =
  | {
      success?: boolean;
      data?: ProjectItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

export default function ProjectMain() {
  const { withLoading } = useLoading();
  const { canAdd, canEdit, canDelete } = useTabPermission("projects");
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await projectAPI.getProjectAll()) as ListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Error",
          result?.errMessage || result?.message || "Unable to fetch projects"
        );
        setItems([]);
        return;
      }

      setItems(Array.isArray(result.data) ? result.data : []);
    } catch {
      await popup.error("Error", "Unable to fetch projects");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesActive =
        !isActive ||
        (isActive === "true" ? item.is_active : !item.is_active);

      if (!keyword) return matchesActive;

      const nameTh = String(item.name_th || "").toLowerCase();
      const nameEn = String(item.name_en || "").toLowerCase();
      const matchesSearch =
        nameTh.includes(keyword) || nameEn.includes(keyword);

      return matchesActive && matchesSearch;
    });
  }, [items, isActive, search]);

  const handleToggleActive = async (item: ProjectItem) => {
    let updated = false;
    await withLoading(async () => {
      const result = (await projectAPI.patchProjectIsActive(
        item.id,
        !item.is_active
      )) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Update failed",
          result?.errMessage || result?.message || "Unable to update status"
        );
        return;
      }
      updated = true;
    }, "Updating status...");

    if (!updated) return;
    void fetchItems();
    await popup.success("Updated", "Status updated successfully");
  };

  const handleDelete = async (item: ProjectItem) => {
    const confirmed = await popup.confirmDelete({
      title: "Delete this project?",
      text: `Delete ${item.name_en}?`,
    });
    if (!confirmed) return;

    let deleted = false;
    await withLoading(async () => {
      const result = (await projectAPI.softDeleteProject(item.id)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Delete failed",
          result?.errMessage || result?.message || "Unable to delete project"
        );
        return;
      }
      deleted = true;
    }, "Deleting project...");

    if (!deleted) return;
    void fetchItems();
    await popup.success("Deleted successfully", "Project deleted successfully");
  };

  return (
    <div className="space-y-5">
      <ProjectFilter
        search={search}
        isActive={isActive}
        onSearchChange={setSearch}
        onIsActiveChange={setIsActive}
        onClear={() => {
          setSearch("");
          setIsActive("");
        }}
        onAdd={canAdd ? () => setCreateOpen(true) : undefined}
      />

      <ProjectTable
        items={filteredItems}
        loading={loading}
        onEdit={canEdit ? (item) => setEditingId(item.id) : undefined}
        onDelete={canDelete ? (item) => void handleDelete(item) : undefined}
        onToggleActive={
          canEdit ? (item) => void handleToggleActive(item) : undefined
        }
      />

      {canAdd ? (
        <ProjectFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            void fetchItems();
          }}
        />
      ) : null}

      {canEdit ? (
        <ProjectFormModal
          open={editingId != null}
          itemId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            void fetchItems();
          }}
        />
      ) : null}
    </div>
  );
}
