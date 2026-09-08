import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type AdminLogItem = {
  id: number;
  admin_id: number;
  admin_display_name: string | null;
  admin_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  message: string | null;
  meta: unknown | null;
  created_at: string;
  updated_at: string;
};

export type AdminLogListParams = {
  admin_id?: number;
  action?: string;
  entity_type?: string;
  entity_id?: number;
  date_from?: string;
  date_to?: string;
  q?: string;
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

const adminLogAPI = {
  getAdminLogAll(params?: AdminLogListParams) {
    return apiServices
      .get(`admin-log`, {
        params,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getAdminLogAll:", err);
        return failedResult(err, "Failed to fetch admin logs");
      });
  },

  getAdminLogById(id: string | number) {
    return apiServices
      .get(`admin-log/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getAdminLogById:", err);
        return failedResult(err, "Failed to fetch admin log");
      });
  },
};

export default adminLogAPI;
