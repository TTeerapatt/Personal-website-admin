"use client";

import { type ExperienceItem } from "@/app/services/experience/experienceAPI";
import AccordionList, {
  formatAccordionDate,
  type AccordionItemData,
} from "@/app/ui/accordion";
import TableIconActions from "@/app/ui/tableIconActions";

type ExperienceAccordionProps = {
  items: ExperienceItem[];
  loading?: boolean;
  canReorder?: boolean;
  onEdit?: (item: ExperienceItem) => void;
  onDelete?: (item: ExperienceItem) => void;
  onToggleActive?: (item: ExperienceItem) => void;
  onReorder?: (orderedItems: ExperienceItem[]) => void;
};

function formatPeriod(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  const startLabel = formatAccordionDate(start);
  if (!startLabel) return "";
  const endLabel = end ? formatAccordionDate(end) : "Present";
  return `${startLabel} – ${endLabel}`;
}

function toAccordionItem(item: ExperienceItem): AccordionItemData {
  return {
    id: item.id,
    title: item.name_en || item.name_th,
    subtitle:
      item.position ||
      (item.name_th && item.name_en ? item.name_th : null),
    description: item.description_en || item.description_th,
    imageUrl: item.url,
    periodLabel: formatPeriod(item.start_date, item.end_date),
    isActive: item.is_active,
  };
}

export default function ExperienceAccordion({
  items,
  loading = false,
  canReorder = false,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
}: ExperienceAccordionProps) {
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";
  const itemById = new Map(items.map((item) => [Number(item.id), item]));

  return (
    <AccordionList
      items={items.map(toAccordionItem)}
      loading={loading}
      emptyText="No experiences found"
      loadingText="Loading experiences..."
      canReorder={canReorder}
      onReorder={
        onReorder
          ? (ordered) => {
              const next = ordered
                .map((row) => itemById.get(Number(row.id)))
                .filter((item): item is ExperienceItem => item != null);
              onReorder(next);
            }
          : undefined
      }
      onToggleActive={
        onToggleActive
          ? (row) => {
              const item = itemById.get(Number(row.id));
              if (item) onToggleActive(item);
            }
          : undefined
      }
      renderActions={
        canEdit || canDelete
          ? (row) => {
              const item = itemById.get(Number(row.id));
              if (!item) return null;
              return (
                <TableIconActions
                  editLabel={`Edit ${item.name_en}`}
                  deleteLabel={`Delete ${item.name_en}`}
                  showEdit={canEdit}
                  showDelete={canDelete}
                  onEdit={() => onEdit?.(item)}
                  onDelete={() => onDelete?.(item)}
                />
              );
            }
          : undefined
      }
    />
  );
}
