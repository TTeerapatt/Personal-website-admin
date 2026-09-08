"use client";

import { IoCodeSlashOutline } from "react-icons/io5";

export type LoadingProps = {
  message?: string;
  variant?: "fullscreen" | "overlay" | "inline" | "page";
  className?: string;
};

export function LoadingDots({
  className = "text-[var(--text-primary)]",
}: {
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"
          style={{ animationDelay: `${dot * 140 - 280}ms` }}
        />
      ))}
    </span>
  );
}

function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass =
    size === "sm"
      ? "h-10 w-10"
      : size === "lg"
        ? "h-20 w-20"
        : "h-14 w-14";
  const iconClass =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";

  return (
    <div className={`relative ${sizeClass}`}>
      <div className="absolute inset-0 rounded-full border-[3px] border-[var(--border)]" />
      <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[var(--brand-primary)] border-r-[var(--brand-primary)]" />
      <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-[var(--surface)] shadow-inner">
        <IoCodeSlashOutline
          className={`${iconClass} text-[var(--text-primary)] animate-pulse`}
        />
      </div>
    </div>
  );
}

export default function Loading({
  message = "Loading...",
  variant = "inline",
  className = "",
}: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center gap-3 text-center">
      <LoadingSpinner size={variant === "inline" ? "sm" : "md"} />
      {message ? (
        <p className="max-w-[240px] text-[14px] font-medium leading-snug text-[var(--text-secondary)]">
          {message}
        </p>
      ) : null}
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--canvas)]/95 backdrop-blur-sm ${className}`}
      >
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] px-10 py-8 shadow-md">
          {content}
        </div>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div
        className={`absolute inset-0 z-40 flex items-center justify-center bg-[var(--surface)]/75 backdrop-blur-[2px] ${className}`}
      >
        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-8 py-7 shadow-md">
          {content}
        </div>
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div
        className={`flex min-h-[280px] flex-1 items-center justify-center px-6 py-10 ${className}`}
      >
        {content}
      </div>
    );
  }

  return <div className={`flex items-center justify-center ${className}`}>{content}</div>;
}

export { LoadingSpinner };
