"use client";

import { useCallback, useEffect, useState } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";
import databaseAPI, {
  type DatabaseItem,
} from "@/app/services/database/databaseAPI";
import type { AllDatabaseItem } from "@/app/services/allDatabase/allDatabaseAPI";
import type { ProjectItem } from "@/app/services/project/projectAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import {
  FilterField,
  filterInputClass,
  filterSelectClass,
} from "@/app/ui/filterPanel";

type DatabaseFormModalProps = {
  open: boolean;
  database?: DatabaseItem | null;
  projects: ProjectItem[];
  allDatabases: AllDatabaseItem[];
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  name: string;
  description: string;
  project_id: string;
  all_database_id: string;
  is_active: boolean;
};

type FormField = keyof FormState;

function emptyForm(
  projects: ProjectItem[],
  allDatabases: AllDatabaseItem[]
): FormState {
  return {
    name: "",
    description: "",
    project_id: projects.length > 0 ? String(projects[0].id) : "",
    all_database_id:
      allDatabases.length > 0 ? String(allDatabases[0].id) : "",
    is_active: true,
  };
}

function formFromDatabase(database: DatabaseItem): FormState {
  return {
    name: database.name || "",
    description: database.description || "",
    project_id: String(database.project_id || ""),
    all_database_id: String(database.all_database_id || ""),
    is_active: Boolean(database.is_active),
  };
}

export default function DatabaseFormModal({
  open,
  database = null,
  projects,
  allDatabases,
  onClose,
  onSaved,
}: DatabaseFormModalProps) {
  const { withLoading } = useLoading();
  const isEdit = database != null;
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(projects, allDatabases)
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FormField, boolean>>
  >({});

  const resetState = useCallback(() => {
    setForm(
      database
        ? formFromDatabase(database)
        : emptyForm(projects, allDatabases)
    );
    setFieldErrors({});
  }, [allDatabases, database, projects]);

  useEffect(() => {
    if (!open) return;
    resetState();
  }, [open, resetState]);

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
    if (main instanceof HTMLElement) {
      main.style.overflow = "hidden";
    }

    return () => {
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
      if (main instanceof HTMLElement) {
        main.style.overflow = prevMainOverflow;
      }
    };
  }, [open]);

  const clearFieldError = (field: FormField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleRequestClose = async () => {
    const confirmed = await popup.confirm({
      title: "Leave this page?",
      text: "Unsaved changes will be lost",
      confirmText: "OK",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    onClose();
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const description = form.description.trim();
    const projectId = Number(form.project_id);
    const allDatabaseId = Number(form.all_database_id);

    if (!name) {
      setFieldErrors({ name: true });
      await popup.warning("Incomplete information", "Please enter a name");
      return;
    }

    if (!Number.isInteger(projectId) || projectId <= 0) {
      setFieldErrors({ project_id: true });
      await popup.warning("Incomplete information", "Please select a Project");
      return;
    }

    if (!Number.isInteger(allDatabaseId) || allDatabaseId <= 0) {
      setFieldErrors({ all_database_id: true });
      await popup.warning(
        "Incomplete information",
        "Please select a Database Type"
      );
      return;
    }

    let saved = false;

    await withLoading(async () => {
      const payload = {
        name,
        description: description || null,
        project_id: projectId,
        all_database_id: allDatabaseId,
        is_active: form.is_active,
      };

      const result = (
        isEdit
          ? await databaseAPI.updateDatabase(database.id, payload)
          : await databaseAPI.createDatabase(payload)
      ) as {
        success?: boolean;
        status?: string;
        errMessage?: string;
        message?: string;
      };

      if (!result || result.status === "failed" || result.success === false) {
        await popup.error(
          isEdit ? "Update failed" : "Create failed",
          result?.errMessage ||
            result?.message ||
            (isEdit
              ? "Unable to update Database"
              : "Unable to create Database")
        );
        return;
      }

      saved = true;
    }, isEdit ? "Saving changes..." : "Creating Database...");

    if (!saved) return;

    onClose();
    onSaved();
    await popup.success(
      isEdit ? "Updated successfully" : "Created successfully",
      isEdit ? "Saved successfully" : "Created successfully"
    );
  };

  if (!open) return null;

  const inputErrorClass =
    "border-[#f87171] focus:border-[#ef4444] focus:ring-[#ef4444]/20";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden overscroll-none p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#0f172a]/45"
        onClick={() => void handleRequestClose()}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
              {isEdit ? "Edit Database" : "Add Database"}
            </h2>
            <p className="text-[13px] text-[var(--text-muted)]">
              Enter name, project, and database type
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleRequestClose()}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:bg-[var(--surface)]"
            aria-label="Close"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          <FilterField label="Name *" htmlFor="database-name">
            <input
              id="database-name"
              type="text"
              value={form.name}
              onChange={(e) => {
                clearFieldError("name");
                setForm((prev) => ({ ...prev, name: e.target.value }));
              }}
              placeholder=""
              className={`${filterInputClass} ${fieldErrors.name ? inputErrorClass : ""}`}
            />
          </FilterField>

          <FilterField label="Project *" htmlFor="database-project">
            <div className="relative">
              <select
                id="database-project"
                value={form.project_id}
                onChange={(e) => {
                  clearFieldError("project_id");
                  setForm((prev) => ({
                    ...prev,
                    project_id: e.target.value,
                  }));
                }}
                className={`${filterSelectClass} cursor-pointer ${fieldErrors.project_id ? inputErrorClass : ""}`}
              >
                {projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))
                )}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            </div>
          </FilterField>

          <FilterField label="Database Type *" htmlFor="database-type">
            <div className="relative">
              <select
                id="database-type"
                value={form.all_database_id}
                onChange={(e) => {
                  clearFieldError("all_database_id");
                  setForm((prev) => ({
                    ...prev,
                    all_database_id: e.target.value,
                  }));
                }}
                className={`${filterSelectClass} cursor-pointer ${fieldErrors.all_database_id ? inputErrorClass : ""}`}
              >
                {allDatabases.length === 0 ? (
                  <option value="">No database types available</option>
                ) : (
                  allDatabases.map((type) => (
                    <option key={type.id} value={String(type.id)}>
                      {type.name}
                    </option>
                  ))
                )}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            </div>
          </FilterField>

          <FilterField label="Description" htmlFor="database-description">
            <textarea
              id="database-description"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder=""
              className={`${filterInputClass} h-auto min-h-[96px] resize-y py-3`}
            />
          </FilterField>

          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <div>
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Status</p>
              <p className="text-[12px] text-[var(--text-muted)]">
                {form.is_active ? "Active" : "Inactive"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() =>
                setForm((prev) => ({ ...prev, is_active: !prev.is_active }))
              }
              className={`relative h-7 w-12 cursor-pointer rounded-full transition ${
                form.is_active ? "bg-[var(--surface-raised)]" : "bg-[#cbd5e1]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-[var(--surface)] shadow transition ${
                  form.is_active ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={() => void handleRequestClose()}
            className="inline-flex h-11 cursor-pointer items-center rounded-xl px-4 text-[14px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            className="inline-flex h-11 cursor-pointer items-center rounded-xl bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white transition hover:brightness-110"
          >
            {isEdit ? "Save changes" : "Create Database"}
          </button>
        </div>
      </div>
    </div>
  );
}
