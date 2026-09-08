import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type ResourceTypeItem = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

const resourceTypeAPI = {
  getResourceTypeAll() {
    return apiServices
      .get(`resource-types`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getResourceTypeAll:", err);
        return failedResult(err, "Failed to fetch Resource Types");
      });
  },
};

export default resourceTypeAPI;
