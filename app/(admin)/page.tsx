"use client";

import Link from "next/link";
import {
  MdAdminPanelSettings,
  MdFolder,
  MdHistory,
  MdImage,
  MdSchool,
  MdStars,
  MdWork,
} from "react-icons/md";
import { getStoredAdmin } from "@/app/lib/adminStorage";
import { useEffect, useState } from "react";

const LINKS = [
  {
    href: "/home-banners",
    title: "Home Banners",
    desc: "Manage hero media and banners",
    icon: MdImage,
  },
  {
    href: "/skills",
    title: "Skills",
    desc: "Update skills and categories",
    icon: MdStars,
  },
  {
    href: "/projects",
    title: "Projects",
    desc: "Portfolio projects (TH / EN)",
    icon: MdFolder,
  },
  {
    href: "/experiences",
    title: "Experiences",
    desc: "Work history and roles",
    icon: MdWork,
  },
  {
    href: "/education",
    title: "Education",
    desc: "Education timeline",
    icon: MdSchool,
  },
  {
    href: "/admins",
    title: "Admins",
    desc: "Manage admin accounts",
    icon: MdAdminPanelSettings,
  },
  {
    href: "/logs",
    title: "Logs",
    desc: "Review admin activity",
    icon: MdHistory,
  },
] as const;

export default function OverviewPage() {
  const [name, setName] = useState("Admin");

  useEffect(() => {
    const admin = getStoredAdmin();
    if (admin?.display_name) setName(admin.display_name);
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Overview
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Welcome, {name}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
          Manage the content that appears on your personal website landing page.
          Content supports Thai and English where applicable.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:border-[var(--brand-primary)]/35 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-[17px] font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]">
                {item.title}
              </h2>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                {item.desc}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
