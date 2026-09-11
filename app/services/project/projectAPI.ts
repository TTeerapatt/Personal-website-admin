import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type ProjectItem = {
  id: number;
  name_th: string;
  name_en: string;
  description_th: string | null;
  description_en: string | null;
  thumbnail_url: string | null;
  github_url: string | null;
  demo_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateProjectPayload = {
  name_th: string;
  name_en: string;
  description_th?: string | null;
  description_en?: string | null;
  thumbnail_url?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
  is_active?: boolean;
};

export type UpdateProjectPayload = {
  name_th?: string;
  name_en?: string;
  description_th?: string | null;
  description_en?: string | null;
  thumbnail_url?: string | null;
  github_url?: string | null;
  demo_url?: string | null;
  is_active?: boolean;
};

export type UploadFileResult = {
  url: string;
  path: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  max_size: number;
};

export type ProjectListParams = {
  is_active?: boolean;
};

function failedResult(err: unknown, fallback: string) {
  return {
    status: "failed" as const,
    errMessage:
      (err as { message?: string; errMessage?: string })?.message ||
      (err as { errMessage?: string })?.errMessage ||
      (typeof err === "string" ? err : null) ||
      fallback,
    error: err,
  };
}

const projectAPI = {
  getProjectAll(params?: ProjectListParams) {
    return apiServices
      .get(`projects`, {
        params,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getProjectAll:", err);
        return failedResult(err, "Failed to fetch Projects");
      });
  },

  getProjectById(id: string | number) {
    return apiServices
      .get(`projects/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getProjectById:", err);
        return failedResult(err, "Failed to fetch Project");
      });
  },

  createProject(payload: CreateProjectPayload) {
    return apiServices
      .post(`projects`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error createProject:", err);
        return failedResult(err, "Failed to create Project");
      });
  },

  updateProject(id: string | number, payload: UpdateProjectPayload) {
    return apiServices
      .put(`projects/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error updateProject:", err);
        return failedResult(err, "Failed to update Project");
      });
  },

  reorderProjects(ordered_ids: number[]) {
    return apiServices
      .put(
        `projects/reorder`,
        { ordered_ids },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error reorderProjects:", err);
        return failedResult(err, "Failed to reorder Projects");
      });
  },

  patchProjectIsActive(id: string | number, is_active: boolean) {
    return apiServices
      .patch(
        `projects/${id}/is-active`,
        { is_active },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error patchProjectIsActive:", err);
        return failedResult(err, "Failed to update Project status");
      });
  },

  softDeleteProject(id: string | number) {
    return apiServices
      .delete(`projects/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error softDeleteProject:", err);
        return failedResult(err, "Failed to delete Project");
      });
  },

  hardDeleteProject(id: string | number) {
    return apiServices
      .delete(`projects/${id}/hard`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error hardDeleteProject:", err);
        return failedResult(err, "Failed to permanently delete Project");
      });
  },

  uploadMediaFile(file: File, folder = "projects") {
    const formData = new FormData();
    formData.append("file", file);

    return apiServices
      .post(`upload`, formData, {
        params: { folder },
        headers: {
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error uploadMediaFile:", err);
        return failedResult(err, "Failed to upload file");
      });
  },
};

export default projectAPI;
