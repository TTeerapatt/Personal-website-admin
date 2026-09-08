"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import homeBannerAPI, {
  type HomeBannerItem,
} from "@/app/services/homeBanner/homeBannerAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { useTabPermission } from "@/app/hooks/useTabPermission";
import HomeBannerFormModal from "./homeBannerAction/homeBannerFormModal";
import HomeBannerFilter from "./homeBannerFilter";
import HomeBannerTable from "./homeBannerTable";

type ListApiResult =
  | {
      success?: boolean;
      data?: HomeBannerItem[];
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

export default function HomeBannerMain() {
  const { withLoading } = useLoading();
  const { canAdd, canEdit, canDelete } = useTabPermission("home-banners");
  const [items, setItems] = useState<HomeBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await homeBannerAPI.getHomeBannerAll()) as ListApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Error",
          result?.errMessage || result?.message || "Unable to fetch banners"
        );
        setItems([]);
        return;
      }

      setItems(Array.isArray(result.data) ? result.data : []);
    } catch {
      await popup.error("Error", "Unable to fetch banners");
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
      const url = String(item.url || "").toLowerCase();
      const matchesSearch = name.includes(keyword) || url.includes(keyword);

      return matchesActive && matchesSearch;
    });
  }, [items, isActive, search]);

  const handleToggleActive = async (item: HomeBannerItem) => {
    let updated = false;
    await withLoading(async () => {
      const result = (await homeBannerAPI.patchHomeBannerIsActive(
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

  const handleDelete = async (item: HomeBannerItem) => {
    const confirmed = await popup.confirmDelete({
      title: "Delete this banner?",
      text: `Delete ${item.name}?`,
    });
    if (!confirmed) return;

    let deleted = false;
    await withLoading(async () => {
      const result = (await homeBannerAPI.softDeleteHomeBanner(item.id)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Delete failed",
          result?.errMessage || result?.message || "Unable to delete banner"
        );
        return;
      }
      deleted = true;
    }, "Deleting banner...");

    if (!deleted) return;
    void fetchItems();
    await popup.success("Deleted successfully", "Banner deleted successfully");
  };

  return (
    <div className="space-y-5">
      <HomeBannerFilter
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

      <HomeBannerTable
        items={filteredItems}
        loading={loading}
        onEdit={canEdit ? (item) => setEditingId(item.id) : undefined}
        onDelete={canDelete ? (item) => void handleDelete(item) : undefined}
        onToggleActive={canEdit ? (item) => void handleToggleActive(item) : undefined}
      />

      {canAdd ? (
        <HomeBannerFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            void fetchItems();
          }}
        />
      ) : null}

      {canEdit ? (
        <HomeBannerFormModal
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
