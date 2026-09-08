"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiCode, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { MdCloud } from "react-icons/md";
import authAPI from "@/app/services/auth/authAPI";
import menuAPI from "@/app/services/menu/menuAPI";
import {
  ADMIN_PROFILE_KEY,
  ADMIN_TOKEN_KEY,
  clearAdminSession,
  type StoredMenuAll,
  type StoredPermissionMenu,
} from "@/app/lib/adminStorage";
import { popup } from "@/app/ui/popUp"
import { MdAdminPanelSettings } from "react-icons/md";;

type LoginApiResult =
  | {
      success?: boolean;
      data?: {
        token?: string;
        admin?: {
          id: string | number;
          email: string;
          display_name: string;
          role: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

type AuthMeApiResult =
  | {
      success?: boolean;
      data?: {
        admin?: {
          id: string | number;
          email: string;
          display_name: string;
          role: string;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        menu?: StoredPermissionMenu[];
      };
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

type MenuAllApiResult =
  | {
      success?: boolean;
      data?: StoredMenuAll;
      status?: string;
      errMessage?: string;
      message?: string;
    }
  | null
  | undefined;

function localizeLoginError(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (normalized === "invalid email or password") {
    return "Invalid email or password";
  }
  return message;
}

function getErrorMessage(result: LoginApiResult, fallback: string): string {
  if (!result) return fallback;

  const raw =
    (typeof result.errMessage === "string" && result.errMessage.trim()) ||
    (typeof result.message === "string" && result.message.trim()) ||
    "";

  if (raw) return localizeLoginError(raw);
  return fallback;
}

function isFailedResult(
  result: { status?: string; success?: boolean } | null | undefined
): boolean {
  return !result || result.status === "failed" || result.success === false;
}

export default function LoginMain() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      await popup.warning(
        "Incomplete information",
        "Please enter email and password"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result = (await authAPI.login(
        trimmedEmail,
        password
      )) as LoginApiResult;

      if (!result || result.status === "failed" || !result.success) {
        await popup.error(
          "Sign in failed",
          getErrorMessage(
            result,
            "Sign in failed. Please check your credentials"
          )
        );
        return;
      }

      const token = result.data?.token;
      const admin = result.data?.admin;
      if (!token) {
        await popup.error(
          "Sign in failed",
          "No token received from server"
        );
        return;
      }

      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      if (admin) {
        localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(admin));
      }

      // Fetch permissions + menu master right after login for role-based UI rendering.
      const [meResult, menuResult] = (await Promise.all([
        authAPI.getMe(),
        menuAPI.getMenuAll(),
      ])) as [AuthMeApiResult, MenuAllApiResult];

      if (isFailedResult(meResult) || isFailedResult(menuResult)) {
        const message = getErrorMessage(
          meResult as LoginApiResult,
          "Unable to fetch permissions"
        );
        clearAdminSession();
        await popup.error("Sign in failed", localizeLoginError(message));
        return;
      }

      const mePayload = meResult?.data;
      const menuAllPayload = menuResult?.data;
      if (!mePayload?.menu || !menuAllPayload?.labels || !menuAllPayload?.tabs) {
        clearAdminSession();
        await popup.error(
          "Sign in failed",
          "Incomplete user permission data from server"
        );
        return;
      }

      if (mePayload.admin) {
        localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(mePayload.admin));
      }
      // permission_menu + menu_all reload in AdminSessionProvider (memory) after entering admin

      // Wait until success popup closes (timer bar finishes or user clicks OK), then redirect
      await popup.success(
        "Signed in successfully",
        "Welcome to the admin portal"
      );
      router.push("/");
    } catch (err: unknown) {
      const raw =
        err instanceof Error
          ? err.message || "Connection error"
          : "Connection error";

      await popup.error("Sign in failed", localizeLoginError(raw));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--surface-raised)] px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="flex min-h-[700px] w-full max-w-[980px] overflow-hidden rounded-[32px] border border-white/10 bg-[var(--surface)] shadow-[0_20px_60px_rgba(36,46,66,0.28)]">
        {/* Left brand panel */}
        <div
          className="relative hidden w-[40%] flex-col items-center justify-between border-r border-white/10 bg-[var(--surface-raised)] px-8 pb-10 pt-12 md:flex"
        >
          <div className="flex flex-col items-center gap-4 text-white">
            <div className="flex h-[112px] w-[112px] items-center justify-center rounded-[28px] bg-[var(--surface)] shadow-md">
              <MdAdminPanelSettings className="h-16 w-16 text-[var(--text-primary)]" />
            </div>
            <div className="text-center">
              <p className="text-[24px] font-bold uppercase tracking-[0.18em]">
                Nexus
              </p>
              <p className="mt-2 text-[13px] font-medium text-white/70">
                Server management system
              </p>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-white/15 bg-[var(--surface)]/10 px-5 py-5 text-center text-white">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--text-primary)] shadow-sm">
              <FiCode className="h-4 w-4" />
            </div>
            <p className="mt-3 text-[12px] font-medium text-white/65">
              Nexus system was created by
            </p>
            <p className="mt-1 text-[15px] font-semibold tracking-wide">
              Teerapat Sommaloun
            </p>
            <a
              href="mailto:rznot778@gmail.com"
              className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-white/70 transition hover:text-white hover:underline"
            >
              <FiMail className="h-3.5 w-3.5" />
              rznot778@gmail.com
            </a>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex w-full flex-col items-center justify-center px-8 py-12 sm:px-12 md:w-[60%] md:px-16 md:py-14">
          <div className="w-full max-w-[430px]">
            <div className="mb-8 flex justify-center md:hidden">
              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-2xl bg-[var(--surface-raised)] shadow-md">
                <MdCloud className="h-10 w-10 text-white" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Nexus admin
              </p>
              <h1 className="mt-2 text-center text-[30px] font-bold leading-tight text-[var(--text-primary)] sm:text-[34px]">
                Welcome back
              </h1>
              <p className="mt-3 text-[14px] text-[var(--text-secondary)]">
                Sign in to continue to your workspace
              </p>
            </div>

            <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[14px] font-semibold text-[var(--text-primary)]"
                >
                  Email address
                </label>
                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nexus.com"
                    className="h-12 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 pl-11 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-[14px] font-semibold text-[var(--text-primary)]"
                >
                  Password
                </label>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 pl-11 pr-11 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 z-10 flex items-center pr-3.5 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5" aria-hidden />
                    ) : (
                      <FiEye className="h-5 w-5" aria-hidden />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      popup.info(
                        "Forgot password",
                        "Please contact the owner to reset your password"
                      )
                    }
                    className="cursor-pointer text-[13px] font-medium text-[var(--text-primary)] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--brand-primary)] text-[15px] font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
