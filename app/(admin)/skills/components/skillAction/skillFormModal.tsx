"use client";

import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import skillAPI, {
  type CreateSkillPayload,
  type MediaType,
  type SkillItem,
  type UpdateSkillPayload,
} from "@/app/services/skill/skillAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import {
  filterInputClass,
  filterSelectClass,
} from "@/app/ui/filterPanel";

type SkillFormModalProps = {
  open: boolean;
  itemId?: number | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  name: string;
  category: string;
  media_type: MediaType | "";
  url: string;
  display_order: string;
  is_active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  category: "",
  media_type: "icon",
  url: "",
  display_order: "0",
  is_active: true,
});

const MEDIA_OPTIONS: MediaType[] = ["image", "video", "icon"];

export default function SkillFormModal({
  open,
  itemId = null,
  onClose,
  onSaved,
}: SkillFormModalProps) {
  const { withLoading } = useLoading();
  const isEdit = itemId != null;
  const [form, setForm] = useState(emptyForm);
  const [detailLoading, setDetailLoading] = useState(false);

  const resetState = useCallback(() => {
    setForm(emptyForm());
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const html = document.documentElement;
    const main = document.querySelector("main");
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    const prevMainOverflow =
      main instanceof HTMLElement ? main.style.overflow : "";

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    if (main instanceof HTMLElement) main.style.overflow = "hidden";

    return () => {
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
      if (main instanceof HTMLElement) main.style.overflow = prevMainOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    resetState();
    if (itemId == null) return;

    let cancelled = false;
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const result = (await skillAPI.getSkillById(itemId)) as {
          success?: boolean;
          status?: string;
          data?: SkillItem;
          errMessage?: string;
          message?: string;
        };

        if (cancelled) return;

        if (
          !result ||
          result.status === "failed" ||
          result.success === false ||
          !result.data
        ) {
          await popup.error(
            "Error",
            result?.errMessage || result?.message || "Unable to fetch skill"
          );
          onClose();
          return;
        }

        const item = result.data;
        setForm({
          name: String(item.name || ""),
          category: String(item.category || ""),
          media_type: item.media_type,
          url: String(item.url || ""),
          display_order: String(item.display_order ?? 0),
          is_active: Boolean(item.is_active),
        });
      } catch {
        if (!cancelled) {
          await popup.error("Error", "Unable to fetch skill");
          onClose();
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };

    void loadDetail();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemId, resetState]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const category = form.category.trim();
    const url = form.url.trim();
    const media_type = form.media_type;
    const display_order = Number(form.display_order);

    if (!name) {
      await popup.warning("Incomplete information", "Please enter a name");
      return;
    }
    if (!category) {
      await popup.warning("Incomplete information", "Please enter a category");
      return;
    }
    if (!media_type) {
      await popup.warning("Incomplete information", "Please select a media type");
      return;
    }
    if (!url) {
      await popup.warning("Incomplete information", "Please enter a URL");
      return;
    }
    if (!Number.isFinite(display_order)) {
      await popup.warning("Invalid information", "Display order must be a number");
      return;
    }

    let saved = false;
    await withLoading(async () => {
      if (isEdit && itemId != null) {
        const payload: UpdateSkillPayload = {
          name,
          category,
          media_type,
          url,
          display_order,
          is_active: form.is_active,
        };
        const result = (await skillAPI.updateSkill(itemId, payload)) as {
          success?: boolean;
          status?: string;
          errMessage?: string;
          message?: string;
        };
        if (!result || result.status === "failed" || result.success === false) {
          await popup.error(
            "Update failed",
            result?.errMessage || result?.message || "Unable to update skill"
          );
          return;
        }
        saved = true;
        return;
      }

      const payload: CreateSkillPayload = {
        name,
        category,
        media_type,
        url,
        display_order,
        is_active: form.is_active,
      };
      const result = (await skillAPI.createSkill(payload)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };
      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Create failed",
          result?.errMessage || result?.message || "Unable to create skill"
        );
        return;
      }
      saved = true;
    }, isEdit ? "Saving changes..." : "Creating skill...");

    if (!saved) return;

    handleClose();
    onSaved();
    await popup.success(
      isEdit ? "Updated successfully" : "Created successfully",
      isEdit ? "Skill saved successfully" : "Skill created successfully"
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden overscroll-none p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#0f172a]/45"
        onClick={handleClose}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
            {isEdit ? "Edit skill" : "Add skill"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
            aria-label="Close"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {detailLoading ? (
            <p className="py-16 text-center text-[14px] text-[var(--text-muted)]">
              Loading skill...
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={filterInputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  Category *
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="e.g. frontend, backend, tools"
                  className={filterInputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  Media type *
                </label>
                <select
                  value={form.media_type}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      media_type: e.target.value as MediaType,
                    }))
                  }
                  className={filterSelectClass}
                >
                  {MEDIA_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  URL *
                </label>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, url: e.target.value }))
                  }
                  className={filterInputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  Display order
                </label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      display_order: e.target.value,
                    }))
                  }
                  className={filterInputClass}
                />
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 text-[14px] font-medium text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-[var(--border)]"
                />
                Active
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={detailLoading}
            className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-[var(--border)] px-5 text-[14px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={detailLoading}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            <FiCheck className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
