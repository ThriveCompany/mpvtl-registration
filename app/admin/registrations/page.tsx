import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import RegistrationListClient from "./registration-list-client";

export default async function AdminRegistrationsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return <RegistrationListClient admin={admin} />;
}
