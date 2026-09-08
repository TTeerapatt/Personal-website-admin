"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import educationAPI, {
  type EducationItem,
} from "@/app/services/education/educationAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { useTabPermission } from "@/app/hooks/useTabPermission";
import EducationFormModal from "./educationAction/educationFormModal";
import EducationFilter from "./educationFilter";
import EducationTable from "./educationTable";

type ListApiResult =
  | {
      success?: boolean;
      data?: EducationItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

export default function EducationMain() {
  const { withLoading } = useLoading();
  const { canAdd, canEdit, canDelete } = useTabPermission("education");
  const [items, setItems] = useState<EducationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await educationAPI.getEducationAll()) as ListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Error",
          result?.errMessage || result?.message || "Unable to fetch education"
        );
        setItems([]);
        return;
      }

      setItems(Array.isArray(result.data) ? result.data : []);
    } catch {
      await popup.error("Error", "Unable to fetch education");
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

  const handleToggleActive = async (item: EducationItem) => {
    let updated = false;
    await withLoading(async () => {
      const result = (await educationAPI.patchEducationIsActive(
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

  const handleDelete = async (item: EducationItem) => {
    const confirmed = await popup.confirmDelete({
      title: "Delete this education?",
      text: `Delete ${item.name_en}?`,
    });
    if (!confirmed) return;

    let deleted = false;
    await withLoading(async () => {
      const result = (await educationAPI.softDeleteEducation(item.id)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Delete failed",
          result?.errMessage || result?.message || "Unable to delete education"
        );
        return;
      }
      deleted = true;
    }, "Deleting education...");

    if (!deleted) return;
    void fetchItems();
    await popup.success(
      "Deleted successfully",
      "Education deleted successfully"
    );
  };

  return (
    <div className="space-y-5">
      <EducationFilter
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

      <EducationTable
        items={filteredItems}
        loading={loading}
        onEdit={canEdit ? (item) => setEditingId(item.id) : undefined}
        onDelete={canDelete ? (item) => void handleDelete(item) : undefined}
        onToggleActive={
          canEdit ? (item) => void handleToggleActive(item) : undefined
        }
      />

      {canAdd ? (
        <EducationFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            void fetchItems();
          }}
        />
      ) : null}

      {canEdit ? (
        <EducationFormModal
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
