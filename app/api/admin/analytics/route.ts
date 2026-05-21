import { NextResponse } from "next/server";
import { buildAnalyticsData } from "@/lib/admin-analytics";
import { getCurrentAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (admin.forcePasswordChange) {
    return NextResponse.json({ message: "Please change your password before continuing." }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const data = await buildAnalyticsData(admin, url.searchParams);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Could not load analytics", error);
    return NextResponse.json({ message: "Could not load analytics." }, { status: 500 });
  }
}
