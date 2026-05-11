import { redirect } from "next/navigation";
import { formatCenter, formatRole } from "@/lib/admin-constants";
import { getCurrentAdmin } from "@/lib/auth";
import AdminShell from "../admin-shell";
import ChangePasswordClient from "../change-password/change-password-client";

export default async function AdminSettingsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.forcePasswordChange) redirect("/admin/change-password");

  return (
    <AdminShell
      admin={admin}
      active="settings"
      title="Settings"
      subtitle="Manage your admin account and password."
    >
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(6,19,33,0.10)]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Account</p>
          <h2 className="mt-2 text-xl font-bold text-navy-950">{admin.name}</h2>
          <p className="mt-1 break-words text-sm text-slate-600">{admin.email}</p>

          <div className="mt-5 grid gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Role</p>
              <p className="mt-1 text-sm font-bold text-navy-950">{formatRole(admin.role)}</p>
            </div>
            {admin.center && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Center</p>
                <p className="mt-1 text-sm font-bold text-navy-950">{formatCenter(admin.center)}</p>
              </div>
            )}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Password</p>
              <p className="mt-1 text-sm font-bold text-navy-950">Self-managed securely</p>
            </div>
          </div>
        </section>

        <ChangePasswordClient forced={false} embedded />
      </div>
    </AdminShell>
  );
}
