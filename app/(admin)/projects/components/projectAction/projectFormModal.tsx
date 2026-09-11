"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiUpload, FiX } from "react-icons/fi";
import RichTextEditor from "@/app/components/RichTextEditor";
import projectAPI, {
  type CreateProjectPayload,
  type ProjectItem,
  type UpdateProjectPayload,
  type UploadFileResult,
} from "@/app/services/project/projectAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { filterInputClass } from "@/app/ui/filterPanel";

type ProjectFormModalProps = {
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
  thumbnail_url: string;
  github_url: string;
  demo_url: string;
  is_active: boolean;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const emptyForm = (): FormState => ({
  name_th: "",
  name_en: "",
  description_th: "",
  description_en: "",
  thumbnail_url: "",
  github_url: "",
  demo_url: "",
  is_active: true,
});

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

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

export default function ProjectFormModal({
  open,
  itemId = null,
  onClose,
  onSaved,
}: ProjectFormModalProps) {
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
        const result = (await projectAPI.getProjectById(itemId)) as {
          success?: boolean;
          status?: string;
          data?: ProjectItem;
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
            result?.errMessage || result?.message || "Unable to fetch project"
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
          thumbnail_url: String(item.thumbnail_url || ""),
          github_url: String(item.github_url || ""),
          demo_url: String(item.demo_url || ""),
          is_active: Boolean(item.is_active),
        });
        setSelectedFileName(
          item.thumbnail_url
            ? fileNameFromUrl(String(item.thumbnail_url))
            : ""
        );
      } catch {
        if (!cancelled) {
          await popup.error("Error", "Unable to fetch project");
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
    if (form.thumbnail_url.trim()) return form.thumbnail_url.trim();
    return null;
  }, [form.thumbnail_url, localPreviewUrl]);

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
      const result = (await projectAPI.uploadMediaFile(file, "projects")) as {
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
    setForm((prev) => ({ ...prev, thumbnail_url: uploadedUrl }));
  };

  const handleClearFile = () => {
    setSelectedFileName("");
    setForm((prev) => ({ ...prev, thumbnail_url: "" }));
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    const name_th = form.name_th.trim();
    const name_en = form.name_en.trim();

    if (!name_th) {
      await popup.warning("Incomplete information", "Please enter name (TH)");
      return;
    }
    if (!name_en) {
      await popup.warning("Incomplete information", "Please enter name (EN)");
      return;
    }

    const payloadBase = {
      name_th,
      name_en,
      description_th: nullableText(form.description_th),
      description_en: nullableText(form.description_en),
      thumbnail_url: nullableText(form.thumbnail_url),
      github_url: nullableText(form.github_url),
      demo_url: nullableText(form.demo_url),
      is_active: form.is_active,
    };

    let saved = false;
    await withLoading(async () => {
      if (isEdit && itemId != null) {
        const payload: UpdateProjectPayload = payloadBase;
        const result = (await projectAPI.updateProject(itemId, payload)) as {
          success?: boolean;
          status?: string;
          errMessage?: string;
          message?: string;
        };
        if (!result || result.status === "failed" || result.success === false) {
          await popup.error(
            "Update failed",
            result?.errMessage || result?.message || "Unable to update project"
          );
          return;
        }
        saved = true;
        return;
      }

      const payload: CreateProjectPayload = payloadBase;
      const result = (await projectAPI.createProject(payload)) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };
      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Create failed",
          result?.errMessage || result?.message || "Unable to create project"
        );
        return;
      }
      saved = true;
    }, isEdit ? "Saving changes..." : "Creating project...");

    if (!saved) return;

    handleClose();
    onSaved();
    await popup.success(
      isEdit ? "Updated successfully" : "Created successfully",
      isEdit ? "Project saved successfully" : "Project created successfully"
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

      <div className="relative z-10 flex max-h-[92vh] min-h-[min(560px,92vh)] w-full max-w-[1040px] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
            {isEdit ? "Edit project" : "Add project"}
          </h2>
          <button
            type="button"
            onClick={() => void handleRequestClose()}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)]"
            aria-label="Close"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          {detailLoading ? (
            <p className="py-16 text-center text-[14px] text-[var(--text-muted)]">
              Loading project...
            </p>
          ) : (
            <div className="mx-auto w-full max-w-[920px] space-y-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Name (TH) <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name_th}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        name_th: e.target.value,
                      }))
                    }
                    placeholder="Project name (Thai)"
                    className={filterInputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Name (EN) <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name_en}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        name_en: e.target.value,
                      }))
                    }
                    placeholder="Project name (English)"
                    className={filterInputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  Thumbnail
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
                        aria-label="Remove thumbnail"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="block w-full cursor-pointer p-4 text-left"
                      aria-label="Change thumbnail"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewSrc}
                        alt="Project thumbnail preview"
                        className="mx-auto max-h-[280px] w-full rounded-xl object-contain"
                      />
                      <p className="mt-3 truncate text-center text-[12px] text-[var(--text-muted)]">
                        {selectedFileName ||
                          fileNameFromUrl(form.thumbnail_url)}
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

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Description (TH)
                  </label>
                  <RichTextEditor
                    key={`desc-th-${itemId ?? "new"}`}
                    value={form.description_th}
                    onChange={(html) =>
                      setForm((prev) => ({ ...prev, description_th: html }))
                    }
                    placeholder="Write the project description in Thai..."
                    minHeight={200}
                    uploadFolder="projects"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Description (EN)
                  </label>
                  <RichTextEditor
                    key={`desc-en-${itemId ?? "new"}`}
                    value={form.description_en}
                    onChange={(html) =>
                      setForm((prev) => ({ ...prev, description_en: html }))
                    }
                    placeholder="Write the project description in English..."
                    minHeight={200}
                    uploadFolder="projects"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={form.github_url}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        github_url: e.target.value,
                      }))
                    }
                    placeholder="https://github.com/..."
                    className={filterInputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Demo URL
                  </label>
                  <input
                    type="url"
                    value={form.demo_url}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        demo_url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className={filterInputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5">
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                    Active
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                    Show this project on the website
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
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={() => void handleRequestClose()}
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
