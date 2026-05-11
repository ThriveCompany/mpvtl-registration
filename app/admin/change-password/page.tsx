import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import ChangePasswordClient from "./change-password-client";

export default async function AdminChangePasswordPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return <ChangePasswordClient forced={admin.forcePasswordChange} />;
}
