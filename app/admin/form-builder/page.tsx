import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import AdminShell from "../admin-shell";
import FormBuilderClient from "./form-builder-client";

export default async function FormBuilderPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.forcePasswordChange) redirect("/admin/change-password");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/registrations");

  return (
    <AdminShell
      admin={admin}
      active="form-builder"
      title="Form Builder"
      subtitle="Manage course levels, fields, courses, dynamic questions, options, and conditional form logic."
    >
      <FormBuilderClient />
    </AdminShell>
  );
}

