import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type MediaType = "image";

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
  display_order: number;
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

export type UploadFileResult = {
  url: string;
  path: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  max_size: number;
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

  reorderExperiences(ordered_ids: number[]) {
    return apiServices
      .put(
        `experiences/reorder`,
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
        console.log("Error reorderExperiences:", err);
        return failedResult(err, "Failed to reorder Experiences");
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

  uploadMediaFile(file: File, folder = "experiences") {
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

export default experienceAPI;
