import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type AllDatabaseItem = {
  id: number;
  code: string;
  name: string;
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

const allDatabaseAPI = {
  getAllDatabaseAll() {
    return apiServices
      .get(`all-database`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getAllDatabaseAll:", err);
        return failedResult(err, "Failed to fetch database types");
      });
  },
};

export default allDatabaseAPI;
