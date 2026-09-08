import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type MediaType = "image" | "video" | "icon";

export type SkillItem = {
  id: number;
  name: string;
  category: string;
  media_type: MediaType;
  url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateSkillPayload = {
  name: string;
  category: string;
  media_type: MediaType;
  url: string;
  display_order?: number;
  is_active?: boolean;
};

export type UpdateSkillPayload = {
  name?: string;
  category?: string;
  media_type?: MediaType;
  url?: string;
  display_order?: number;
  is_active?: boolean;
};

export type SkillListParams = {
  is_active?: boolean;
  category?: string;
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

const skillAPI = {
  getSkillAll(params?: SkillListParams) {
    return apiServices
      .get(`skills`, {
        params,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getSkillAll:", err);
        return failedResult(err, "Failed to fetch Skills");
      });
  },

  getSkillById(id: string | number) {
    return apiServices
      .get(`skills/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getSkillById:", err);
        return failedResult(err, "Failed to fetch Skill");
      });
  },

  createSkill(payload: CreateSkillPayload) {
    return apiServices
      .post(`skills`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error createSkill:", err);
        return failedResult(err, "Failed to create Skill");
      });
  },

  updateSkill(id: string | number, payload: UpdateSkillPayload) {
    return apiServices
      .put(`skills/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error updateSkill:", err);
        return failedResult(err, "Failed to update Skill");
      });
  },

  patchSkillIsActive(id: string | number, is_active: boolean) {
    return apiServices
      .patch(
        `skills/${id}/is-active`,
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
        console.log("Error patchSkillIsActive:", err);
        return failedResult(err, "Failed to update Skill status");
      });
  },

  softDeleteSkill(id: string | number) {
    return apiServices
      .delete(`skills/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error softDeleteSkill:", err);
        return failedResult(err, "Failed to delete Skill");
      });
  },

  hardDeleteSkill(id: string | number) {
    return apiServices
      .delete(`skills/${id}/hard`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error hardDeleteSkill:", err);
        return failedResult(err, "Failed to permanently delete Skill");
      });
  },
};

export default skillAPI;
