"use client";

import { useEffect, useState } from "react";
import { FiImage, FiInbox } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import { type HomeBannerItem } from "@/app/services/homeBanner/homeBannerAPI";
import Loading from "@/app/components/loading";
import ActiveBadge from "@/app/ui/activeBadge";
import TableIconActions from "@/app/ui/tableIconActions";
import { TONE } from "@/app/lib/uiTone";
import {
  ImagePreviewGallery,
  ImagePreviewItem,
} from "@/app/components/ImagePreview";

type HomeBannerTableProps = {
  items: HomeBannerItem[];
  loading?: boolean;
  canReorder?: boolean;
  onEdit?: (item: HomeBannerItem) => void;
  onDelete?: (item: HomeBannerItem) => void;
  onReorder?: (orderedItems: HomeBannerItem[]) => void;
  onToggleActive?: (item: HomeBannerItem) => void;
};

export default function HomeBannerTable({
  items,
  loading = false,
  canReorder = false,
  onEdit,
  onDelete,
  onReorder,
  onToggleActive,
}: HomeBannerTableProps) {
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";
  const canToggle = typeof onToggleActive === "function";
  const reorderEnabled =
    canReorder && typeof onReorder === "function" && items.length > 1;

  const [localItems, setLocalItems] = useState(items);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  if (loading) {
    return (
      <section className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-md">
        <Loading variant="page" message="Loading banners..." />
      </section>
    );
  }

  if (localItems.length === 0) {
    return (
      <section className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-md">
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--text-primary)]">
            <FiInbox className="h-6 w-6" />
          </span>
          <p className="text-[14px] font-medium text-[var(--text-secondary)]">
            No banners found
          </p>
        </div>
      </section>
    );
  }

  const moveItem = (fromId: number, toId: number) => {
    if (fromId === toId) return localItems;
    const fromIndex = localItems.findIndex(
      (item) => Number(item.id) === fromId
    );
    const toIndex = localItems.findIndex((item) => Number(item.id) === toId);
    if (fromIndex < 0 || toIndex < 0) return localItems;

    const next = [...localItems];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  };

  const isReorderActive = draggingId != null;

  return (
    <ImagePreviewGallery>
      <ul
        className={`space-y-3 ${isReorderActive ? "select-none" : ""}`}
        aria-dropeffect={isReorderActive ? "move" : undefined}
      >
        {localItems.map((item) => {
          const isVideo = String(item.media_type).toLowerCase() === "video";
          const isDragging = Number(draggingId) === Number(item.id);
          const isDragOver =
            Number(dragOverId) === Number(item.id) &&
            Number(draggingId) !== Number(item.id);

          return (
            <li
              key={item.id}
              onDragOver={(event) => {
                if (!reorderEnabled || draggingId == null) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverId(Number(item.id));
              }}
              onDrop={(event) => {
                if (!reorderEnabled || draggingId == null) return;
                event.preventDefault();
                const next = moveItem(Number(draggingId), Number(item.id));
                setDraggingId(null);
                setDragOverId(null);
                const changed = next.some(
                  (entry, index) =>
                    Number(entry.id) !== Number(localItems[index]?.id)
                );
                if (!changed) return;
                setLocalItems(next);
                onReorder?.(next);
              }}
              aria-grabbed={isDragging || undefined}
              className={`relative flex flex-col gap-4 rounded-[20px] border bg-[var(--surface)] py-4 pl-4 pr-5 shadow-md transition duration-200 sm:flex-row sm:items-center sm:gap-7 sm:pl-5 sm:pr-7 ${
                isDragging
                  ? "z-10 scale-[0.985] border-2 border-dashed border-[var(--brand-primary)] bg-[var(--brand-soft)]/35 opacity-75 shadow-none"
                  : isDragOver
                    ? "z-[5] border-2 border-[var(--brand-primary)] bg-[var(--brand-soft)]/60 shadow-md ring-2 ring-[var(--brand-primary)]/30"
                    : isReorderActive
                      ? "border-[var(--border)] opacity-50"
                      : "border-[var(--border)]"
              }`}
            >
              {isDragging ? (
                <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg bg-[var(--brand-primary)] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white shadow-sm">
                  Moving
                </span>
              ) : null}

              {isDragOver ? (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-2 left-0 z-10 w-1.5 rounded-r-full bg-[var(--brand-primary)]"
                  />
                  <span className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-lg bg-[var(--brand-primary)] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm">
                    Drop here to reorder
                  </span>
                </>
              ) : null}

              {reorderEnabled ? (
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    setDraggingId(Number(item.id));
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(item.id));
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  aria-label={`Reorder ${item.name}`}
                  title="Drag to reorder"
                  className={`inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center self-start rounded-lg transition active:cursor-grabbing sm:self-center ${
                    isDragging
                      ? "bg-[var(--brand-primary)] text-white"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <MdDragIndicator className="h-5 w-5" />
                </button>
              ) : null}

              <div className="flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] sm:mr-1 sm:h-16 sm:w-28">
                {isVideo ? (
                  <video
                    src={item.url}
                    muted
                    playsInline
                    className="h-full w-full object-contain"
                  />
                ) : item.url ? (
                  <ImagePreviewItem
                    src={item.url}
                    alt={item.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                    <FiImage className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 sm:pl-3">
                <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">
                  {item.name}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:ml-auto sm:shrink-0 sm:gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex h-9 items-center rounded-full px-3 text-[12px] font-semibold capitalize ${
                      isVideo ? TONE.navy : TONE.brand
                    }`}
                  >
                    {item.media_type}
                  </span>
                  <ActiveBadge
                    isActive={Boolean(item.is_active)}
                    onToggle={
                      canToggle ? () => onToggleActive?.(item) : undefined
                    }
                  />
                </div>
                {canEdit || canDelete ? (
                  <>
                    <span
                      aria-hidden
                      className="hidden h-6 w-px bg-[var(--border)] sm:block"
                    />
                    <TableIconActions
                      editLabel={`Edit ${item.name}`}
                      deleteLabel={`Delete ${item.name}`}
                      showEdit={canEdit}
                      showDelete={canDelete}
                      onEdit={() => onEdit?.(item)}
                      onDelete={() => onDelete?.(item)}
                    />
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </ImagePreviewGallery>
  );
}
