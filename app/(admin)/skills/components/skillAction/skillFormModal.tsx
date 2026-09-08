"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiUpload, FiX } from "react-icons/fi";
import skillAPI, {
  type CreateSkillPayload,
  type SkillItem,
  type UpdateSkillPayload,
  type UploadFileResult,
} from "@/app/services/skill/skillAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { filterInputClass } from "@/app/ui/filterPanel";

type SkillFormModalProps = {
  open: boolean;
  itemId?: number | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  name: string;
  url: string;
  is_active: boolean;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const emptyForm = (): FormState => ({
  name: "",
  url: "",
  is_active: true,
});

function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split("/").filter(Boolean).pop();
    return name || url;
  } catch {
    const name = url.split("/").filter(Boolean).pop();
    return name || url;
  }
}

export default function SkillFormModal({
  open,
  itemId = null,
  onClose,
  onSaved,
}: SkillFormModalProps) {
  const { withLoading } = useLoading();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = itemId != null;
  const [form, setForm] = useState(emptyForm);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setForm(emptyForm());
    setDetailLoading(false);
    setSelectedFileName("");
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          url: String(item.url || ""),
          is_active: Boolean(item.is_active),
        });
        setSelectedFileName(item.url ? fileNameFromUrl(String(item.url)) : "");
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

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const previewSrc = useMemo(() => {
    if (localPreviewUrl) return localPreviewUrl;
    if (form.url.trim()) return form.url.trim();
    return null;
  }, [form.url, localPreviewUrl]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handlePickFile = async (file: File | null) => {
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      await popup.warning("File too large", "File size must not exceed 5MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!file.type.toLowerCase().startsWith("image/")) {
      await popup.warning("Invalid file", "Please upload an image file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    let uploadedUrl = "";
    await withLoading(async () => {
      const result = (await skillAPI.uploadMediaFile(file, "skills")) as {
        success?: boolean;
        status?: string;
        data?: UploadFileResult;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Upload failed",
          result?.errMessage || result?.message || "Unable to upload file"
        );
        return;
      }

      uploadedUrl = String(result.data?.url || "").trim();
    }, "Uploading file...");

    if (!uploadedUrl) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setSelectedFileName(file.name);
    setForm((prev) => ({ ...prev, url: uploadedUrl }));
  };

  const handleClearFile = () => {
    setSelectedFileName("");
    setForm((prev) => ({ ...prev, url: "" }));
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const url = form.url.trim();

    if (!name) {
      await popup.warning("Incomplete information", "Please enter a name");
      return;
    }
    if (!url) {
      await popup.warning(
        "Incomplete information",
        "Please upload a media file"
      );
      return;
    }

    let saved = false;
    await withLoading(async () => {
      if (isEdit && itemId != null) {
        const payload: UpdateSkillPayload = {
          name,
          media_type: "image",
          url,
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
        media_type: "image",
        url,
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

      <div className="relative z-10 flex max-h-[92vh] min-h-[min(560px,92vh)] w-full max-w-[980px] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
            {isEdit ? "Edit skill" : "Add skill"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)]"
            aria-label="Close"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          {detailLoading ? (
            <p className="py-16 text-center text-[14px] text-[var(--text-muted)]">
              Loading skill...
            </p>
          ) : (
            <div className="mx-auto w-full max-w-[820px] space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Name <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Skill name"
                    className={filterInputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Media file <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) =>
                      void handlePickFile(e.target.files?.[0] ?? null)
                    }
                  />

                  {previewSrc ? (
                    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]">
                      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[12px] font-semibold text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--surface-soft)]"
                        >
                          <FiUpload className="h-3.5 w-3.5" />
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleClearFile}
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--surface-soft)] hover:text-[var(--danger)]"
                          aria-label="Remove media file"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="block w-full cursor-pointer p-4 text-left"
                        aria-label="Change media file"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewSrc}
                          alt="Skill preview"
                          className="mx-auto max-h-[280px] w-full rounded-xl object-contain"
                        />
                        <p className="mt-3 truncate text-center text-[12px] text-[var(--text-muted)]">
                          {selectedFileName || fileNameFromUrl(form.url)}
                        </p>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] px-4 py-10 text-center transition hover:border-[var(--brand-primary)] hover:bg-[var(--surface-soft)]"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--brand-primary)] shadow-sm">
                        <FiUpload className="h-5 w-5" />
                      </span>
                      <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                        Click to upload image
                      </span>
                      <span className="text-[12px] text-[var(--text-muted)]">
                        JPG, PNG, WEBP, GIF — max 5MB
                      </span>
                    </button>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                        Active
                      </p>
                      <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                        Show this skill on the website
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.is_active}
                      aria-label="Active"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          is_active: !prev.is_active,
                        }))
                      }
                      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition ${
                        form.is_active
                          ? "bg-[var(--brand-primary)]"
                          : "bg-[var(--surface-soft)]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                          form.is_active ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={detailLoading}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-[14px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-50"
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
