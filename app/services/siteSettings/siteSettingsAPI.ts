import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type SiteSettings = {
  id: number;
  show_banners: boolean;
  show_skills: boolean;
  show_projects: boolean;
  show_experiences: boolean;
  show_education: boolean;
  created_at: string;
  updated_at: string;
};

export type UpdateSiteSettingsPayload = {
  show_banners: boolean;
  show_skills: boolean;
  show_projects: boolean;
  show_experiences: boolean;
  show_education: boolean;
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

const siteSettingsAPI = {
  getSiteSettings() {
    return apiServices
      .get(`site-settings`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getSiteSettings:", err);
        return failedResult(err, "Failed to fetch Site Settings");
      });
  },

  updateSiteSettings(payload: UpdateSiteSettingsPayload) {
    return apiServices
      .put(`site-settings`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error updateSiteSettings:", err);
        return failedResult(err, "Failed to update Site Settings");
      });
  },
};

export default siteSettingsAPI;
