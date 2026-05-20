import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import AdminShell from "../admin-shell";
import AnalyticsClient from "./analytics-client";

export default async function AdminAnalyticsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.forcePasswordChange) redirect("/admin/change-password");

  return (
    <AdminShell
      admin={admin}
      active="analytics"
      title="Analytics"
      subtitle="Monitor registration demand, review progress, centres, courses, and batch performance."
    >
      <AnalyticsClient />
    </AdminShell>
  );
}
