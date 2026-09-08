import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type ProjectType = "project" | "service";

export type ProjectItem = {
  id: number;
  name: string;
  description: string | null;
  type: ProjectType;
  resource_type_id: number;
  resource_type_code: string;
  resource_type_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateProjectPayload = {
  name: string;
  description?: string | null;
  type: ProjectType;
  resource_type_id: number;
  is_active?: boolean;
};

export type UpdateProjectPayload = {
  name?: string;
  description?: string | null;
  type?: ProjectType;
  resource_type_id?: number;
  is_active?: boolean;
};

export type ProjectListParams = {
  is_active?: boolean;
  name?: string;
  type?: ProjectType;
  resource_type_id?: number;
  resource_type_code?: string;
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
        return failedResult(err, "Failed to fetch Projects");
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
};

export default projectAPI;
