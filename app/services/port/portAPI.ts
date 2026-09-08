import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type PortItem = {
  id: number;
  port_number: number;
  project_id: number;
  project_name: string;
  project_type: "project" | "service";
  resource_type_id: number;
  resource_type_code: string;
  resource_type_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreatePortPayload = {
  port_number: number;
  project_id: number;
  resource_type_id: number;
  description?: string | null;
  is_active?: boolean;
};

export type UpdatePortPayload = {
  port_number?: number;
  project_id?: number;
  resource_type_id?: number;
  description?: string | null;
  is_active?: boolean;
};

export type PortListParams = {
  is_active?: boolean;
  project_id?: number;
  project_name?: string;
  project_type?: "project" | "service";
  resource_type_id?: number;
  resource_type_code?: string;
  port_number?: number;
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

const portAPI = {
  getPortAll(params?: PortListParams) {
    return apiServices
      .get(`ports`, {
        params,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getPortAll:", err);
        return failedResult(err, "Failed to fetch Ports");
      });
  },

  getPortById(id: string | number) {
    return apiServices
      .get(`ports/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getPortById:", err);
        return failedResult(err, "Failed to fetch Ports");
      });
  },

  createPort(payload: CreatePortPayload) {
    return apiServices
      .post(`ports`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error createPort:", err);
        return failedResult(err, "Failed to create Port");
      });
  },

  updatePort(id: string | number, payload: UpdatePortPayload) {
    return apiServices
      .put(`ports/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error updatePort:", err);
        return failedResult(err, "Failed to update Port");
      });
  },

  patchPortIsActive(id: string | number, is_active: boolean) {
    return apiServices
      .patch(
        `ports/${id}/is-active`,
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
        console.log("Error patchPortIsActive:", err);
        return failedResult(err, "Failed to update Port status");
      });
  },

  softDeletePort(id: string | number) {
    return apiServices
      .delete(`ports/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error softDeletePort:", err);
        return failedResult(err, "Failed to delete Port");
      });
  },

  hardDeletePort(id: string | number) {
    return apiServices
      .delete(`ports/${id}/hard`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error hardDeletePort:", err);
        return failedResult(err, "Failed to permanently delete Port");
      });
  },
};

export default portAPI;
