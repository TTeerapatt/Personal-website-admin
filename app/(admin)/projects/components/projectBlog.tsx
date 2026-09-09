"use client";

import { type ProjectItem } from "@/app/services/project/projectAPI";
import BlogList, { type BlogPost } from "@/app/ui/blog";
import TableIconActions from "@/app/ui/tableIconActions";

type ProjectBlogProps = {
  items: ProjectItem[];
  loading?: boolean;
  onEdit?: (item: ProjectItem) => void;
  onDelete?: (item: ProjectItem) => void;
  onToggleActive?: (item: ProjectItem) => void;
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
  onEdit,
  onDelete,
  onToggleActive,
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
