"use client";

import { FiEdit2, FiTrash2 } from "react-icons/fi";

const BASE_BTN =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30 disabled:cursor-not-allowed disabled:opacity-40";

const EDIT_BTN = `${BASE_BTN} bg-[rgba(11,31,58,0.08)] text-[#0b1f3a] ring-1 ring-[rgba(11,31,58,0.16)] hover:bg-[rgba(11,31,58,0.14)]`;

const DELETE_BTN = `${BASE_BTN} bg-[rgba(192,57,43,0.08)] text-[#c0392b] ring-1 ring-[rgba(192,57,43,0.18)] hover:bg-[rgba(192,57,43,0.14)]`;

type TableIconActionsProps = {
  editLabel: string;
  deleteLabel: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
};

export default function TableIconActions({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
  showEdit = true,
  showDelete = true,
}: TableIconActionsProps) {
  if (!showEdit && !showDelete) return null;

  return (
    <div className="inline-flex items-center justify-end gap-1.5">
      {showEdit ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={editLabel}
          title="Edit"
          className={EDIT_BTN}
        >
          <FiEdit2 className="h-4 w-4" strokeWidth={2.25} />
        </button>
      ) : null}
      {showDelete ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label={deleteLabel}
          title="Delete"
          className={DELETE_BTN}
        >
          <FiTrash2 className="h-4 w-4" strokeWidth={2.25} />
        </button>
      ) : null}
    </div>
  );
}
