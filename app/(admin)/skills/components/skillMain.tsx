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

      setItems(Array.isArray(result.data) ? result.data : []);
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
      const category = String(item.category || "").toLowerCase();
      const matchesSearch =
        name.includes(keyword) || category.includes(keyword);

      return matchesActive && matchesSearch;
    });
  }, [items, isActive, search]);

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
        onEdit={canEdit ? (item) => setEditingId(item.id) : undefined}
        onDelete={canDelete ? (item) => void handleDelete(item) : undefined}
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
