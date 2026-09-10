"use client";

import { useEffect, useRef, useState } from "react";
import { FiImage, FiInbox } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import { type SkillItem } from "@/app/services/skill/skillAPI";
import Loading from "@/app/components/loading";
import ActiveBadge from "@/app/ui/activeBadge";
import TableIconActions from "@/app/ui/tableIconActions";
import {
  ImagePreviewGallery,
  ImagePreviewItem,
} from "@/app/components/ImagePreview";

type SkillTableProps = {
  items: SkillItem[];
  loading?: boolean;
  canReorder?: boolean;
  onEdit?: (item: SkillItem) => void;
  onDelete?: (item: SkillItem) => void;
  onReorder?: (orderedItems: SkillItem[]) => void;
  onToggleActive?: (item: SkillItem) => void;
};

export default function SkillTable({
  items,
  loading = false,
  canReorder = false,
  onEdit,
  onDelete,
  onReorder,
  onToggleActive,
}: SkillTableProps) {
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";
  const canToggle = typeof onToggleActive === "function";
  const reorderEnabled =
    canReorder && typeof onReorder === "function" && items.length > 1;

  const [localItems, setLocalItems] = useState(items);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const draggingIdRef = useRef<number | null>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  if (loading) {
    return (
      <section className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-md">
        <Loading variant="page" message="Loading skills..." />
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
            No skills found
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

  return (
    <ImagePreviewGallery>
      <ul className="space-y-3">
        {localItems.map((item) => {
          const isDragging = Number(draggingId) === Number(item.id);
          const isDragOver =
            Number(dragOverId) === Number(item.id) &&
            Number(draggingId) !== Number(item.id);

          return (
            <li
              key={item.id}
              onDragOver={(event) => {
                if (!reorderEnabled || draggingIdRef.current == null) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverId(Number(item.id));
              }}
              onDrop={(event) => {
                if (!reorderEnabled) return;
                event.preventDefault();
                const fromId = Number(
                  event.dataTransfer.getData("text/plain") ||
                    draggingIdRef.current
                );
                if (!Number.isFinite(fromId) || fromId <= 0) return;
                const next = moveItem(fromId, Number(item.id));
                draggingIdRef.current = null;
                setLocalItems(next);
                setDraggingId(null);
                setDragOverId(null);
                onReorder?.(next);
              }}
              className={`flex flex-col gap-4 rounded-[20px] border bg-[var(--surface)] py-4 pl-4 pr-5 shadow-md transition sm:flex-row sm:items-center sm:gap-7 sm:pl-5 sm:pr-7 ${
                isDragging
                  ? "border-[var(--brand-primary)] opacity-60"
                  : isDragOver
                    ? "border-[var(--brand-primary)] bg-[var(--brand-soft)]/40"
                    : "border-[var(--border)]"
              }`}
            >
              {reorderEnabled ? (
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    const id = Number(item.id);
                    draggingIdRef.current = id;
                    setDraggingId(id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(item.id));
                  }}
                  onDragEnd={() => {
                    draggingIdRef.current = null;
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  aria-label={`Reorder ${item.name}`}
                  title="Drag to reorder"
                  className="inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center self-start text-[var(--text-muted)] transition hover:text-[var(--text-primary)] active:cursor-grabbing sm:self-center"
                >
                  <MdDragIndicator className="h-5 w-5" />
                </button>
              ) : null}

              <div className="flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] sm:mr-1 sm:h-16 sm:w-28">
                {item.url ? (
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
                <ActiveBadge
                  isActive={Boolean(item.is_active)}
                  onToggle={
                    canToggle ? () => onToggleActive?.(item) : undefined
                  }
                />
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
