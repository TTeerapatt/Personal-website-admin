import apiServices from "../apiServices";
import { validateOrThrowApiResponse } from "../response-validator";

export type JenkinsJobStatus =
  | "success"
  | "failed"
  | "unstable"
  | "running"
  | "aborted"
  | "not_built"
  | "disabled"
  | "unknown";

export type CiCdJobItem = {
  name: string;
  url: string;
  color: string;
  status: JenkinsJobStatus;
};

export type CiCdStageItem = {
  id: string;
  name: string;
  status: string;
  durationMillis: number | null;
};

export type CiCdBuildItem = {
  number: number;
  url: string;
  result: string | null;
  status: JenkinsJobStatus;
  building: boolean;
};

export type CiCdJobDetail = {
  name: string;
  url: string;
  color: string;
  status: JenkinsJobStatus;
  healthScore: number | null;
  lastBuildNumber: number | null;
  selectedBuildNumber: number | null;
  builds: CiCdBuildItem[];
  stages: CiCdStageItem[];
  stagesMessage?: string;
};

export type CiCdBuildStages = {
  jobName: string;
  buildNumber: number;
  stages: CiCdStageItem[];
  stagesMessage?: string;
};

export type CiCdStageLog = {
  jobName: string;
  buildNumber: number;
  stageId: string;
  text: string;
  hasMore: boolean;
  consoleUrl: string | null;
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

const ciCdAPI = {
  getJobs() {
    return apiServices
      .get(`ci-cd/jobs`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getJobs:", err);
        return failedResult(err, "Failed to fetch CI-CD jobs");
      });
  },

  getJobByName(jobName: string, buildNumber?: number) {
    return apiServices
      .get(`ci-cd/jobs/${encodeURIComponent(jobName)}`, {
        params:
          buildNumber != null
            ? {
                buildNumber,
              }
            : undefined,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getJobByName:", err);
        return failedResult(err, "Failed to fetch CI-CD job detail");
      });
  },

  getBuildStages(jobName: string, buildNumber: number) {
    return apiServices
      .get(
        `ci-cd/jobs/${encodeURIComponent(jobName)}/builds/${buildNumber}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getBuildStages:", err);
        return failedResult(err, "Failed to fetch build stages");
      });
  },

  getStageLog(jobName: string, buildNumber: number, stageId: string) {
    return apiServices
      .get(
        `ci-cd/jobs/${encodeURIComponent(jobName)}/builds/${buildNumber}/stages/${encodeURIComponent(stageId)}/log`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      )
      .then((res) => validateOrThrowApiResponse(res))
      .catch((err) => {
        console.log("Error getStageLog:", err);
        return failedResult(err, "Failed to fetch stage log");
      });
  },
};

export default ciCdAPI;
