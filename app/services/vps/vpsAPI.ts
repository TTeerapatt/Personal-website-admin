import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type VpsIpAddress = {
  id: number | null;
  address: string;
  ptr: string | null;
};

export type VpsTemplate = {
  id: number | null;
  name: string | null;
  description: string | null;
};

export type VpsVirtualMachine = {
  id: number;
  hostname: string;
  state: string;
  plan: string | null;
  cpus: number | null;
  memory_mb: number | null;
  disk_mb: number | null;
  bandwidth_mb: number | null;
  data_center_id: number | null;
  firewall_group_id: number | null;
  subscription_id: string | null;
  actions_lock: string | null;
  ns1: string | null;
  ns2: string | null;
  ipv4: VpsIpAddress[];
  ipv6: VpsIpAddress[];
  template: VpsTemplate | null;
  created_at: string | null;
};

export type VpsMetricSeries = {
  unit: string | null;
  points: Array<{ timestamp: number; value: number }>;
  latest: number | null;
};

export type VpsMetrics = {
  cpu_usage: VpsMetricSeries | null;
  ram_usage: VpsMetricSeries | null;
  disk_space: VpsMetricSeries | null;
  outgoing_traffic: VpsMetricSeries | null;
  incoming_traffic: VpsMetricSeries | null;
  uptime: VpsMetricSeries | null;
};

export type VpsPowerAction = "start" | "stop" | "restart";

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

const vpsAPI = {
  getVpsAll() {
    return apiServices
      .get(`vps`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getVpsAll:", err);
        return failedResult(err, "Failed to fetch VPS list");
      });
  },

  getVpsById(id: string | number) {
    return apiServices
      .get(`vps/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getVpsById:", err);
        return failedResult(err, "Failed to fetch VPS detail");
      });
  },

  getVpsMetrics(
    id: string | number,
    params?: { date_from?: string; date_to?: string }
  ) {
    return apiServices
      .get(`vps/${id}/metrics`, {
        params,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getVpsMetrics:", err);
        return failedResult(err, "Failed to fetch VPS metrics");
      });
  },

  powerAction(id: string | number, action: VpsPowerAction) {
    return apiServices
      .post(
        `vps/${id}/${action}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error powerAction:", err);
        return failedResult(err, `Failed to ${action} VPS`);
      });
  },
};

export default vpsAPI;
