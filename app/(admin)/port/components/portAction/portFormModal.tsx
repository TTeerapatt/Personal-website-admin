"use client";

import { useCallback, useEffect, useState } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";
import portAPI, { type PortItem } from "@/app/services/port/portAPI";
import type { ProjectItem } from "@/app/services/project/projectAPI";
import type { ResourceTypeItem } from "@/app/services/resourceType/resourceTypeAPI";
import { popup } from "@/app/ui/popUp";
import { useLoading } from "@/app/providers/LoadingProvider";
import {
  FilterField,
  filterInputClass,
  filterSelectClass,
} from "@/app/ui/filterPanel";

type PortFormModalProps = {
  open: boolean;
  port?: PortItem | null;
  projects: ProjectItem[];
  resourceTypes: ResourceTypeItem[];
  /** Used project + resource type pairs */
  usedPairs?: Array<{
    project_id: number;
    resource_type_id: number;
    port_number: number;
  }>;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  port_number: string;
  project_id: string;
  resource_type_id: string;
  description: string;
  is_active: boolean;
};

type FormField = keyof FormState;

function emptyForm(
  projects: ProjectItem[],
  resourceTypes: ResourceTypeItem[]
): FormState {
  const activeProjects = projects.filter((item) => item.is_active);
  const activeTypes = resourceTypes.filter((item) => item.is_active);
  return {
    port_number: "",
    project_id:
      activeProjects.length > 0 ? String(activeProjects[0].id) : "",
    resource_type_id:
      activeTypes.length > 0 ? String(activeTypes[0].id) : "",
    description: "",
    is_active: true,
  };
}

function formFromPort(port: PortItem): FormState {
  return {
    port_number: String(port.port_number),
    project_id: String(port.project_id || ""),
    resource_type_id: String(port.resource_type_id || ""),
    description: port.description || "",
    is_active: Boolean(port.is_active),
  };
}

export default function PortFormModal({
  open,
  port = null,
  projects,
  resourceTypes,
  usedPairs = [],
  onClose,
  onSaved,
}: PortFormModalProps) {
  const { withLoading } = useLoading();
  const isEdit = port != null;
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(projects, resourceTypes)
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FormField, boolean>>
  >({});

  const selectableProjects = projects.filter((item) => {
    if (item.is_active) return true;
    if (isEdit && Number(item.id) === Number(port?.project_id)) return true;
    return false;
  });

  const selectableResourceTypes = resourceTypes.filter((item) => {
    if (item.is_active) return true;
    if (isEdit && Number(item.id) === Number(port?.resource_type_id)) {
      return true;
    }
    return false;
  });

  const resetState = useCallback(() => {
    setForm(port ? formFromPort(port) : emptyForm(projects, resourceTypes));
    setFieldErrors({});
  }, [port, projects, resourceTypes]);

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
    const portNumber = Number(form.port_number.trim());
    const projectId = Number(form.project_id);
    const resourceTypeId = Number(form.resource_type_id);
    const description = form.description.trim();

    if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
      setFieldErrors({ port_number: true });
      await popup.warning(
        "Incomplete information",
        "Please enter a port number between 1 and 65535"
      );
      return;
    }

    if (!Number.isInteger(projectId) || projectId <= 0) {
      setFieldErrors({ project_id: true });
      await popup.warning("Incomplete information", "Please select a Project");
      return;
    }

    if (!Number.isInteger(resourceTypeId) || resourceTypeId <= 0) {
      setFieldErrors({ resource_type_id: true });
      await popup.warning("Incomplete information", "Please select a Resource Type");
      return;
    }

    const conflict = usedPairs.find((item) => {
      if (Number(item.project_id) !== projectId) return false;
      if (Number(item.resource_type_id) !== resourceTypeId) return false;
      if (
        isEdit &&
        Number(port.project_id) === projectId &&
        Number(port.resource_type_id) === resourceTypeId
      ) {
        return false;
      }
      return true;
    });

    if (conflict) {
      setFieldErrors({ project_id: true, resource_type_id: true });
      await popup.warning(
        "Unable to save",
        `This Project + Resource Type is already used by port ${conflict.port_number}`
      );
      return;
    }

    let saved = false;

    await withLoading(async () => {
      const payload = {
        port_number: portNumber,
        project_id: projectId,
        resource_type_id: resourceTypeId,
        description: description || null,
        is_active: form.is_active,
      };

      const result = (
        isEdit
          ? await portAPI.updatePort(port.id, payload)
          : await portAPI.createPort(payload)
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
            (isEdit ? "Unable to update Port" : "Unable to create Port")
        );
        return;
      }

      saved = true;
    }, isEdit ? "Saving changes..." : "Creating Port...");

    if (!saved) return;

    onClose();
    onSaved();
    await popup.success(
      isEdit ? "Updated successfully" : "Created successfully",
      isEdit ? "Port updated successfully" : "Port created successfully"
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
              {isEdit ? "Edit Port" : "Add Port"}
            </h2>
            <p className="text-[13px] text-[var(--text-muted)]">
              Enter port number, project, and resource type
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
          <FilterField label="Port Number *" htmlFor="port-number">
            <input
              id="port-number"
              type="number"
              min={1}
              max={65535}
              value={form.port_number}
              onChange={(e) => {
                clearFieldError("port_number");
                setForm((prev) => ({ ...prev, port_number: e.target.value }));
              }}
              placeholder=""
              className={`${filterInputClass} ${fieldErrors.port_number ? inputErrorClass : ""}`}
            />
          </FilterField>

          <FilterField label="Project *" htmlFor="port-project">
            <div className="relative">
              <select
                id="port-project"
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
                {selectableProjects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  selectableProjects.map((project) => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                      {/* {project.type === "service"
                        ? " (Service)"
                        : " (Project)"} */}
                    </option>
                  ))
                )}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            </div>
          </FilterField>

          <FilterField label="Resource Type *" htmlFor="port-resource-type">
            <div className="relative">
              <select
                id="port-resource-type"
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
                {selectableResourceTypes.length === 0 ? (
                  <option value="">No resource types available</option>
                ) : (
                  selectableResourceTypes.map((type) => (
                    <option key={type.id} value={String(type.id)}>
                      {type.name}
                    </option>
                  ))
                )}
              </select>
              <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
            </div>
          </FilterField>

          <FilterField label="Description" htmlFor="port-description">
            <textarea
              id="port-description"
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
            {isEdit ? "Save changes" : "Create Port"}
          </button>
        </div>
      </div>
    </div>
  );
}
