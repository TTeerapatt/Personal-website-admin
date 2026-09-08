"use client";

import { useCallback, useEffect, useState } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";
import projectAPI, {
  type ProjectItem,
  type ProjectType,
} from "@/app/services/project/projectAPI";
import type { ResourceTypeItem } from "@/app/services/resourceType/resourceTypeAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import {
  FilterField,
  filterInputClass,
  filterSelectClass,
} from "@/app/ui/filterPanel";

type ProjectFormModalProps = {
  open: boolean;
  project?: ProjectItem | null;
  resourceTypes: ResourceTypeItem[];
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  name: string;
  description: string;
  type: ProjectType;
  resource_type_id: string;
  is_active: boolean;
};

type FormField = keyof FormState;

const PROJECT_TYPE_OPTIONS: Array<{ value: ProjectType; label: string }> = [
  { value: "project", label: "Project" },
  { value: "service", label: "Service" },
];

function emptyForm(resourceTypes: ResourceTypeItem[]): FormState {
  return {
    name: "",
    description: "",
    type: "project",
    resource_type_id:
      resourceTypes.length > 0 ? String(resourceTypes[0].id) : "",
    is_active: true,
  };
}

function formFromProject(project: ProjectItem): FormState {
  return {
    name: project.name || "",
    description: project.description || "",
    type: project.type === "service" ? "service" : "project",
    resource_type_id: String(project.resource_type_id || ""),
    is_active: Boolean(project.is_active),
  };
}

export default function ProjectFormModal({
  open,
  project = null,
  resourceTypes,
  onClose,
  onSaved,
}: ProjectFormModalProps) {
  const { withLoading } = useLoading();
  const isEdit = project != null;
  const [form, setForm] = useState<FormState>(() => emptyForm(resourceTypes));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FormField, boolean>>
  >({});

  const resetState = useCallback(() => {
    setForm(project ? formFromProject(project) : emptyForm(resourceTypes));
    setFieldErrors({});
  }, [project, resourceTypes]);

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
    const resourceTypeId = Number(form.resource_type_id);

    if (!name) {
      setFieldErrors({ name: true });
      await popup.warning("Incomplete information", "Please enter a name");
      return;
    }

    if (form.type !== "project" && form.type !== "service") {
      setFieldErrors({ type: true });
      await popup.warning("Incomplete information", "Please select a Type");
      return;
    }

    if (!Number.isInteger(resourceTypeId) || resourceTypeId <= 0) {
      setFieldErrors({ resource_type_id: true });
      await popup.warning("Incomplete information", "Please select a Resource Type");
      return;
    }

    let saved = false;

    await withLoading(async () => {
      const payload = {
        name,
        description: description || null,
        type: form.type,
        resource_type_id: resourceTypeId,
        is_active: form.is_active,
      };

      const result = (
        isEdit
          ? await projectAPI.updateProject(project.id, payload)
          : await projectAPI.createProject(payload)
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
              ? "Unable to update Project"
              : "Unable to create Project")
        );
        return;
      }

      saved = true;
    }, isEdit ? "Saving changes..." : "Creating Project...");

    if (!saved) return;

    onClose();
    onSaved();
    await popup.success(
      isEdit ? "Updated successfully" : "Created successfully",
      isEdit
        ? "Saved successfully"
        : "Created successfully"
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
              {isEdit ? "Edit Project" : "Add Project"}
            </h2>
            <p className="text-[13px] text-[var(--text-muted)]">
              Enter name, type, and resource type
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
          <FilterField label="Name *" htmlFor="project-name">
            <input
              id="project-name"
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

          <FilterField label="Type *" htmlFor="project-kind">
            <div className="relative">
              <select
                id="project-kind"
                value={form.type}
                onChange={(e) => {
                  clearFieldError("type");
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as ProjectType,
                  }));
                }}
                className={`${filterSelectClass} cursor-pointer ${fieldErrors.type ? inputErrorClass : ""}`}
              >
                {PROJECT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            </div>
          </FilterField>

          <FilterField label="Resource Type *" htmlFor="project-resource-type">
            <div className="relative">
              <select
                id="project-resource-type"
                value={form.resource_type_id}
                onChange={(e) => {
                  clearFieldError("resource_type_id");
                  setForm((prev) => ({
                    ...prev,
                    resource_type_id: e.target.value,
                  }));
                }}
                className={`${filterSelectClass} cursor-pointer ${fieldErrors.resource_type_id ? inputErrorClass : ""}`}
              >
                {resourceTypes.length === 0 ? (
                  <option value="">No resource types available</option>
                ) : (
                  resourceTypes.map((type) => (
                    <option key={type.id} value={String(type.id)}>
                      {type.name}
                    </option>
                  ))
                )}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            </div>
          </FilterField>

          <FilterField label="Description" htmlFor="project-description">
            <textarea
              id="project-description"
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
            {isEdit ? "Save changes" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
