"use client";

import { useState } from "react";
import {
  FiActivity,
  FiChevronDown,
  FiExternalLink,
  FiHeart,
  FiLoader,
} from "react-icons/fi";
import { GoWorkflow } from "react-icons/go";
import { getJenkinsStatusTone } from "@/app/lib/uiTone";
import ciCdAPI, {
  type CiCdBuildItem,
  type CiCdBuildStages,
  type CiCdJobDetail,
  type CiCdJobItem,
  type CiCdStageItem,
  type CiCdStageLog,
  type JenkinsJobStatus,
} from "@/app/services/ciCd/ciCdAPI";
import { popup } from "@/app/ui/popUp";
import CiCdPipeline from "./ciCdPipeline";
import CiCdStageLogPanel from "./ciCdStageLogPanel";

function statusBadgeClass(status: JenkinsJobStatus): string {
  return getJenkinsStatusTone(status);
}

function isRunningStatus(status: JenkinsJobStatus): boolean {
  return status === "running";
}

function statusDotClass(status: JenkinsJobStatus): string {
  switch (status) {
    case "success":
      return "bg-[#34d399] shadow-[0_0_0_3px_rgba(52,211,153,0.22)]";
    case "failed":
      return "bg-[#f87171] shadow-[0_0_0_3px_rgba(248,113,113,0.22)]";
    case "unstable":
      return "bg-[#fbbf24] shadow-[0_0_0_3px_rgba(251,191,36,0.22)]";
    case "running":
      return "bg-[#5b86ff] animate-pulse shadow-[0_0_0_3px_rgba(91,134,255,0.22)]";
    default:
      return "bg-[#94a3b8] shadow-[0_0_0_3px_rgba(148,163,184,0.18)]";
  }
}

function statusLabel(status: JenkinsJobStatus): string {
  switch (status) {
    case "success":
      return "Success";
    case "failed":
      return "Failed";
    case "unstable":
      return "Unstable";
    case "running":
      return "Running";
    case "aborted":
      return "Aborted";
    case "disabled":
      return "Disabled";
    case "not_built":
      return "Not built";
    default:
      return "Unknown";
  }
}

function healthBarClass(score: number): string {
  if (score >= 80) return "bg-[#34d399]";
  if (score >= 50) return "bg-[#fbbf24]";
  return "bg-[#f87171]";
}

function buildPillTextClass(status: JenkinsJobStatus): string {
  switch (status) {
    case "success":
      return "text-[#6ee7b7]";
    case "failed":
      return "text-[#fca5a5]";
    case "unstable":
      return "text-[#fcd34d]";
    case "running":
      return "text-[#b4c8ff]";
    default:
      return "text-[var(--text-secondary)]";
  }
}

function buildPillClass(status: JenkinsJobStatus, selected: boolean): string {
  const text = buildPillTextClass(status);

  if (selected) {
    return `bg-[var(--surface-soft)] ${text} ring-2 ring-[var(--brand-primary)]/70`;
  }

  switch (status) {
    case "success":
      return `${text} bg-[rgba(52,211,153,0.10)] ring-[rgba(52,211,153,0.32)] hover:bg-[rgba(52,211,153,0.16)]`;
    case "failed":
      return `${text} bg-[rgba(248,113,113,0.10)] ring-[rgba(248,113,113,0.32)] hover:bg-[rgba(248,113,113,0.16)]`;
    case "unstable":
      return `${text} bg-[rgba(251,191,36,0.10)] ring-[rgba(251,191,36,0.32)] hover:bg-[rgba(251,191,36,0.16)]`;
    case "running":
      return `${text} bg-[rgba(91,134,255,0.12)] ring-[rgba(91,134,255,0.34)] hover:bg-[rgba(91,134,255,0.18)]`;
    default:
      return `${text} bg-[var(--surface-raised)] ring-[var(--border)] hover:bg-[var(--surface-soft)]`;
  }
}

type DetailApiResult =
  | {
      success?: boolean;
      data?: CiCdJobDetail;
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

type BuildStagesApiResult =
  | {
      success?: boolean;
      data?: CiCdBuildStages;
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

type StageLogApiResult =
  | {
      success?: boolean;
      data?: CiCdStageLog;
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

type StagesCache = Record<
  number,
  { stages: CiCdStageItem[]; stagesMessage?: string }
>;

type StageLogCache = Record<
  string,
  { text: string; consoleUrl: string | null }
>;

function stageCacheKey(buildNumber: number, stageId: string) {
  return `${buildNumber}:${stageId}`;
}

type CiCdAccordionItemProps = {
  job: CiCdJobItem;
};

export default function CiCdAccordionItem({ job }: CiCdAccordionItemProps) {
  const isRunning = isRunningStatus(job.status);
  const [open, setOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingBuild, setLoadingBuild] = useState(false);
  const [detail, setDetail] = useState<CiCdJobDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedBuildNumber, setSelectedBuildNumber] = useState<number | null>(
    null
  );
  const [pendingBuildNumber, setPendingBuildNumber] = useState<number | null>(
    null
  );
  const [stages, setStages] = useState<CiCdStageItem[]>([]);
  const [stagesMessage, setStagesMessage] = useState<string | undefined>();
  const [stagesCache, setStagesCache] = useState<StagesCache>({});
  const [selectedStage, setSelectedStage] = useState<CiCdStageItem | null>(
    null
  );
  const [loadingStageId, setLoadingStageId] = useState<string | null>(null);
  const [stageLogText, setStageLogText] = useState("");
  const [stageLogError, setStageLogError] = useState<string | undefined>();
  const [stageConsoleUrl, setStageConsoleUrl] = useState<string | null>(null);
  const [stageLogCache, setStageLogCache] = useState<StageLogCache>({});

  const clearStageLog = () => {
    setSelectedStage(null);
    setLoadingStageId(null);
    setStageLogText("");
    setStageLogError(undefined);
    setStageConsoleUrl(null);
  };

  const applyStages = (
    buildNumber: number,
    nextStages: CiCdStageItem[],
    nextMessage?: string
  ) => {
    setSelectedBuildNumber(buildNumber);
    setPendingBuildNumber(null);
    setStages(nextStages);
    setStagesMessage(nextMessage);
    setStagesCache((prev) => ({
      ...prev,
      [buildNumber]: {
        stages: nextStages,
        ...(nextMessage ? { stagesMessage: nextMessage } : {}),
      },
    }));
    clearStageLog();
  };

  const loadDetail = async () => {
    if (loaded || loadingDetail) return;

    setLoadingDetail(true);
    try {
      const result = (await ciCdAPI.getJobByName(job.name)) as DetailApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        const message =
          result?.errMessage ||
          result?.message ||
          "Unable to fetch job pipeline";
        await popup.error("Error", message);
        setDetail(null);
        return;
      }

      const data = result.data ?? null;
      setDetail(data);
      setLoaded(true);

      if (data?.selectedBuildNumber != null) {
        applyStages(
          data.selectedBuildNumber,
          data.stages || [],
          data.stagesMessage
        );
      } else {
        setSelectedBuildNumber(null);
        setPendingBuildNumber(null);
        setStages([]);
        setStagesMessage(data?.stagesMessage);
        clearStageLog();
      }
    } catch {
      await popup.error("Error", "Unable to fetch job pipeline");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectBuild = async (build: CiCdBuildItem) => {
    if (loadingBuild || loadingStageId) return;
    if (
      selectedBuildNumber === build.number &&
      pendingBuildNumber == null
    ) {
      return;
    }

    const cached = stagesCache[build.number];
    if (cached) {
      applyStages(build.number, cached.stages, cached.stagesMessage);
      return;
    }

    setPendingBuildNumber(build.number);
    setLoadingBuild(true);
    clearStageLog();
    try {
      const result = (await ciCdAPI.getBuildStages(
        job.name,
        build.number
      )) as BuildStagesApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        const message =
          result?.errMessage ||
          result?.message ||
          "Unable to fetch build stages";
        setPendingBuildNumber(null);
        await popup.error("Error", message);
        return;
      }

      applyStages(
        build.number,
        result.data?.stages || [],
        result.data?.stagesMessage
      );
    } catch {
      setPendingBuildNumber(null);
      await popup.error("Error", "Unable to fetch build stages");
    } finally {
      setLoadingBuild(false);
    }
  };

  const handleStageClick = async (stage: CiCdStageItem) => {
    if (loadingBuild || loadingStageId) return;
    if (selectedBuildNumber == null) return;

    const stageId = String(stage.id || "").trim();
    if (!stageId) {
      await popup.error("Error", "Stage id is missing");
      return;
    }

    if (selectedStage?.id === stageId && !loadingStageId) {
      clearStageLog();
      return;
    }

    setSelectedStage(stage);
    setStageLogError(undefined);

    const cacheKey = stageCacheKey(selectedBuildNumber, stageId);
    const cached = stageLogCache[cacheKey];
    if (cached) {
      setStageLogText(cached.text);
      setStageConsoleUrl(cached.consoleUrl);
      setLoadingStageId(null);
      return;
    }

    setLoadingStageId(stageId);
    setStageLogText("");
    setStageConsoleUrl(null);

    try {
      const result = (await ciCdAPI.getStageLog(
        job.name,
        selectedBuildNumber,
        stageId
      )) as StageLogApiResult;

      if (!result || result.status === "failed" || result.success === false) {
        const message =
          result?.errMessage ||
          result?.message ||
          "Unable to fetch stage log";
        setStageLogError(message);
        return;
      }

      const text = result.data?.text || "";
      const consoleUrl = result.data?.consoleUrl || null;
      setStageLogText(text);
      setStageConsoleUrl(consoleUrl);
      if (text.trim()) {
        setStageLogCache((prev) => ({
          ...prev,
          [cacheKey]: { text, consoleUrl },
        }));
      }
    } catch {
      setStageLogError("Unable to fetch stage log");
    } finally {
      setLoadingStageId(null);
    }
  };

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadDetail();
    }
  };

  const builds: CiCdBuildItem[] = detail?.builds || [];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-[var(--surface)] transition duration-300 ${
        isRunning ? "ci-cd-running-card" : ""
      } ${
        open
          ? "border-[var(--border)] shadow-md"
          : "border-[var(--border)] shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:border-[var(--border-strong)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
      }`}
    >
      {isRunning ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl ci-cd-running-border"
        />
      ) : null}
      <button
        type="button"
        onClick={() => void handleToggle()}
        className="flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition hover:bg-[var(--surface)]/80"
        aria-expanded={open}
      >
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--text-primary)]">
          {isRunning ? (
            <span className="absolute inset-0 rounded-2xl border border-[#2563eb]/35 ci-cd-running-icon-ring" />
          ) : null}
          <GoWorkflow className="h-5 w-5" />
          <span
            className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${statusDotClass(job.status)}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
            {job.name}
          </p>
          {job.url ? (
            <p className="mt-0.5 truncate text-[12px] text-[var(--text-muted)]">
              {job.url.replace(/^https?:\/\//, "")}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${statusBadgeClass(job.status)}`}
          >
            {isRunning ? <FiLoader className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            {statusLabel(job.status)}
          </span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--text-secondary)] transition-transform duration-300 ${
              open ? "rotate-180 bg-[var(--surface)] text-[var(--text-primary)]" : ""
            }`}
          >
            <FiChevronDown className="h-4 w-4" />
          </span>
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[var(--border)] bg-[var(--surface)] px-5 py-5">
            {loadingDetail ? (
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)]" />
                <p className="text-[13px] font-medium text-[var(--text-muted)]">
                  Loading pipeline stages…
                </p>
              </div>
            ) : detail ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {detail.healthScore != null ? (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-primary)] ring-1 ring-[var(--border)]">
                      <FiHeart className="h-3.5 w-3.5 text-[#ef4444]" />
                      Health {detail.healthScore}%
                      <span className="ml-1 h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                        <span
                          className={`block h-full rounded-full ${healthBarClass(detail.healthScore)}`}
                          style={{
                            width: `${Math.max(0, Math.min(100, detail.healthScore))}%`,
                          }}
                        />
                      </span>
                    </span>
                  ) : null}

                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-secondary)] ring-1 ring-[var(--border)]">
                    <FiActivity className="h-3.5 w-3.5 text-[var(--text-primary)]" />
                    {stages.length} stages
                    {(pendingBuildNumber ?? selectedBuildNumber) != null
                      ? ` · #${pendingBuildNumber ?? selectedBuildNumber}`
                      : ""}
                  </span>

                  {job.url ? (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold text-[var(--text-primary)] ring-1 ring-[var(--brand-primary)]/15 transition hover:bg-[var(--surface)]"
                    >
                      Open Jenkins
                      <FiExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>

                {builds.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Build history
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {builds.map((build) => {
                        const activeNumber =
                          pendingBuildNumber ?? selectedBuildNumber;
                        const selected = activeNumber === build.number;
                        const buildRunning =
                          build.building || isRunningStatus(build.status);
                        return (
                          <button
                            key={build.number}
                            type="button"
                            onClick={() => void handleSelectBuild(build)}
                            disabled={loadingBuild}
                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${buildPillClass(build.status, selected)}`}
                            title={`${statusLabel(build.status)}${build.building ? " (running)" : ""}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                selected
                                  ? "bg-[var(--brand-primary)]"
                                  : statusDotClass(build.status).split(" ")[0]
                              }`}
                            />
                            #{build.number}
                            {buildRunning ? (
                              <FiLoader className="ml-0.5 h-3 w-3 animate-spin" />
                            ) : null}
                            {loadingBuild && pendingBuildNumber === build.number ? (
                              <span className="ml-0.5 h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="relative">
                  <div
                    className={
                      loadingBuild
                        ? "pointer-events-none opacity-40 transition-opacity"
                        : "transition-opacity"
                    }
                  >
                    <CiCdPipeline
                      stages={stages}
                      emptyMessage={stagesMessage}
                      selectedStageId={selectedStage?.id ?? null}
                      loadingStageId={loadingStageId}
                      onStageClick={(stage) => void handleStageClick(stage)}
                    />
                  </div>

                  {loadingBuild ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[var(--surface)]/70 backdrop-blur-[1px]">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface)] px-3 py-2 text-[13px] font-medium text-[var(--text-secondary)] ring-1 ring-[var(--border)]">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)]" />
                        Loading build
                        {pendingBuildNumber != null
                          ? ` #${pendingBuildNumber}`
                          : ""}
                        …
                      </div>
                    </div>
                  ) : null}
                </div>

                {selectedStage ? (
                  <CiCdStageLogPanel
                    stage={selectedStage}
                    buildNumber={selectedBuildNumber}
                    loading={loadingStageId === selectedStage.id}
                    text={stageLogText}
                    errorMessage={stageLogError}
                    consoleUrl={stageConsoleUrl}
                    onClose={clearStageLog}
                  />
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)]/70 px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">
                Unable to load pipeline details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
