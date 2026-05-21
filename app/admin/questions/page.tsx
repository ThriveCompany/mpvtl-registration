import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import AdminShell from "../admin-shell";
import QuestionsClient from "./questions-client";

export default async function QuestionsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.forcePasswordChange) redirect("/admin/change-password");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/registrations");

  return (
    <AdminShell
      admin={admin}
      active="questions"
      title="Verification Questions"
      subtitle="Manage the question text shown for Basic, Intermediate, and Advanced applicants."
    >
      <QuestionsClient />
    </AdminShell>
  );
}
