"use client";

import { useCallback, useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import RichTextEditor from "@/app/components/RichTextEditor";
import experienceAPI, {
  type CreateExperiencePayload,
  type ExperienceItem,
  type MediaType,
  type UpdateExperiencePayload,
} from "@/app/services/experience/experienceAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import {
  filterInputClass,
  filterSelectClass,
} from "@/app/ui/filterPanel";

type ExperienceFormModalProps = {
  open: boolean;
  itemId?: number | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  name_th: string;
  name_en: string;
  description_th: string;
  description_en: string;
  position: string;
  start_date: string;
  end_date: string;
  media_type: MediaType | "";
  url: string;
  is_active: boolean;
};

const emptyForm = (): FormState => ({
  name_th: "",
  name_en: "",
  description_th: "",
  description_en: "",
  position: "",
  start_date: "",
  end_date: "",
  media_type: "",
  url: "",
  is_active: true,
});

const MEDIA_OPTIONS: MediaType[] = ["image", "video"];

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export default function ExperienceFormModal({
  open,
  itemId = null,
  onClose,
  onSaved,
}: ExperienceFormModalProps) {
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
        const result = (await experienceAPI.getExperienceById(itemId)) as {
          success?: boolean;
          status?: string;
          data?: ExperienceItem;
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
            result?.errMessage ||
              result?.message ||
              "Unable to fetch experience"
          );
          onClose();
          return;
        }

        const item = result.data;
        setForm({
          name_th: String(item.name_th || ""),
          name_en: String(item.name_en || ""),
          description_th: String(item.description_th || ""),
          description_en: String(item.description_en || ""),
          position: String(item.position || ""),
          start_date: toDateInput(item.start_date),
          end_date: toDateInput(item.end_date),
          media_type: item.media_type || "",
          url: String(item.url || ""),
          is_active: Boolean(item.is_active),
        });
      } catch {
        if (!cancelled) {
          await popup.error("Error", "Unable to fetch experience");
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

  const handleRequestClose = async () => {
    const confirmed = await popup.confirm({
      title: "Leave this page?",
      text: "Unsaved changes will be lost",
      confirmText: "OK",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    handleClose();
  };

  const handleSave = async () => {
    const name_th = form.name_th.trim();
    const name_en = form.name_en.trim();
    const position = form.position.trim();
    const start_date = form.start_date.trim();
    const end_date = form.end_date.trim();

    if (!name_th) {
      await popup.warning("Incomplete information", "Please enter name (TH)");
      return;
    }
    if (!name_en) {
      await popup.warning("Incomplete information", "Please enter name (EN)");
      return;
    }
    if (!position) {
      await popup.warning("Incomplete information", "Please enter a position");
      return;
    }
    if (!start_date) {
      await popup.warning("Incomplete information", "Please enter a start date");
      return;
    }
    if (end_date && end_date < start_date) {
      await popup.warning(
        "Invalid information",
        "End date must be on or after start date"
      );
      return;
    }

    const payloadBase = {
      name_th,
      name_en,
      description_th: nullableText(form.description_th),
      description_en: nullableText(form.description_en),
      position,
      start_date,
      end_date: end_date || null,
      media_type: form.media_type || null,
      url: nullableText(form.url),
      is_active: form.is_active,
    };

    let saved = false;
    await withLoading(async () => {
      if (isEdit && itemId != null) {
        const payload: UpdateExperiencePayload = payloadBase;
        const result = (await experienceAPI.updateExperience(
          itemId,
          payload
        )) as {
          success?: boolean;
          status?: string;
          errMessage?: string;
          message?: string;
        };
        if (!result || result.status === "failed" || result.success === false) {
          await popup.error(
            "Update failed",
            result?.errMessage ||
              result?.message ||
              "Unable to update experience"
          );
          return;
        }
        saved = true;
        return;
      }

      const payload: CreateExperiencePayload = payloadBase;
      const result = (await experienceAPI.createExperience(payload)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };
      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Create failed",
          result?.errMessage ||
            result?.message ||
            "Unable to create experience"
        );
        return;
      }
      saved = true;
    }, isEdit ? "Saving changes..." : "Creating experience...");

    if (!saved) return;

    handleClose();
    onSaved();
    await popup.success(
      isEdit ? "Updated successfully" : "Created successfully",
      isEdit
        ? "Experience saved successfully"
        : "Experience created successfully"
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden overscroll-none p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#0f172a]/45"
        onClick={() => void handleRequestClose()}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
            {isEdit ? "Edit experience" : "Add experience"}
          </h2>
          <button
            type="button"
            onClick={() => void handleRequestClose()}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
            aria-label="Close"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {detailLoading ? (
            <p className="py-16 text-center text-[14px] text-[var(--text-muted)]">
              Loading experience...
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Name (TH) *
                  </label>
                  <input
                    type="text"
                    value={form.name_th}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name_th: e.target.value }))
                    }
                    className={filterInputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Name (EN) *
                  </label>
                  <input
                    type="text"
                    value={form.name_en}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name_en: e.target.value }))
                    }
                    className={filterInputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  Position *
                </label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, position: e.target.value }))
                  }
                  className={filterInputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  Description (TH)
                </label>
                <RichTextEditor
                  value={form.description_th}
                  onChange={(html) =>
                    setForm((prev) => ({ ...prev, description_th: html }))
                  }
                  placeholder="Experience description in Thai..."
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  Description (EN)
                </label>
                <RichTextEditor
                  value={form.description_en}
                  onChange={(html) =>
                    setForm((prev) => ({ ...prev, description_en: html }))
                  }
                  placeholder="Experience description in English..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Start date *
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    className={filterInputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    End date
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    className={filterInputClass}
                  />
                  <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                    Leave empty if current
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Media type
                  </label>
                  <select
                    value={form.media_type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        media_type: e.target.value as MediaType | "",
                      }))
                    }
                    className={filterSelectClass}
                  >
                    <option value="">None</option>
                    {MEDIA_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Media URL
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
            onClick={() => void handleRequestClose()}
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
