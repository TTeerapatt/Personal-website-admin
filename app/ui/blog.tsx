"use client";

import type { ReactNode } from "react";
import { FiCalendar, FiImage, FiInbox } from "react-icons/fi";
import Loading from "@/app/components/loading";
import { getActiveTone } from "@/app/lib/uiTone";

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
    month: "short",
    year: "numeric",
  }).format(date);
}

export function BlogCard({
  item,
  onToggleActive,
  actions,
}: {
  item: BlogPost;
  onToggleActive?: (item: BlogPost) => void;
  actions?: ReactNode;
}) {
  const canToggle = typeof onToggleActive === "function";
  const description = excerptText(item.description);
  const createdLabel = formatBlogDate(item.createdAt);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="relative aspect-[16/9] overflow-hidden bg-[var(--surface-muted)]">
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
            <button
              type="button"
              disabled={!canToggle}
              onClick={() => onToggleActive?.(item)}
              className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${getActiveTone(item.isActive)} ${canToggle ? "cursor-pointer" : "cursor-default"}`}
            >
              {item.isActive ? "Active" : "Inactive"}
            </button>
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
  onToggleActive,
  renderActions,
}: BlogListProps) {
  if (loading) {
    return (
      <section className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-md">
        <Loading variant="page" message={loadingText} />
      </section>
    );
  }

  if (items.length === 0) {
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

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <BlogCard
          key={item.id}
          item={item}
          onToggleActive={onToggleActive}
          actions={renderActions?.(item)}
        />
      ))}
    </div>
  );
}
