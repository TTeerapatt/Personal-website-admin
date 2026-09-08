import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type MediaType = "image" | "video";

export type ExperienceItem = {
  id: number;
  name_th: string;
  name_en: string;
  description_th: string | null;
  description_en: string | null;
  position: string;
  start_date: string;
  end_date: string | null;
  media_type: MediaType | null;
  url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateExperiencePayload = {
  name_th: string;
  name_en: string;
  description_th?: string | null;
  description_en?: string | null;
  position: string;
  start_date: string;
  end_date?: string | null;
  media_type?: MediaType | null;
  url?: string | null;
  is_active?: boolean;
};

export type UpdateExperiencePayload = {
  name_th?: string;
  name_en?: string;
  description_th?: string | null;
  description_en?: string | null;
  position?: string;
  start_date?: string;
  end_date?: string | null;
  media_type?: MediaType | null;
  url?: string | null;
  is_active?: boolean;
};

export type ExperienceListParams = {
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

const experienceAPI = {
  getExperienceAll(params?: ExperienceListParams) {
    return apiServices
      .get(`experiences`, {
        params,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getExperienceAll:", err);
        return failedResult(err, "Failed to fetch Experiences");
      });
  },

  getExperienceById(id: string | number) {
    return apiServices
      .get(`experiences/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getExperienceById:", err);
        return failedResult(err, "Failed to fetch Experience");
      });
  },

  createExperience(payload: CreateExperiencePayload) {
    return apiServices
      .post(`experiences`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error createExperience:", err);
        return failedResult(err, "Failed to create Experience");
      });
  },

  updateExperience(id: string | number, payload: UpdateExperiencePayload) {
    return apiServices
      .put(`experiences/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error updateExperience:", err);
        return failedResult(err, "Failed to update Experience");
      });
  },

  patchExperienceIsActive(id: string | number, is_active: boolean) {
    return apiServices
      .patch(
        `experiences/${id}/is-active`,
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
        console.log("Error patchExperienceIsActive:", err);
        return failedResult(err, "Failed to update Experience status");
      });
  },

  softDeleteExperience(id: string | number) {
    return apiServices
      .delete(`experiences/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error softDeleteExperience:", err);
        return failedResult(err, "Failed to delete Experience");
      });
  },

  hardDeleteExperience(id: string | number) {
    return apiServices
      .delete(`experiences/${id}/hard`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error hardDeleteExperience:", err);
        return failedResult(err, "Failed to permanently delete Experience");
      });
  },
};

export default experienceAPI;
