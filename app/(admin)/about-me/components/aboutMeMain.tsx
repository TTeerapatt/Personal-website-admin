"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiEdit2, FiSave, FiUpload, FiX } from "react-icons/fi";
import RichTextEditor from "@/app/components/RichTextEditor";
import Loading from "@/app/components/loading";
import { useTabPermission } from "@/app/hooks/useTabPermission";
import { useLoading } from "@/app/providers/LoadingProvider";
import aboutMeAPI, {
  type AboutMe,
  type UpdateAboutMePayload,
  type UploadFileResult,
} from "@/app/services/aboutMe/aboutMeAPI";
import FilterPanel, { filterInputClass } from "@/app/ui/filterPanel";
import { popup } from "@/app/ui/popUp";

type FormState = {
  title_th: string;
  title_en: string;
  text_animation_th: string;
  text_animation_en: string;
  description_th: string;
  description_en: string;
  image_url: string;
  github_url: string;
  resume_url: string;
  is_active: boolean;
};

type ApiResult =
  | {
      success?: boolean;
      data?: AboutMe;
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const emptyForm = (): FormState => ({
  title_th: "",
  title_en: "",
  text_animation_th: "",
  text_animation_en: "",
  description_th: "",
  description_en: "",
  image_url: "",
  github_url: "",
  resume_url: "",
  is_active: true,
});

function toForm(data: AboutMe): FormState {
  return {
    title_th: data.title_th ?? "",
    title_en: data.title_en ?? "",
    text_animation_th: data.text_animation_th ?? "",
    text_animation_en: data.text_animation_en ?? "",
    description_th: data.description_th ?? "",
    description_en: data.description_en ?? "",
    image_url: data.image_url ?? "",
    github_url: data.github_url ?? "",
    resume_url: data.resume_url ?? "",
    is_active: Boolean(data.is_active),
  };
}

function sameForm(a: FormState, b: FormState) {
  return (
    a.title_th === b.title_th &&
    a.title_en === b.title_en &&
    a.text_animation_th === b.text_animation_th &&
    a.text_animation_en === b.text_animation_en &&
    a.description_th === b.description_th &&
    a.description_en === b.description_en &&
    a.image_url === b.image_url &&
    a.github_url === b.github_url &&
    a.resume_url === b.resume_url &&
    a.is_active === b.is_active
  );
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export default function AboutMeMain() {
  const { withLoading } = useLoading();
  const { canEdit } = useTabPermission("about-me");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saved, setSaved] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  const isDirty = useMemo(() => !sameForm(form, saved), [form, saved]);
  const fieldsLocked = !editing || !canEdit || loading;
  const previewSrc = localPreviewUrl || form.image_url || "";

  const fetchAboutMe = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await aboutMeAPI.getAboutMe()) as ApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Error",
          result?.errMessage || result?.message || "Unable to fetch About Me"
        );
        return;
      }

      if (result.data) {
        const next = toForm(result.data);
        setForm(next);
        setSaved(next);
      }
    } catch {
      await popup.error("Error", "Unable to fetch About Me");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAboutMe();
  }, [fetchAboutMe]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  const startEditing = () => {
    if (!canEdit || loading) return;
    setEditing(true);
  };

  const cancelEditing = async () => {
    if (isDirty) {
      const confirmed = await popup.confirm({
        title: "Discard changes?",
        text: "Unsaved changes will be lost.",
        confirmText: "Discard",
        cancelText: "Keep editing",
      });
      if (!confirmed) return;
      setForm(saved);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      }
      setSelectedFileName("");
    }
    setEditing(false);
  };

  const handleClearFile = () => {
    if (fieldsLocked) return;
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    setSelectedFileName("");
    setForm((prev) => ({ ...prev, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePickFile = async (file: File | null) => {
    if (fieldsLocked || !file) return;

    if (file.size > MAX_FILE_BYTES) {
      await popup.warning("File too large", "Image must be 5MB or smaller");
      return;
    }

    if (!file.type.startsWith("image/")) {
      await popup.warning("Invalid file", "Please choose an image file");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(objectUrl);
    setSelectedFileName(file.name);

    await withLoading(async () => {
      const result = (await aboutMeAPI.uploadMediaFile(
        file,
        "about-me"
      )) as UploadFileResult;

      if (
        !result ||
        result.status === "failed" ||
        result.success === false ||
        !result.data?.url
      ) {
        await popup.error(
          "Upload failed",
          result?.errMessage || result?.message || "Unable to upload image"
        );
        URL.revokeObjectURL(objectUrl);
        setLocalPreviewUrl(null);
        setSelectedFileName("");
        return;
      }

      setForm((prev) => ({ ...prev, image_url: String(result.data?.url) }));
    }, "Uploading image...");
  };

  const handleSave = async () => {
    if (!canEdit || !editing) return;

    if (!isDirty) {
      setEditing(false);
      return;
    }

    const payload: UpdateAboutMePayload = {
      title_th: form.title_th.trim(),
      title_en: form.title_en.trim(),
      text_animation_th: form.text_animation_th.trim(),
      text_animation_en: form.text_animation_en.trim(),
      description_th: nullableText(form.description_th),
      description_en: nullableText(form.description_en),
      image_url: nullableText(form.image_url),
      github_url: nullableText(form.github_url),
      resume_url: nullableText(form.resume_url),
      is_active: form.is_active,
    };

    await withLoading(async () => {
      const result = (await aboutMeAPI.updateAboutMe(payload)) as ApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Error",
          result?.errMessage || result?.message || "Unable to update About Me"
        );
        return;
      }

      if (result.data) {
        const next = toForm(result.data);
        setForm(next);
        setSaved(next);
      }
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      }
      setSelectedFileName("");
      setEditing(false);
      await popup.success("Saved", "About Me updated successfully");
    }, "Saving changes...");
  };

  return (
    <div className="space-y-5">
      <FilterPanel>
        <h1 className="text-[18px] font-bold text-[var(--text-primary)]">
          About Me
        </h1>
      </FilterPanel>

      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-md sm:p-6">
        {loading ? (
          <Loading variant="page" message="Loading About Me..." />
        ) : (
          <>
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Title (TH)
                  </label>
                  <input
                    type="text"
                    value={form.title_th}
                    disabled={fieldsLocked}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title_th: e.target.value }))
                    }
                    placeholder="หัวข้อภาษาไทย"
                    className={filterInputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Title (EN)
                  </label>
                  <input
                    type="text"
                    value={form.title_en}
                    disabled={fieldsLocked}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title_en: e.target.value }))
                    }
                    placeholder="English title"
                    className={filterInputClass}
                  />
                </div>
              </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  Text animation (TH)
                </label>
                <input
                  type="text"
                  value={form.text_animation_th}
                  disabled={fieldsLocked}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      text_animation_th: e.target.value,
                    }))
                  }
                  placeholder="เช่น นักพัฒนา | นักออกแบบ"
                  className={filterInputClass}
                />
                <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                  Separate rotating phrases with |
                </p>
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  Text animation (EN)
                </label>
                <input
                  type="text"
                  value={form.text_animation_en}
                  disabled={fieldsLocked}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      text_animation_en: e.target.value,
                    }))
                  }
                  placeholder="e.g. Developer | Designer"
                  className={filterInputClass}
                />
                <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                  Separate rotating phrases with |
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                Profile image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={fieldsLocked}
                onChange={(e) =>
                  void handlePickFile(e.target.files?.[0] ?? null)
                }
              />

              {previewSrc ? (
                <div className="relative overflow-hidden rounded-2xl border border-solid border-[var(--border-strong)] bg-[var(--surface)] shadow-[inset_3px_0_0_0_var(--brand-primary)]">
                  {!fieldsLocked ? (
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
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--surface-soft)]"
                        aria-label="Remove image"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewSrc}
                    alt="About Me"
                    className="mx-auto max-h-72 w-full object-contain p-4"
                  />
                  {selectedFileName ? (
                    <p className="border-t border-[var(--border)] px-4 py-2 text-[12px] text-[var(--text-muted)]">
                      {selectedFileName}
                    </p>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={fieldsLocked}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] px-4 py-10 text-center transition hover:border-[var(--brand-primary)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--brand-primary)] shadow-sm">
                    <FiUpload className="h-5 w-5" />
                  </span>
                  <span className="text-[14px] font-semibold text-[var(--text-primary)]">
                    Upload profile image
                  </span>
                  <span className="text-[12px] text-[var(--text-muted)]">
                    JPG, PNG, WebP or GIF · max 5MB
                  </span>
                </button>
              )}
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
                placeholder="Write the About Me description in Thai..."
                uploadFolder="about-me"
                disabled={fieldsLocked}
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
                placeholder="Write the About Me description in English..."
                uploadFolder="about-me"
                disabled={fieldsLocked}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={form.github_url}
                  disabled={fieldsLocked}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, github_url: e.target.value }))
                  }
                  placeholder="https://github.com/..."
                  className={filterInputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                  Resume URL
                </label>
                <input
                  type="url"
                  value={form.resume_url}
                  disabled={fieldsLocked}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, resume_url: e.target.value }))
                  }
                  placeholder="https://..."
                  className={filterInputClass}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3.5">
              <div>
                <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Active
                </p>
                <p className="text-[12px] text-[var(--text-muted)]">
                  Inactive content is hidden from the public API
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.is_active}
                aria-label="Active"
                disabled={fieldsLocked}
                onClick={() => {
                  if (fieldsLocked) return;
                  setForm((prev) => ({ ...prev, is_active: !prev.is_active }));
                }}
                className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/35 ${
                  fieldsLocked
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer"
                } ${
                  form.is_active
                    ? "bg-[var(--brand-primary)]"
                    : "bg-[var(--surface-soft)] ring-1 ring-[var(--border-strong)]"
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

            {canEdit ? (
              <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
                {!editing ? (
                  <button
                    type="button"
                    onClick={startEditing}
                    disabled={loading}
                    className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiEdit2 className="h-4 w-4" />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void cancelEditing()}
                      className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[13px] font-semibold text-[var(--text-primary)] shadow-sm"
                    >
                      <FiX className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={loading || !isDirty}
                      className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiSave className="h-4 w-4" />
                      Save
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
