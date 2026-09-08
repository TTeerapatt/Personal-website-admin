import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type DatabaseItem = {
  id: number;
  name: string;
  project_id: number;
  project_name: string;
  project_type: "project" | "service";
  all_database_id: number;
  all_database_code: string;
  all_database_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateDatabasePayload = {
  name: string;
  project_id: number;
  all_database_id: number;
  description?: string | null;
  is_active?: boolean;
};

export type UpdateDatabasePayload = {
  name?: string;
  project_id?: number;
  all_database_id?: number;
  description?: string | null;
  is_active?: boolean;
};

export type DatabaseListParams = {
  is_active?: boolean;
  name?: string;
  project_id?: number;
  project_name?: string;
  all_database_id?: number;
  all_database_code?: string;
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

const databaseAPI = {
  getDatabaseAll(params?: DatabaseListParams) {
    return apiServices
      .get(`databases`, {
        params,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getDatabaseAll:", err);
        return failedResult(err, "Failed to fetch Databases");
      });
  },

  getDatabaseById(id: string | number) {
    return apiServices
      .get(`databases/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getDatabaseById:", err);
        return failedResult(err, "Failed to fetch Database");
      });
  },

  createDatabase(payload: CreateDatabasePayload) {
    return apiServices
      .post(`databases`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error createDatabase:", err);
        return failedResult(err, "Failed to create Database");
      });
  },

  updateDatabase(id: string | number, payload: UpdateDatabasePayload) {
    return apiServices
      .put(`databases/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error updateDatabase:", err);
        return failedResult(err, "Failed to update Database");
      });
  },

  patchDatabaseIsActive(id: string | number, is_active: boolean) {
    return apiServices
      .patch(
        `databases/${id}/is-active`,
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
        console.log("Error patchDatabaseIsActive:", err);
        return failedResult(err, "Failed to update Database status");
      });
  },

  softDeleteDatabase(id: string | number) {
    return apiServices
      .delete(`databases/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error softDeleteDatabase:", err);
        return failedResult(err, "Failed to delete Database");
      });
  },

  hardDeleteDatabase(id: string | number) {
    return apiServices
      .delete(`databases/${id}/hard`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error hardDeleteDatabase:", err);
        return failedResult(err, "Failed to permanently delete Database");
      });
  },
};

export default databaseAPI;
