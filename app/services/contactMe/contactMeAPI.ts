import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type ContactMe = {
  id: number;
  name_th: string;
  name_en: string;
  phone: string | null;
  email: string;
  github_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UpdateContactMePayload = {
  name_th: string;
  name_en: string;
  phone: string | null;
  email: string;
  github_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  is_active: boolean;
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

const contactMeAPI = {
  getContactMe() {
    return apiServices
      .get(`contact-me`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getContactMe:", err);
        return failedResult(err, "Failed to fetch Contact Me");
      });
  },

  updateContactMe(payload: UpdateContactMePayload) {
    return apiServices
      .put(`contact-me`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error updateContactMe:", err);
        return failedResult(err, "Failed to update Contact Me");
      });
  },
};

export default contactMeAPI;
