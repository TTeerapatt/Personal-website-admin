import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type MediaType = "image" | "video" | "icon";

export type HomeBannerItem = {
  id: number;
  name: string;
  media_type: MediaType;
  url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateHomeBannerPayload = {
  name: string;
  media_type: MediaType;
  url: string;
  display_order?: number;
  is_active?: boolean;
};

export type UpdateHomeBannerPayload = {
  name?: string;
  media_type?: MediaType;
  url?: string;
  display_order?: number;
  is_active?: boolean;
};

export type HomeBannerListParams = {
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

const homeBannerAPI = {
  getHomeBannerAll(params?: HomeBannerListParams) {
    return apiServices
      .get(`home-banners`, {
        params,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getHomeBannerAll:", err);
        return failedResult(err, "Failed to fetch Home Banners");
      });
  },

  getHomeBannerById(id: string | number) {
    return apiServices
      .get(`home-banners/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getHomeBannerById:", err);
        return failedResult(err, "Failed to fetch Home Banner");
      });
  },

  createHomeBanner(payload: CreateHomeBannerPayload) {
    return apiServices
      .post(`home-banners`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error createHomeBanner:", err);
        return failedResult(err, "Failed to create Home Banner");
      });
  },

  updateHomeBanner(id: string | number, payload: UpdateHomeBannerPayload) {
    return apiServices
      .put(`home-banners/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error updateHomeBanner:", err);
        return failedResult(err, "Failed to update Home Banner");
      });
  },

  patchHomeBannerIsActive(id: string | number, is_active: boolean) {
    return apiServices
      .patch(
        `home-banners/${id}/is-active`,
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
        console.log("Error patchHomeBannerIsActive:", err);
        return failedResult(err, "Failed to update Home Banner status");
      });
  },

  softDeleteHomeBanner(id: string | number) {
    return apiServices
      .delete(`home-banners/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error softDeleteHomeBanner:", err);
        return failedResult(err, "Failed to delete Home Banner");
      });
  },

  hardDeleteHomeBanner(id: string | number) {
    return apiServices
      .delete(`home-banners/${id}/hard`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error hardDeleteHomeBanner:", err);
        return failedResult(err, "Failed to permanently delete Home Banner");
      });
  },
};

export default homeBannerAPI;
