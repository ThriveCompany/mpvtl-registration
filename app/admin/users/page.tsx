import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import UsersClient from "./users-client";

export default async function AdminUsersPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/registrations");

  return <UsersClient admin={admin} />;
}
