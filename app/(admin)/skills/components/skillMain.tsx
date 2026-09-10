"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import skillAPI, { type SkillItem } from "@/app/services/skill/skillAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { useTabPermission } from "@/app/hooks/useTabPermission";
import SkillFormModal from "./skillAction/skillFormModal";
import SkillFilter from "./skillFilter";
import SkillTable from "./skillTable";

type ListApiResult =
  | {
      success?: boolean;
      data?: SkillItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

function sortByDisplayOrder(list: SkillItem[]) {
  return [...list].sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return Number(a.id) - Number(b.id);
  });
}

function mergeVisibleOrder(
  allItems: SkillItem[],
  visibleOrdered: SkillItem[]
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

export default function SkillMain() {
  const { withLoading } = useLoading();
  const { canAdd, canEdit, canDelete } = useTabPermission("skills");
  const [items, setItems] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await skillAPI.getSkillAll()) as ListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Error",
          result?.errMessage || result?.message || "Unable to fetch skills"
        );
        setItems([]);
        return;
      }

      setItems(
        sortByDisplayOrder(Array.isArray(result.data) ? result.data : [])
      );
    } catch {
      await popup.error("Error", "Unable to fetch skills");
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

      const name = String(item.name || "").toLowerCase();
      const matchesSearch = name.includes(keyword);

      return matchesActive && matchesSearch;
    });
  }, [items, isActive, search]);

  const handleDelete = async (item: SkillItem) => {
    const confirmed = await popup.confirmDelete({
      title: "Delete this skill?",
      text: `Delete ${item.name}?`,
    });
    if (!confirmed) return;

    let deleted = false;
    await withLoading(async () => {
      const result = (await skillAPI.softDeleteSkill(item.id)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Delete failed",
          result?.errMessage || result?.message || "Unable to delete skill"
        );
        return;
      }
      deleted = true;
    }, "Deleting skill...");

    if (!deleted) return;
    void fetchItems();
    await popup.success("Deleted successfully", "Skill deleted successfully");
  };

  const handleToggleActive = async (item: SkillItem) => {
    let updated = false;
    await withLoading(async () => {
      const result = (await skillAPI.patchSkillIsActive(
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

  const handleReorder = async (visibleOrdered: SkillItem[]) => {
    if (!canEdit) return;

    const previous = items;
    const orderedIds = mergeVisibleOrder(items, visibleOrdered);
    const optimistic = orderedIds
      .map((id, index) => {
        const found = previous.find((item) => Number(item.id) === id);
        return found ? { ...found, display_order: index } : null;
      })
      .filter((item): item is SkillItem => item != null);

    setItems(optimistic);

    let saved = false;
    await withLoading(async () => {
      const result = (await skillAPI.reorderSkills(orderedIds)) as {
        success?: boolean;
        status?: string;
        data?: SkillItem[];
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        setItems(previous);
        await popup.error(
          "Reorder failed",
          result?.errMessage || result?.message || "Unable to reorder skills"
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
      <SkillFilter
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

      <SkillTable
        items={filteredItems}
        loading={loading}
        canReorder={canEdit}
        onEdit={canEdit ? (item) => setEditingId(item.id) : undefined}
        onDelete={canDelete ? (item) => void handleDelete(item) : undefined}
        onReorder={canEdit ? (ordered) => void handleReorder(ordered) : undefined}
        onToggleActive={
          canEdit ? (item) => void handleToggleActive(item) : undefined
        }
      />

      {canAdd ? (
        <SkillFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            void fetchItems();
          }}
        />
      ) : null}

      {canEdit ? (
        <SkillFormModal
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
