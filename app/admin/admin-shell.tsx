"use client";

import type { SafeAdmin } from "@/lib/auth";
import { formatCenter, formatRole } from "@/lib/admin-constants";
import { ClipboardList, LogOut, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminSection = "registrations" | "users";

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
      href: "/admin/users",
      label: "Users",
      icon: Users,
      section: "users" as const,
      visible: admin.role === "SUPER_ADMIN",
    },
  ].filter((item) => item.visible);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    window.location.assign("/admin/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">MPVTL</p>
            <p className="mt-1 text-lg font-bold text-navy-950">Admin Portal</p>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = active === item.section;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    selected
                      ? "bg-brand-50 text-brand-800"
                      : "text-slate-700 hover:bg-slate-100 hover:text-navy-950"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <p className="text-sm font-bold text-navy-950">{admin.name}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{formatRole(admin.role)}</p>
            {admin.center && <p className="mt-1 text-xs text-slate-500">{formatCenter(admin.center)}</p>}
            <button
              type="button"
              onClick={logout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 lg:hidden">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">MPVTL</p>
                <p className="text-base font-bold text-navy-950">Admin Portal</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-navy-950">{title}</h1>
                {subtitle && <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>}
              </div>
              <div className="flex flex-wrap gap-2 lg:hidden">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const selected = active === item.section;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
                        selected ? "bg-brand-700 text-white" : "border border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </main>
  );
}
