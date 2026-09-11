"use client";

import { useEffect, useRef, useState, useId, type ReactNode } from "react";
import { FiCalendar, FiChevronDown, FiImage, FiInbox } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import Loading from "@/app/components/loading";
import ActiveBadge from "@/app/ui/activeBadge";
import { formatBlogDate, stripHtml } from "@/app/ui/blog";

export type AccordionItemData = {
  id: string | number;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  periodLabel?: string | null;
  isActive?: boolean;
};

type AccordionListProps = {
  items: AccordionItemData[];
  loading?: boolean;
  emptyText?: string;
  loadingText?: string;
  allowMultiple?: boolean;
  defaultOpenId?: string | number | null;
  canReorder?: boolean;
  onReorder?: (orderedItems: AccordionItemData[]) => void;
  onToggleActive?: (item: AccordionItemData) => void;
  renderActions?: (item: AccordionItemData) => ReactNode;
};

function AccordionRow({
  item,
  open,
  onToggle,
  onToggleActive,
  actions,
  reorderEnabled,
  isDragging,
  isDragOver,
  isReorderActive,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  item: AccordionItemData;
  open: boolean;
  onToggle: () => void;
  onToggleActive?: (item: AccordionItemData) => void;
  actions?: ReactNode;
  reorderEnabled: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  isReorderActive: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
}) {
  const panelId = useId();
  const canToggle = typeof onToggleActive === "function";
  const plainDescription = stripHtml(item.description);
  const period = item.periodLabel?.trim() || "";

  return (
    <article
      onDragOver={onDragOver}
      onDrop={onDrop}
      aria-grabbed={isDragging || undefined}
      className={`relative overflow-hidden rounded-[20px] border bg-[var(--surface)] shadow-sm transition duration-200 ${
        isDragging
          ? "z-10 scale-[0.985] border-2 border-dashed border-[var(--brand-primary)] bg-[var(--brand-soft)]/35 opacity-75 shadow-none"
          : isDragOver
            ? "z-[5] border-2 border-[var(--brand-primary)] bg-[var(--brand-soft)]/60 shadow-md ring-2 ring-[var(--brand-primary)]/30"
            : isReorderActive
              ? "border-[var(--border)] opacity-50"
              : open
                ? "border-[var(--brand-primary)]/35 shadow-md"
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

      <div className="flex items-stretch gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
        {reorderEnabled ? (
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              onDragStart();
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", String(item.id));
            }}
            onDragEnd={onDragEnd}
            aria-label={`Reorder ${item.title}`}
            title="Drag to reorder"
            className={`inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center self-center rounded-lg transition active:cursor-grabbing ${
              isDragging
                ? "bg-[var(--brand-primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <MdDragIndicator className="h-5 w-5" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left sm:gap-4"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] sm:h-16 sm:w-16">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <FiImage className="h-5 w-5 text-[var(--text-muted)]" />
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-[var(--text-primary)]">
              {item.title}
            </span>

            {item.subtitle ? (
              <span className="mt-0.5 block truncate text-[13px] text-[var(--text-secondary)]">
                {item.subtitle}
              </span>
            ) : null}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2 self-center">
          {typeof item.isActive === "boolean" ? (
            <ActiveBadge
              isActive={item.isActive}
              onToggle={canToggle ? () => onToggleActive?.(item) : undefined}
            />
          ) : null}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Collapse" : "Expand"}
            className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--text-secondary)] transition duration-200 ${
              open
                ? "rotate-180 bg-[var(--brand-soft)] text-[var(--brand-primary)]"
                : "hover:bg-[var(--surface-soft)]"
            }`}
          >
            <FiChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-3 border-t border-[var(--border)] px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5">
            {period ? (
              <p className="inline-flex items-center gap-1.5 text-[12px] font-medium leading-none text-[var(--text-muted)]">
                <FiCalendar className="block h-3 w-3 shrink-0" aria-hidden />
                <span>{period}</span>
              </p>
            ) : null}

            {plainDescription ? (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {plainDescription}
              </p>
            ) : (
              <p className="text-[13px] italic text-[var(--text-muted)]">
                No description
              </p>
            )}

            {actions ? (
              <div className="flex justify-end border-t border-[var(--border)] pt-3.5">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AccordionList({
  items,
  loading = false,
  emptyText = "No items found",
  loadingText = "Loading...",
  allowMultiple = false,
  defaultOpenId = null,
  canReorder = false,
  onReorder,
  onToggleActive,
  renderActions,
}: AccordionListProps) {
  const [openIds, setOpenIds] = useState<(string | number)[]>(() =>
    defaultOpenId != null ? [defaultOpenId] : []
  );
  const [localItems, setLocalItems] = useState(items);
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  const [dragOverId, setDragOverId] = useState<string | number | null>(null);
  const draggingIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const reorderEnabled =
    canReorder && typeof onReorder === "function" && localItems.length > 1;

  const toggle = (id: string | number) => {
    setOpenIds((prev) => {
      const isOpen = prev.some((value) => String(value) === String(id));
      if (allowMultiple) {
        return isOpen
          ? prev.filter((value) => String(value) !== String(id))
          : [...prev, id];
      }
      return isOpen ? [] : [id];
    });
  };

  const moveItem = (fromId: string | number, toId: string | number) => {
    if (String(fromId) === String(toId)) return localItems;
    const fromIndex = localItems.findIndex(
      (item) => String(item.id) === String(fromId)
    );
    const toIndex = localItems.findIndex(
      (item) => String(item.id) === String(toId)
    );
    if (fromIndex < 0 || toIndex < 0) return localItems;
    const next = [...localItems];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  };

  if (loading) {
    return (
      <section className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-md">
        <Loading variant="page" message={loadingText} />
      </section>
    );
  }

  if (localItems.length === 0) {
    return (
      <section className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-md">
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--text-primary)]">
            <FiInbox className="h-5 w-5" />
          </span>
          <p className="text-[14px] font-medium text-[var(--text-secondary)]">
            {emptyText}
          </p>
        </div>
      </section>
    );
  }

  const isReorderActive = draggingId != null;

  return (
    <div
      className={`space-y-3 ${isReorderActive ? "select-none" : ""}`}
      aria-dropeffect={isReorderActive ? "move" : undefined}
    >
      {localItems.map((item) => {
        const open = openIds.some((id) => String(id) === String(item.id));
        const isDragging = String(draggingId) === String(item.id);
        const isDragOver =
          String(dragOverId) === String(item.id) &&
          String(draggingId) !== String(item.id);

        return (
          <AccordionRow
            key={item.id}
            item={item}
            open={open}
            onToggle={() => toggle(item.id)}
            onToggleActive={onToggleActive}
            actions={renderActions?.(item)}
            reorderEnabled={reorderEnabled}
            isDragging={isDragging}
            isDragOver={isDragOver}
            isReorderActive={isReorderActive}
            onDragStart={() => {
              draggingIdRef.current = item.id;
              setDraggingId(item.id);
            }}
            onDragEnd={() => {
              draggingIdRef.current = null;
              setDraggingId(null);
              setDragOverId(null);
            }}
            onDragOver={(event) => {
              if (!reorderEnabled || draggingIdRef.current == null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDragOverId(item.id);
            }}
            onDrop={(event) => {
              if (!reorderEnabled) return;
              event.preventDefault();
              const fromId =
                event.dataTransfer.getData("text/plain") ||
                draggingIdRef.current;
              draggingIdRef.current = null;
              setDraggingId(null);
              setDragOverId(null);
              if (fromId == null || fromId === "") return;
              const next = moveItem(fromId, item.id);
              const changed = next.some(
                (entry, index) =>
                  String(entry.id) !== String(localItems[index]?.id)
              );
              if (!changed) return;
              setLocalItems(next);
              onReorder?.(next);
            }}
          />
        );
      })}
    </div>
  );
}

export { formatBlogDate as formatAccordionDate };
