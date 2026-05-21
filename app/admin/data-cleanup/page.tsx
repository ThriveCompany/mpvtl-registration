import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import AdminShell from "../admin-shell";
import DataCleanupClient from "./data-cleanup-client";

export default async function DataCleanupPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.forcePasswordChange) redirect("/admin/change-password");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/registrations");

  return (
    <AdminShell
      admin={admin}
      active="data-cleanup"
      title="Data Cleanup"
      subtitle="Find duplicate applicant submissions and safely archive older duplicate records."
    >
      <DataCleanupClient />
    </AdminShell>
  );
}
