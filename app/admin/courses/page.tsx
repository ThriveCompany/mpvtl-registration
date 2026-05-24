import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

export default async function CoursesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.forcePasswordChange) redirect("/admin/change-password");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/registrations");

  redirect("/admin/form-builder");
}
