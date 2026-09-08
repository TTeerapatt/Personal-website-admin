"use client";

import Swal, { type SweetAlertIcon, type SweetAlertResult } from "sweetalert2";

const BLUE = "#5b86ff";
const TEXT = "#f4f7fb";
const CANCEL_BG = "#22324a";

const LAYOUT = {
  width: "360px",
  padding: "1.75rem 1.5rem 1.5rem",
  background: "#17243a",
  color: TEXT,
  iconColor: BLUE,
  backdrop: `
    rgba(15, 23, 42, 0.42)
    left top
    no-repeat
  `,
} as const;

type StatusPopupOptions = {
  title?: string;
  text?: string;
  icon?: SweetAlertIcon;
  confirmText?: string;
  timer?: number;
  timerProgressBar?: boolean;
};

type ConfirmPopupOptions = {
  title?: string;
  text?: string;
  icon?: SweetAlertIcon;
  confirmText?: string;
  cancelText?: string;
};

const SUCCESS_TIMER_MS = 1000;

export function showStatusPopup({
  title = "Success",
  text,
  icon = "info",
  confirmText = "OK",
  timer,
  timerProgressBar = false,
}: StatusPopupOptions = {}): Promise<SweetAlertResult> {
  return Swal.fire({
    title,
    text: text || undefined,
    icon,
    showConfirmButton: true,
    showCancelButton: false,
    confirmButtonText: confirmText,
    allowOutsideClick: false,
    allowEscapeKey: true,
    timer,
    timerProgressBar: Boolean(timer) && timerProgressBar,
    width: LAYOUT.width,
    padding: LAYOUT.padding,
    background: LAYOUT.background,
    color: LAYOUT.color,
    iconColor: LAYOUT.iconColor,
    confirmButtonColor: BLUE,
    backdrop: LAYOUT.backdrop,
    customClass: {
      container: "app-swal-container",
      popup: "app-swal-popup",
      title: "app-swal-title",
      htmlContainer: "app-swal-text",
      icon: "app-swal-icon",
      actions: "app-swal-actions app-swal-actions-single",
      confirmButton: "app-swal-confirm-btn",
      timerProgressBar: "app-swal-timer-bar",
    },
  });
}

export async function showConfirmPopup({
  title = "Confirm this action?",
  text,
  icon = "question",
  confirmText = "OK",
  cancelText = "Cancel",
}: ConfirmPopupOptions = {}): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text: text || undefined,
    icon,
    showConfirmButton: true,
    showCancelButton: true,
    reverseButtons: true,
    focusCancel: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    allowOutsideClick: false,
    allowEscapeKey: true,
    width: LAYOUT.width,
    padding: LAYOUT.padding,
    background: LAYOUT.background,
    color: LAYOUT.color,
    iconColor: LAYOUT.iconColor,
    confirmButtonColor: BLUE,
    cancelButtonColor: CANCEL_BG,
    backdrop: LAYOUT.backdrop,
    customClass: {
      container: "app-swal-container",
      popup: "app-swal-popup",
      title: "app-swal-title",
      htmlContainer: "app-swal-text",
      icon: "app-swal-icon",
      actions: "app-swal-actions",
      confirmButton: "app-swal-confirm-btn",
      cancelButton: "app-swal-cancel-btn",
    },
  });

  return result.isConfirmed;
}

export const popup = {
  success: (
    title = "Success",
    text?: string,
    options?: Pick<StatusPopupOptions, "confirmText" | "timer" | "timerProgressBar">
  ) =>
    showStatusPopup({
      title,
      text,
      icon: "success",
      timer: SUCCESS_TIMER_MS,
      timerProgressBar: true,
      ...options,
    }),
  error: (title = "Error", text?: string) =>
    showStatusPopup({ title, text, icon: "error" }),
  warning: (title = "Warning", text?: string) =>
    showStatusPopup({ title, text, icon: "warning" }),
  info: (title = "Info", text?: string) =>
    showStatusPopup({ title, text, icon: "info" }),
  confirm: (options?: ConfirmPopupOptions) => showConfirmPopup(options),
  confirmDelete: (options?: ConfirmPopupOptions) =>
    showConfirmPopup({
      title: "Confirm delete?",
      text: "This action cannot be undone",
      icon: "warning",
      confirmText: "OK",
      cancelText: "Cancel",
      ...options,
    }),
  logout: () =>
    showConfirmPopup({
      title: "Confirm logout",
      text: "Do you want to log out?",
      icon: "question",
      confirmText: "OK",
      cancelText: "Cancel",
    }),
};

/** @deprecated use showStatusPopup or popup.success instead */
export function showAppPopupAnimation(
  options: StatusPopupOptions = {}
): Promise<SweetAlertResult> {
  return showStatusPopup(options);
}

export default popup;
