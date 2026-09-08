import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type SkillMediaType = "image";

export type SkillItem = {
  id: number;
  name: string;
  media_type: SkillMediaType | string;
  url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateSkillPayload = {
  name: string;
  media_type?: SkillMediaType;
  url: string;
  is_active?: boolean;
};

export type UpdateSkillPayload = {
  name?: string;
  media_type?: SkillMediaType;
  url?: string;
  display_order?: number;
  is_active?: boolean;
};

export type SkillListParams = {
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

  reorderSkills(ordered_ids: number[]) {
    return apiServices
      .put(
        `skills/reorder`,
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
        console.log("Error reorderSkills:", err);
        return failedResult(err, "Failed to reorder Skills");
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

  uploadMediaFile(file: File, folder = "skills") {
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

export default skillAPI;
