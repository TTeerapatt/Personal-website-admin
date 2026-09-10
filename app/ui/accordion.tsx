"use client";

import { useId, useState, type ReactNode } from "react";
import { FiCalendar, FiChevronDown, FiImage, FiInbox } from "react-icons/fi";
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
  onToggleActive?: (item: AccordionItemData) => void;
  renderActions?: (item: AccordionItemData) => ReactNode;
};

function AccordionRow({
  item,
  open,
  onToggle,
  onToggleActive,
  actions,
}: {
  item: AccordionItemData;
  open: boolean;
  onToggle: () => void;
  onToggleActive?: (item: AccordionItemData) => void;
  actions?: ReactNode;
}) {
  const panelId = useId();
  const canToggle = typeof onToggleActive === "function";
  const plainDescription = stripHtml(item.description);
  const period = item.periodLabel?.trim() || "";

  return (
    <article
      className={`overflow-hidden rounded-[20px] border bg-[var(--surface)] shadow-sm transition ${
        open
          ? "border-[var(--brand-primary)]/35 shadow-md"
          : "border-[var(--border)]"
      }`}
    >
      <div className="flex items-stretch gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
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
  onToggleActive,
  renderActions,
}: AccordionListProps) {
  const [openIds, setOpenIds] = useState<(string | number)[]>(() =>
    defaultOpenId != null ? [defaultOpenId] : []
  );

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
    <div className="space-y-3">
      {items.map((item) => {
        const open = openIds.some((id) => String(id) === String(item.id));
        return (
          <AccordionRow
            key={item.id}
            item={item}
            open={open}
            onToggle={() => toggle(item.id)}
            onToggleActive={onToggleActive}
            actions={renderActions?.(item)}
          />
        );
      })}
    </div>
  );
}

export { formatBlogDate as formatAccordionDate };
