"use client";

import { FiEdit2, FiTrash2 } from "react-icons/fi";

const BASE_BTN =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 disabled:cursor-not-allowed disabled:opacity-40";

const EDIT_BTN = `${BASE_BTN} bg-[rgba(91,134,255,0.12)] text-[#b4c8ff] ring-1 ring-[rgba(91,134,255,0.28)] hover:bg-[rgba(91,134,255,0.22)] hover:text-[#e8efff] hover:ring-[rgba(91,134,255,0.48)]`;

const DELETE_BTN = `${BASE_BTN} bg-[rgba(248,113,113,0.12)] text-[#fca5a5] ring-1 ring-[rgba(248,113,113,0.28)] hover:bg-[rgba(248,113,113,0.22)] hover:text-[#fecaca] hover:ring-[rgba(248,113,113,0.48)]`;

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
