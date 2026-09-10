"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiSave, FiX } from "react-icons/fi";
import siteSettingsAPI, {
  type SiteSettings,
  type UpdateSiteSettingsPayload,
} from "@/app/services/siteSettings/siteSettingsAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import { useTabPermission } from "@/app/hooks/useTabPermission";
import FilterPanel from "@/app/ui/filterPanel";
import Loading from "@/app/components/loading";

type FormState = {
  show_banners: boolean;
  show_skills: boolean;
  show_projects: boolean;
  show_experiences: boolean;
  show_education: boolean;
};

type ApiResult =
  | {
      success?: boolean;
      data?: SiteSettings;
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

const emptyForm = (): FormState => ({
  show_banners: true,
  show_skills: true,
  show_projects: true,
  show_experiences: true,
  show_education: true,
});

function toForm(data: SiteSettings): FormState {
  return {
    show_banners: Boolean(data.show_banners),
    show_skills: Boolean(data.show_skills),
    show_projects: Boolean(data.show_projects),
    show_experiences: Boolean(data.show_experiences),
    show_education: Boolean(data.show_education),
  };
}

function sameForm(a: FormState, b: FormState) {
  return (
    a.show_banners === b.show_banners &&
    a.show_skills === b.show_skills &&
    a.show_projects === b.show_projects &&
    a.show_experiences === b.show_experiences &&
    a.show_education === b.show_education
  );
}

const SECTIONS: { key: keyof FormState; label: string }[] = [
  { key: "show_banners", label: "Home Banners" },
  { key: "show_skills", label: "Skills" },
  { key: "show_projects", label: "Projects" },
  { key: "show_experiences", label: "Experiences" },
  { key: "show_education", label: "Education" },
];

function ToggleSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onChange(!checked);
      }}
      className={`relative h-7 w-12 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/35 ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      } ${
        disabled
          ? checked
            ? "bg-[#9aa8bc]"
            : "bg-[#c8d0dc]"
          : checked
            ? "bg-[var(--brand-primary)]"
            : "bg-[var(--surface-soft)] ring-1 ring-[var(--border-strong)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full shadow transition ${
          checked ? "left-[22px]" : "left-0.5"
        } ${disabled ? "bg-[#eef1f5]" : "bg-white"}`}
      />
    </button>
  );
}

export default function SiteSettingsMain() {
  const { withLoading } = useLoading();
  const { canEdit } = useTabPermission("site-settings");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saved, setSaved] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const isDirty = useMemo(() => !sameForm(form, saved), [form, saved]);
  const togglesLocked = !editing || !canEdit || loading;

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await siteSettingsAPI.getSiteSettings()) as ApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Error",
          result?.errMessage ||
            result?.message ||
            "Unable to fetch site settings"
        );
        return;
      }

      if (result.data) {
        const next = toForm(result.data);
        setForm(next);
        setSaved(next);
      }
    } catch {
      await popup.error("Error", "Unable to fetch site settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const setField = (key: keyof FormState, value: boolean) => {
    if (togglesLocked) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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

    const payload: UpdateSiteSettingsPayload = {
      show_banners: form.show_banners,
      show_skills: form.show_skills,
      show_projects: form.show_projects,
      show_experiences: form.show_experiences,
      show_education: form.show_education,
    };

    await withLoading(async () => {
      const result = (await siteSettingsAPI.updateSiteSettings(
        payload
      )) as ApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          "Error",
          result?.errMessage ||
            result?.message ||
            "Unable to update site settings"
        );
        return;
      }

      if (result.data) {
        const next = toForm(result.data);
        setForm(next);
        setSaved(next);
      }
      setEditing(false);
      await popup.success("Saved", "Site settings updated successfully");
    }, "Saving changes...");
  };

  return (
    <div className="space-y-5">
      <FilterPanel>
        <h1 className="text-[18px] font-bold text-[var(--text-primary)]">
          Website Controls Settings
        </h1>
      </FilterPanel>

      <section className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-md sm:p-5">
        {loading ? (
          <Loading variant="page" message="Loading..." />
        ) : (
          <>
            <ul className="space-y-3">
              {SECTIONS.map((item) => {
                const on = form[item.key];
                return (
                  <li
                    key={item.key}
                    className="grid grid-cols-[minmax(0,1fr)_4.5rem_auto] items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-sm sm:gap-4 sm:px-5"
                  >
                    <p className="truncate text-[15px] font-semibold text-[var(--text-primary)]">
                      {item.label}
                    </p>

                    <span
                      className={`inline-flex w-[4.5rem] justify-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                        on
                          ? "bg-[#d8f3e4] text-[#1a9a5c]"
                          : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                      }`}
                    >
                      {on ? "On" : "Off"}
                    </span>

                    <div className="flex justify-end">
                      <ToggleSwitch
                        checked={on}
                        disabled={togglesLocked}
                        label={item.label}
                        onChange={(next) => setField(item.key, next)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

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
