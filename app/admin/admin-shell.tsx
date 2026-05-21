"use client";

import type { SafeAdmin } from "@/lib/auth";
import { formatCenter, formatRole } from "@/lib/admin-constants";
import { BarChart3, BookOpenCheck, ClipboardList, Database, HelpCircle, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminSection = "registrations" | "analytics" | "users" | "settings" | "courses" | "questions" | "data-cleanup";

type AdminShellProps = {
  admin: SafeAdmin;
  active: AdminSection;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AdminShell({ admin, active, title, subtitle, children }: AdminShellProps) {
  const navItems = [
    {
      href: "/admin/registrations",
      label: "Registrations",
      icon: ClipboardList,
      section: "registrations" as const,
      visible: true,
    },
    {
      href: "/admin/analytics",
      label: "Analytics",
      icon: BarChart3,
      section: "analytics" as const,
      visible: true,
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
      section: "users" as const,
      visible: admin.role === "SUPER_ADMIN",
    },
    {
      href: "/admin/courses",
      label: "Courses",
      icon: BookOpenCheck,
      section: "courses" as const,
      visible: admin.role === "SUPER_ADMIN",
    },
    {
      href: "/admin/questions",
      label: "Questions",
      icon: HelpCircle,
      section: "questions" as const,
      visible: admin.role === "SUPER_ADMIN",
    },
    {
      href: "/admin/data-cleanup",
      label: "Data Cleanup",
      icon: Database,
      section: "data-cleanup" as const,
      visible: admin.role === "SUPER_ADMIN",
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      section: "settings" as const,
      visible: true,
    },
  ].filter((item) => item.visible);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    window.location.assign("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#f3f5f8] text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-navy-800 bg-navy-950 text-white shadow-[18px_0_60px_rgba(6,19,33,0.22)] xl:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-200">MPVTL</p>
              <p className="mt-1 text-lg font-bold">Admin Portal</p>
              <p className="mt-2 text-xs leading-5 text-slate-300">Registration management</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-3 py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = active === item.section;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    selected
                      ? "bg-brand-700 text-white shadow-[0_16px_40px_rgba(127,29,45,0.28)]"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-bold text-white">{admin.name}</p>
            <p className="mt-1 text-xs font-semibold text-brand-100">{formatRole(admin.role)}</p>
            {admin.center && <p className="mt-1 text-xs text-slate-300">{formatCenter(admin.center)}</p>}
            <button
              type="button"
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-bold text-white hover:bg-white/15"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-[0_16px_45px_rgba(6,19,33,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
            <div className="flex items-center justify-between gap-3 xl:hidden">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 sm:text-xs sm:tracking-[0.18em]">MPVTL</p>
                <p className="text-sm font-bold text-navy-950 sm:text-base">Admin Portal</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>

            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="border-l-4 border-brand-700 pl-3 sm:pl-4">
                <h1 className="text-lg font-semibold leading-tight tracking-tight text-navy-950 sm:text-xl">{title}</h1>
                {subtitle && <p className="mt-1 hidden max-w-3xl text-sm leading-6 text-slate-600 sm:block">{subtitle}</p>}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 xl:hidden">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const selected = active === item.section;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex min-w-[6.75rem] items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] font-semibold sm:min-w-0 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm ${
                        selected ? "bg-brand-700 text-white shadow-[0_14px_35px_rgba(127,29,45,0.22)]" : "border border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      <Icon className="shrink-0" size={13} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
          {children}
        </div>
      </div>
    </main>
  );
}
