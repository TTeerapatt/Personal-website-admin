import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type DomainListItem = {
  id: number | null;
  domain: string;
  type: string | null;
  status: string;
  created_at: string | null;
  expires_at: string | null;
};

export type DomainDetail = {
  domain: string;
  status: string;
  message: string | null;
  is_privacy_protection_allowed: boolean | null;
  is_privacy_protected: boolean | null;
  is_lockable: boolean | null;
  is_locked: boolean | null;
  ns1: string | null;
  ns2: string | null;
  created_at: string | null;
  updated_at: string | null;
  registered_at: string | null;
  expires_at: string | null;
};

export type DnsRecordItem = {
  name: string;
  type: string;
  ttl: number | null;
  content: string;
  is_disabled: boolean;
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

const domainAPI = {
  getDomainsAll() {
    return apiServices
      .get(`domains`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getDomainsAll:", err);
        return failedResult(err, "Failed to fetch domains");
      });
  },

  getDomainByName(domain: string) {
    return apiServices
      .get(`domains/${encodeURIComponent(domain)}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getDomainByName:", err);
        return failedResult(err, "Failed to fetch domain detail");
      });
  },

  getDomainDns(domain: string) {
    return apiServices
      .get(`domains/${encodeURIComponent(domain)}/dns`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getDomainDns:", err);
        return failedResult(err, "Failed to fetch DNS records");
      });
  },
};

export default domainAPI;
