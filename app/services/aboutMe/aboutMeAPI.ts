import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type AboutMe = {
  id: number;
  title_th: string;
  title_en: string;
  text_animation_th: string;
  text_animation_en: string;
  description_th: string | null;
  description_en: string | null;
  image_url: string | null;
  github_url: string | null;
  resume_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UpdateAboutMePayload = {
  title_th: string;
  title_en: string;
  text_animation_th: string;
  text_animation_en: string;
  description_th: string | null;
  description_en: string | null;
  image_url: string | null;
  github_url: string | null;
  resume_url: string | null;
  is_active: boolean;
};

export type UploadFileResult = {
  success?: boolean;
  data?: { url?: string; path?: string; folder?: string };
  status?: string;
  errMessage?: string;
  message?: string;
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

const aboutMeAPI = {
  getAboutMe() {
    return apiServices
      .get(`about-me`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getAboutMe:", err);
        return failedResult(err, "Failed to fetch About Me");
      });
  },

  updateAboutMe(payload: UpdateAboutMePayload) {
    return apiServices
      .put(`about-me`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error updateAboutMe:", err);
        return failedResult(err, "Failed to update About Me");
      });
  },

  uploadMediaFile(file: File, folder = "about-me") {
    const formData = new FormData();
    formData.append("file", file);

    return apiServices
      .post(`upload`, formData, {
        params: { folder },
        headers: {
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res) as UploadFileResult)
      .catch((err) => {
        console.log("Error uploadAboutMeMedia:", err);
        return failedResult(err, "Failed to upload file") as UploadFileResult & {
          status: "failed";
        };
      });
  },
};

export default aboutMeAPI;
