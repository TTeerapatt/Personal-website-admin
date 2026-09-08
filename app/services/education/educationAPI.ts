import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type MediaType = "image" | "video";

export type EducationItem = {
  id: number;
  name_th: string;
  name_en: string;
  description_th: string | null;
  description_en: string | null;
  start_date: string;
  end_date: string | null;
  media_type: MediaType | null;
  url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateEducationPayload = {
  name_th: string;
  name_en: string;
  description_th?: string | null;
  description_en?: string | null;
  start_date: string;
  end_date?: string | null;
  media_type?: MediaType | null;
  url?: string | null;
  is_active?: boolean;
};

export type UpdateEducationPayload = {
  name_th?: string;
  name_en?: string;
  description_th?: string | null;
  description_en?: string | null;
  start_date?: string;
  end_date?: string | null;
  media_type?: MediaType | null;
  url?: string | null;
  is_active?: boolean;
};

export type EducationListParams = {
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

const educationAPI = {
  getEducationAll(params?: EducationListParams) {
    return apiServices
      .get(`education`, {
        params,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getEducationAll:", err);
        return failedResult(err, "Failed to fetch Education");
      });
  },

  getEducationById(id: string | number) {
    return apiServices
      .get(`education/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getEducationById:", err);
        return failedResult(err, "Failed to fetch Education");
      });
  },

  createEducation(payload: CreateEducationPayload) {
    return apiServices
      .post(`education`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error createEducation:", err);
        return failedResult(err, "Failed to create Education");
      });
  },

  updateEducation(id: string | number, payload: UpdateEducationPayload) {
    return apiServices
      .put(`education/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error updateEducation:", err);
        return failedResult(err, "Failed to update Education");
      });
  },

  patchEducationIsActive(id: string | number, is_active: boolean) {
    return apiServices
      .patch(
        `education/${id}/is-active`,
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
        console.log("Error patchEducationIsActive:", err);
        return failedResult(err, "Failed to update Education status");
      });
  },

  softDeleteEducation(id: string | number) {
    return apiServices
      .delete(`education/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error softDeleteEducation:", err);
        return failedResult(err, "Failed to delete Education");
      });
  },

  hardDeleteEducation(id: string | number) {
    return apiServices
      .delete(`education/${id}/hard`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error hardDeleteEducation:", err);
        return failedResult(err, "Failed to permanently delete Education");
      });
  },
};

export default educationAPI;
