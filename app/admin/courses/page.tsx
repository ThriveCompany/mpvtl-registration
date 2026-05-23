import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import AdminShell from "../admin-shell";
import CoursesClient from "./courses-client";

export default async function CoursesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.forcePasswordChange) redirect("/admin/change-password");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/registrations");

  return (
    <AdminShell
      admin={admin}
      active="courses"
      title="Courses"
      subtitle="Manage the course catalogue, public course content, categories, active status, and centre availability."
    >
      <CoursesClient />
    </AdminShell>
  );
}
