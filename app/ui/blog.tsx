"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FiCalendar, FiImage, FiInbox } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import Loading from "@/app/components/loading";
import ActiveBadge from "@/app/ui/activeBadge";

export type BlogPost = {
  id: string | number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: string | null;
  isActive?: boolean;
};

type BlogListProps = {
  items: BlogPost[];
  loading?: boolean;
  emptyText?: string;
  loadingText?: string;
  canReorder?: boolean;
  onReorder?: (orderedItems: BlogPost[]) => void;
  onToggleActive?: (item: BlogPost) => void;
  renderActions?: (item: BlogPost) => ReactNode;
};

export function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptText(
  value: string | null | undefined,
  maxLength = 90
): string {
  const plain = stripHtml(value);
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}…`;
}

export function formatBlogDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function BlogCard({
  item,
  onToggleActive,
  actions,
  reorderEnabled = false,
  isDragging = false,
  isDragOver = false,
  isReorderActive = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  item: BlogPost;
  onToggleActive?: (item: BlogPost) => void;
  actions?: ReactNode;
  reorderEnabled?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  isReorderActive?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
}) {
  const canToggle = typeof onToggleActive === "function";
  const description = excerptText(item.description);
  const createdLabel = formatBlogDate(item.createdAt);

  return (
    <article
      onDragOver={onDragOver}
      onDrop={onDrop}
      aria-grabbed={isDragging || undefined}
      className={`relative flex h-full w-full max-w-[310px] flex-col overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-sm transition duration-200 ${
        isDragging
          ? "z-10 scale-[0.97] border-2 border-dashed border-[var(--brand-primary)] bg-[var(--brand-soft)]/35 opacity-75 shadow-none"
          : isDragOver
            ? "z-[5] border-2 border-[var(--brand-primary)] bg-[var(--brand-soft)]/60 shadow-md ring-2 ring-[var(--brand-primary)]/30"
            : isReorderActive
              ? "border-[var(--border)] opacity-50"
              : "border-[var(--border)]"
      }`}
    >
      {isDragging ? (
        <span className="pointer-events-none absolute right-2 top-2 z-20 rounded-lg bg-[var(--brand-primary)] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white shadow-sm">
          Moving
        </span>
      ) : null}

      {isDragOver ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[var(--brand-primary)]/20">
          <span className="rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-[12px] font-semibold tracking-wide text-white shadow-sm">
            Drop here to reorder
          </span>
        </div>
      ) : null}

      <div className="relative aspect-[3/2] overflow-hidden bg-[var(--surface-muted)]">
        {reorderEnabled ? (
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              onDragStart?.();
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", String(item.id));
            }}
            onDragEnd={onDragEnd}
            aria-label={`Reorder ${item.title}`}
            title="Drag to reorder"
            className={`absolute left-2 top-2 z-10 inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-xl border shadow-sm transition active:cursor-grabbing ${
              isDragging
                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                : "border-[var(--border)] bg-[var(--surface)]/95 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <MdDragIndicator className="h-5 w-5" />
          </button>
        ) : null}

        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
            <FiImage className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3.5 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-[var(--text-primary)]">
            {item.title}
          </h3>
          {typeof item.isActive === "boolean" ? (
            <ActiveBadge
              isActive={item.isActive}
              onToggle={canToggle ? () => onToggleActive?.(item) : undefined}
            />
          ) : null}
        </div>

        {description ? (
          <p className="line-clamp-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        ) : (
          <p className="text-[12px] italic text-[var(--text-muted)]">
            No description
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2.5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium leading-none text-[var(--text-muted)]">
            <FiCalendar className="block h-3 w-3 shrink-0" aria-hidden />
            <span>{createdLabel || "—"}</span>
          </p>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>
    </article>
  );
}

export default function BlogList({
  items,
  loading = false,
  emptyText = "No posts found",
  loadingText = "Loading...",
  canReorder = false,
  onReorder,
  onToggleActive,
  renderActions,
}: BlogListProps) {
  const [localItems, setLocalItems] = useState(items);
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  const [dragOverId, setDragOverId] = useState<string | number | null>(null);
  const draggingIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const reorderEnabled =
    canReorder && typeof onReorder === "function" && localItems.length > 1;

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
      className={`grid grid-cols-[repeat(auto-fill,minmax(280px,310px))] justify-items-start gap-3 ${
        isReorderActive ? "select-none" : ""
      }`}
      aria-dropeffect={isReorderActive ? "move" : undefined}
    >
      {localItems.map((item) => {
        const isDragging = String(draggingId) === String(item.id);
        const isDragOver =
          String(dragOverId) === String(item.id) &&
          String(draggingId) !== String(item.id);

        return (
          <BlogCard
            key={item.id}
            item={item}
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
