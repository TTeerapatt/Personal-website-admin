"use client";

import { type EducationItem } from "@/app/services/education/educationAPI";
import AccordionList, {
  formatAccordionDate,
  type AccordionItemData,
} from "@/app/ui/accordion";
import TableIconActions from "@/app/ui/tableIconActions";

type EducationAccordionProps = {
  items: EducationItem[];
  loading?: boolean;
  canReorder?: boolean;
  onEdit?: (item: EducationItem) => void;
  onDelete?: (item: EducationItem) => void;
  onToggleActive?: (item: EducationItem) => void;
  onReorder?: (orderedItems: EducationItem[]) => void;
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

function toAccordionItem(item: EducationItem): AccordionItemData {
  return {
    id: item.id,
    title: item.name_en || item.name_th,
    subtitle: item.name_th && item.name_en ? item.name_th : null,
    description: item.description_en || item.description_th,
    imageUrl: item.url,
    periodLabel: formatPeriod(item.start_date, item.end_date),
    isActive: item.is_active,
  };
}

export default function EducationAccordion({
  items,
  loading = false,
  canReorder = false,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
}: EducationAccordionProps) {
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";
  const itemById = new Map(items.map((item) => [Number(item.id), item]));

  return (
    <AccordionList
      items={items.map(toAccordionItem)}
      loading={loading}
      emptyText="No education found"
      loadingText="Loading education..."
      canReorder={canReorder}
      onReorder={
        onReorder
          ? (ordered) => {
              const next = ordered
                .map((row) => itemById.get(Number(row.id)))
                .filter((item): item is EducationItem => item != null);
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
