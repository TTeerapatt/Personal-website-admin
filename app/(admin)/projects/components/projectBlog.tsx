"use client";

import { type ProjectItem } from "@/app/services/project/projectAPI";
import BlogList, { type BlogPost } from "@/app/ui/blog";
import TableIconActions from "@/app/ui/tableIconActions";

type ProjectBlogProps = {
  items: ProjectItem[];
  loading?: boolean;
  canReorder?: boolean;
  onEdit?: (item: ProjectItem) => void;
  onDelete?: (item: ProjectItem) => void;
  onToggleActive?: (item: ProjectItem) => void;
  onReorder?: (orderedItems: ProjectItem[]) => void;
};

function toBlogPost(item: ProjectItem): BlogPost {
  return {
    id: item.id,
    title: item.name_en || item.name_th,
    description: item.description_en || item.description_th,
    imageUrl: item.thumbnail_url,
    createdAt: item.created_at,
    isActive: item.is_active,
  };
}

export default function ProjectBlog({
  items,
  loading = false,
  canReorder = false,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
}: ProjectBlogProps) {
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";
  const itemById = new Map(items.map((item) => [Number(item.id), item]));

  return (
    <BlogList
      items={items.map(toBlogPost)}
      loading={loading}
      emptyText="No projects found"
      loadingText="Loading projects..."
      canReorder={canReorder}
      onReorder={
        onReorder
          ? (ordered) => {
              const next = ordered
                .map((row) => itemById.get(Number(row.id)))
                .filter((item): item is ProjectItem => item != null);
              onReorder(next);
            }
          : undefined
      }
      onToggleActive={
        onToggleActive
          ? (post) => {
              const item = itemById.get(Number(post.id));
              if (item) onToggleActive(item);
            }
          : undefined
      }
      renderActions={
        canEdit || canDelete
          ? (post) => {
              const item = itemById.get(Number(post.id));
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
