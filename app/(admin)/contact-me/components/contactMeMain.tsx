"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiSave, FiX } from "react-icons/fi";
import Loading from "@/app/components/loading";
import { useTabPermission } from "@/app/hooks/useTabPermission";
import { useLoading } from "@/app/providers/LoadingProvider";
import contactMeAPI, {
  type ContactMe,
  type UpdateContactMePayload,
} from "@/app/services/contactMe/contactMeAPI";
import FilterPanel, { filterInputClass } from "@/app/ui/filterPanel";
import { popup } from "@/app/ui/popUp";

type FormState = {
  name_th: string;
  name_en: string;
  phone: string;
  email: string;
  github_url: string;
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
  is_active: boolean;
};

type ApiResult =
  | {
      success?: boolean;
      data?: ContactMe;
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

const emptyForm = (): FormState => ({
  name_th: "",
  name_en: "",
  phone: "",
  email: "",
  github_url: "",
  linkedin_url: "",
  facebook_url: "",
  instagram_url: "",
  is_active: true,
});

function toForm(data: ContactMe): FormState {
  return {
    name_th: data.name_th ?? "",
    name_en: data.name_en ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    github_url: data.github_url ?? "",
    linkedin_url: data.linkedin_url ?? "",
    facebook_url: data.facebook_url ?? "",
    instagram_url: data.instagram_url ?? "",
    is_active: Boolean(data.is_active),
  };
}

function sameForm(a: FormState, b: FormState) {
  return (
    a.name_th === b.name_th &&
    a.name_en === b.name_en &&
    a.phone === b.phone &&
    a.email === b.email &&
    a.github_url === b.github_url &&
    a.linkedin_url === b.linkedin_url &&
    a.facebook_url === b.facebook_url &&
    a.instagram_url === b.instagram_url &&
    a.is_active === b.is_active
  );
}

function nullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export default function ContactMeMain() {
  const { withLoading } = useLoading();
  const { canEdit } = useTabPermission("contact-me");

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saved, setSaved] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const isDirty = useMemo(() => !sameForm(form, saved), [form, saved]);
  const fieldsLocked = !editing || !canEdit || loading;

  const fetchContactMe = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await contactMeAPI.getContactMe()) as ApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Error",
          result?.errMessage || result?.message || "Unable to fetch Contact Me"
        );
        return;
      }

      if (result.data) {
        const next = toForm(result.data);
        setForm(next);
        setSaved(next);
      }
    } catch {
      await popup.error("Error", "Unable to fetch Contact Me");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchContactMe();
  }, [fetchContactMe]);

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
    }
    setEditing(false);
  };

  const handleSave = async () => {
    if (!canEdit || !editing) return;

    if (!isDirty) {
      setEditing(false);
      return;
    }

    const payload: UpdateContactMePayload = {
      name_th: form.name_th.trim(),
      name_en: form.name_en.trim(),
      phone: nullableText(form.phone),
      email: form.email.trim(),
      github_url: nullableText(form.github_url),
      linkedin_url: nullableText(form.linkedin_url),
      facebook_url: nullableText(form.facebook_url),
      instagram_url: nullableText(form.instagram_url),
      is_active: form.is_active,
    };

    await withLoading(async () => {
      const result = (await contactMeAPI.updateContactMe(payload)) as ApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Error",
          result?.errMessage ||
            result?.message ||
            "Unable to update Contact Me"
        );
        return;
      }

      if (result.data) {
        const next = toForm(result.data);
        setForm(next);
        setSaved(next);
      }
      setEditing(false);
      await popup.success("Saved", "Contact Me updated successfully");
    }, "Saving changes...");
  };

  return (
    <div className="space-y-5">
      <FilterPanel>
        <h1 className="text-[18px] font-bold text-[var(--text-primary)]">
          Contact Me
        </h1>
      </FilterPanel>

      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-md sm:p-6">
        {loading ? (
          <Loading variant="page" message="Loading Contact Me..." />
        ) : (
          <>
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Name (TH)
                  </label>
                  <input
                    type="text"
                    value={form.name_th}
                    disabled={fieldsLocked}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name_th: e.target.value }))
                    }
                    placeholder="ชื่อภาษาไทย"
                    className={filterInputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Name (EN)
                  </label>
                  <input
                    type="text"
                    value={form.name_en}
                    disabled={fieldsLocked}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name_en: e.target.value }))
                    }
                    placeholder="English name"
                    className={filterInputClass}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    disabled={fieldsLocked}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="you@example.com"
                    className={filterInputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    disabled={fieldsLocked}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Optional"
                    className={filterInputClass}
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
                    disabled={fieldsLocked}
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
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={form.linkedin_url}
                    disabled={fieldsLocked}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        linkedin_url: e.target.value,
                      }))
                    }
                    placeholder="https://linkedin.com/in/..."
                    className={filterInputClass}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={form.facebook_url}
                    disabled={fieldsLocked}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        facebook_url: e.target.value,
                      }))
                    }
                    placeholder="https://facebook.com/..."
                    className={filterInputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={form.instagram_url}
                    disabled={fieldsLocked}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        instagram_url: e.target.value,
                      }))
                    }
                    placeholder="https://instagram.com/..."
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
                    setForm((prev) => ({
                      ...prev,
                      is_active: !prev.is_active,
                    }));
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
