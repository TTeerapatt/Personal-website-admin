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
import EducationAccordion from "./educationAccordion";

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

function sortByDisplayOrder(list: EducationItem[]) {
  return [...list].sort((a, b) => {
    const aOrder = Number(a.display_order ?? 0);
    const bOrder = Number(b.display_order ?? 0);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return Number(a.id) - Number(b.id);
  });
}

function mergeVisibleOrder(
  allItems: EducationItem[],
  visibleOrdered: EducationItem[]
): number[] {
  const visibleIds = new Set(visibleOrdered.map((item) => Number(item.id)));
  const queue = visibleOrdered.map((item) => Number(item.id));
  const merged: number[] = [];

  for (const item of sortByDisplayOrder(allItems)) {
    const id = Number(item.id);
    if (visibleIds.has(id)) {
      const next = queue.shift();
      if (typeof next === "number") merged.push(next);
    } else {
      merged.push(id);
    }
  }

  return merged;
}

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

      setItems(
        sortByDisplayOrder(Array.isArray(result.data) ? result.data : [])
      );
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

  const handleReorder = async (visibleOrdered: EducationItem[]) => {
    if (!canEdit) return;

    const previous = items;
    const orderedIds = mergeVisibleOrder(items, visibleOrdered);
    const optimistic = orderedIds
      .map((id, index) => {
        const found = previous.find((item) => Number(item.id) === id);
        return found ? { ...found, display_order: index } : null;
      })
      .filter((item): item is EducationItem => item != null);

    setItems(optimistic);

    let saved = false;
    await withLoading(async () => {
      const result = (await educationAPI.reorderEducation(orderedIds)) as {
        success?: boolean;
        status?: string;
        data?: EducationItem[];
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        setItems(previous);
        await popup.error(
          "Reorder failed",
          result?.errMessage || result?.message || "Unable to reorder education"
        );
        return;
      }

      if (Array.isArray(result.data)) {
        setItems(sortByDisplayOrder(result.data));
      }
      saved = true;
    }, "Updating order...");

    if (saved) {
      await popup.success("Updated", "Display order updated successfully");
    }
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

      <EducationAccordion
        items={filteredItems}
        loading={loading}
        canReorder={canEdit}
        onEdit={canEdit ? (item) => setEditingId(item.id) : undefined}
        onDelete={canDelete ? (item) => void handleDelete(item) : undefined}
        onToggleActive={
          canEdit ? (item) => void handleToggleActive(item) : undefined
        }
        onReorder={canEdit ? (ordered) => void handleReorder(ordered) : undefined}
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
