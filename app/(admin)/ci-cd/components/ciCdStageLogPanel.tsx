"use client";

import { FiExternalLink, FiX } from "react-icons/fi";
import type { CiCdStageItem } from "@/app/services/ciCd/ciCdAPI";

function prettyStageName(name: string): string {
  return name.replace(/^Declarative:\s*/i, "").trim() || name;
}

function htmlLogToPlainText(input: string): string {
  if (!input) return "";
  if (typeof window === "undefined") return input;

  let text = input;
  if (/<\/?[a-z][\s\S]*>/i.test(input)) {
    const withBreaks = input
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\/\s*p\s*>/gi, "\n")
      .replace(/<\/\s*div\s*>/gi, "\n")
      .replace(
        /<span[^>]*style\s*=\s*["'][^"']*display\s*:\s*none[^"']*["'][^>]*>[\s\S]*?<\/span>/gi,
        ""
      );

    const doc = new DOMParser().parseFromString(withBreaks, "text/html");
    text = doc.body.textContent || "";
  }

  return formatLogLinesWithSeparator(
    text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/** Format `03:37:12 message` -> `03:37:12 || message` */
function formatLogLinesWithSeparator(input: string): string {
  return input
    .split("\n")
    .map((line) => {
      const trimmed = line.trimEnd();
      if (!trimmed) return trimmed;

      if (/^\d{1,2}:\d{2}:\d{2}\s+\|\|/.test(trimmed)) {
        return trimmed.replace(
          /^(\d{1,2}:\d{2}:\d{2})\s+\|\|\s*/,
          "$1     ||     "
        );
      }

      const matched = trimmed.match(/^(\d{1,2}:\d{2}:\d{2})\s+(.*)$/);
      if (!matched) return trimmed;

      const [, time, message] = matched;
      if (!message.trim()) return time;
      return `${time}     ||     ${message.trim()}`;
    })
    .join("\n");
}

type CiCdStageLogPanelProps = {
  stage: CiCdStageItem | null;
  buildNumber: number | null;
  loading: boolean;
  text: string;
  errorMessage?: string;
  consoleUrl?: string | null;
  onClose: () => void;
};

export default function CiCdStageLogPanel({
  stage,
  buildNumber,
  loading,
  text,
  errorMessage,
  consoleUrl,
  onClose,
}: CiCdStageLogPanelProps) {
  if (!stage) return null;

  const title = prettyStageName(stage.name);
  const plainText = htmlLogToPlainText(text);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0f172a]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white">
            {title}
            {buildNumber != null ? (
              <span className="ml-2 text-[12px] font-medium text-white/55">
                Build #{buildNumber}
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-white/45">
            {stage.status}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {consoleUrl ? (
            <a
              href={consoleUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-[#93c5fd] transition hover:bg-[var(--surface)]/10"
            >
              Jenkins
              <FiExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white/70 transition hover:bg-[var(--surface)]/10 hover:text-white"
            aria-label="Close stage log"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative min-h-[180px]">
        <pre className="max-h-[320px] overflow-auto px-4 py-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-[#e2e8f0]">
          {plainText || (loading ? "" : "No log output for this stage.")}
        </pre>

        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f172a]/75 backdrop-blur-[1px]">
            <div className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-3 py-2 text-[13px] font-medium text-[#cbd5e1] ring-1 ring-white/10">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-primary)]/30 border-t-[#93c5fd]" />
              Loading stage log…
            </div>
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f172a]/80 px-4">
            <p className="max-w-md text-center text-[13px] text-[#fecaca]">
              {errorMessage}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
