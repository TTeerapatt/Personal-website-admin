import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type AdminItem = {
  id: number;
  email: string;
  display_name: string;
  role: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminPermissionInput = {
  tab_code: string;
  action_codes: string[];
};

export type CreateAdminPayload = {
  email: string;
  password: string;
  display_name: string;
  role?: string;
  permissions?: AdminPermissionInput[];
};

export type UpdateAdminPayload = {
  email?: string;
  password?: string;
  display_name?: string;
  role?: string;
  permissions?: AdminPermissionInput[];
};

export type AdminPermissionTab = {
  code: string;
  name: string;
  actions: Record<string, boolean>;
};

export type AdminPermissionMenu = {
  code: string;
  name: string;
  tabs: AdminPermissionTab[];
};

export type AdminPermissionsResponse = {
  admin: AdminItem;
  menu: AdminPermissionMenu[];
};

const adminAPI = {
  getAdminAll() {
    return apiServices
      .get(`admins`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getAdminAll:", err);
        return {
          status: "failed",
          errMessage:
            err?.message ||
            err?.errMessage ||
            (typeof err === "string" ? err : null) ||
            "Failed to fetch admins",
          error: err,
        };
      });
  },

  getAdminById(id: string | number) {
    return apiServices
      .get(`admins/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getAdminById:", err);
        return {
          status: "failed",
          errMessage:
            err?.message ||
            err?.errMessage ||
            (typeof err === "string" ? err : null) ||
            "Failed to fetch admins",
          error: err,
        };
      });
  },

  getAdminByIdPermission(id: string | number) {
    return apiServices
      .get(`admins/${id}/permissions`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getAdminByIdPermission:", err);
        return {
          status: "failed",
          errMessage:
            err?.message ||
            err?.errMessage ||
            (typeof err === "string" ? err : null) ||
            "Failed to fetch admin permissions",
          error: err,
        };
      });
  },

  createAdmin(payload: CreateAdminPayload) {
    return apiServices
      .post(`admins`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error createAdmin:", err);
        return {
          status: "failed",
          errMessage:
            err?.message ||
            err?.errMessage ||
            (typeof err === "string" ? err : null) ||
            "Failed to create admin",
          error: err,
        };
      });
  },

  updateAdmin(id: string | number, payload: UpdateAdminPayload) {
    return apiServices
      .put(`admins/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error updateAdmin:", err);
        return {
          status: "failed",
          errMessage:
            err?.message ||
            err?.errMessage ||
            (typeof err === "string" ? err : null) ||
            "Failed to update admin",
          error: err,
        };
      });
  },

  softDeleteAdmin(id: string | number) {
    return apiServices
      .delete(`admins/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error softDeleteAdmin:", err);
        return {
          status: "failed",
          errMessage:
            err?.message ||
            err?.errMessage ||
            (typeof err === "string" ? err : null) ||
            "Failed to delete admin",
          error: err,
        };
      });
  },

  hardDeleteAdmin(id: string | number) {
    return apiServices
      .delete(`admins/${id}/hard`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error hardDeleteAdmin:", err);
        return {
          status: "failed",
          errMessage:
            err?.message ||
            err?.errMessage ||
            (typeof err === "string" ? err : null) ||
            "Failed to permanently delete admin",
          error: err,
        };
      });
  },
};

export default adminAPI;
