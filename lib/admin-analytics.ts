import type { Prisma, RegistrationStatus } from "@prisma/client";
import type { SafeAdmin } from "@/lib/auth";
import { registrationAccessWhere } from "@/lib/auth";
import { FINAL_REGISTRATION_STATUSES } from "@/lib/admin-constants";
import { prisma } from "@/lib/prisma";

export type AnalyticsRange =
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "allTime"
  | "custom";

export type CountPoint = {
  name: string;
  count: number;
  status?: string;
};

export type OverTimePoint = {
  date: string;
  count: number;
};

export type AnalyticsData = {
  dateRange: {
    range: AnalyticsRange;
    label: string;
    startDate: string | null;
    endDate: string | null;
  };
  totals: {
    total: number;
    needsReview: number;
    new: number;
    viewed: number;
    approved: number;
    unapproved: number;
    needsFurtherReview: number;
    rejected: number;
    finalDecisions: number;
    mostRegisteredCourse: CountPoint | null;
    topCenter: CountPoint | null;
    topBatch: CountPoint | null;
    approvalRate: number;
    decisionRate: number;
  };
  byCourse: CountPoint[];
  byCenter: CountPoint[];
  byCategory: CountPoint[];
  byStatus: CountPoint[];
  overTime: OverTimePoint[];
  byBatch: CountPoint[];
  insights: {
    courseDemand: string;
    centerPerformance: string;
    reviewProgress: string;
    decisionProgress: string;
  };
};

type RegistrationForAnalytics = {
  course: string;
  category: string;
  center: string;
  level: string;
  session: string | null;
  status: RegistrationStatus;
  createdAt: Date;
};

const statusOrder: RegistrationStatus[] = [
  "NEW",
  "VIEWED",
  "APPROVED",
  "UNAPPROVED",
  "NEEDS_FURTHER_REVIEW",
  "REJECTED",
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(startOfDay(date), mondayOffset);
}

function parseDateInput(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getDateRange(params: URLSearchParams) {
  const range = (params.get("range") || "thisMonth") as AnalyticsRange;
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let label = "This Month";

  if (range === "thisWeek") {
    startDate = startOfWeek(now);
    endDate = addDays(startDate, 7);
    label = "This Week";
  } else if (range === "lastWeek") {
    endDate = startOfWeek(now);
    startDate = addDays(endDate, -7);
    label = "Last Week";
  } else if (range === "thisMonth") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    label = "This Month";
  } else if (range === "lastMonth") {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    label = "Last Month";
  } else if (range === "thisYear") {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear() + 1, 0, 1);
    label = "This Year";
  } else if (range === "lastYear") {
    startDate = new Date(now.getFullYear() - 1, 0, 1);
    endDate = new Date(now.getFullYear(), 0, 1);
    label = "Last Year";
  } else if (range === "custom") {
    startDate = parseDateInput(params.get("startDate"));
    const customEnd = parseDateInput(params.get("endDate"));
    endDate = customEnd ? addDays(customEnd, 1) : null;
    label = "Custom Range";
  } else {
    label = "So Far / All Time";
  }

  return { range, startDate, endDate, label };
}

function countBy<T extends string>(items: RegistrationForAnalytics[], key: (item: RegistrationForAnalytics) => T | null | undefined) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const value = key(item)?.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));
}

function formatPeriodKey(date: Date, bucket: "day" | "week" | "month") {
  if (bucket === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  if (bucket === "week") {
    const weekStart = startOfWeek(date);
    return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildOverTime(items: RegistrationForAnalytics[], startDate: Date | null, endDate: Date | null) {
  const spanDays = startDate && endDate
    ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000))
    : null;
  const bucket: "day" | "week" | "month" = !spanDays || spanDays > 180 ? "month" : spanDays > 45 ? "week" : "day";
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = formatPeriodKey(item.createdAt, bucket);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((first, second) => first.date.localeCompare(second.date));
}

export function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

export async function buildAnalyticsData(admin: SafeAdmin, params: URLSearchParams): Promise<AnalyticsData> {
  const dateRange = getDateRange(params);
  const where: Prisma.RegistrationWhereInput = {
    ...registrationAccessWhere(admin),
    archivedAsDuplicate: false,
  };

  if (dateRange.startDate || dateRange.endDate) {
    where.createdAt = {
      ...(dateRange.startDate ? { gte: dateRange.startDate } : {}),
      ...(dateRange.endDate ? { lt: dateRange.endDate } : {}),
    };
  }

  const registrations = await prisma.registration.findMany({
    where,
    orderBy: { createdAt: "asc" },
    select: {
      course: true,
      category: true,
      center: true,
      level: true,
      session: true,
      status: true,
      createdAt: true,
    },
  });

  const safeRegistrations = Array.isArray(registrations) ? registrations : [];
  const byCourse = countBy(safeRegistrations, (item) => item.course);
  const byCenter = countBy(safeRegistrations, (item) => item.center);
  const byCategory = countBy(safeRegistrations, (item) => item.category);
  const byBatch = countBy(safeRegistrations, (item) => item.session);
  const statusCounts = new Map<RegistrationStatus, number>();

  for (const status of statusOrder) statusCounts.set(status, 0);
  for (const item of safeRegistrations) {
    statusCounts.set(item.status, (statusCounts.get(item.status) || 0) + 1);
  }

  const byStatus = statusOrder.map((status) => ({
    name: status.replaceAll("_", " "),
    status,
    count: statusCounts.get(status) || 0,
  }));

  const total = safeRegistrations.length;
  const approved = statusCounts.get("APPROVED") || 0;
  const unapproved = statusCounts.get("UNAPPROVED") || 0;
  const needsFurtherReview = statusCounts.get("NEEDS_FURTHER_REVIEW") || 0;
  const rejected = statusCounts.get("REJECTED") || 0;
  const viewed = statusCounts.get("VIEWED") || 0;
  const newRegistrations = statusCounts.get("NEW") || 0;
  const needsReview = newRegistrations + viewed;
  const finalDecisions = safeRegistrations.filter((item) => (
    (FINAL_REGISTRATION_STATUSES as readonly RegistrationStatus[]).includes(item.status)
  )).length;
  const topCourse = byCourse[0] || null;
  const topCenter = byCenter[0] || null;
  const topBatch = byBatch[0] || null;

  return {
    dateRange: {
      range: dateRange.range,
      label: dateRange.label,
      startDate: dateRange.startDate?.toISOString() || null,
      endDate: dateRange.endDate ? addDays(dateRange.endDate, -1).toISOString() : null,
    },
    totals: {
      total,
      needsReview,
      new: newRegistrations,
      viewed,
      approved,
      unapproved,
      needsFurtherReview,
      rejected,
      finalDecisions,
      mostRegisteredCourse: topCourse,
      topCenter,
      topBatch,
      approvalRate: percent(approved, total),
      decisionRate: percent(finalDecisions, total),
    },
    byCourse,
    byCenter,
    byCategory,
    byStatus,
    overTime: buildOverTime(safeRegistrations, dateRange.startDate, dateRange.endDate),
    byBatch,
    insights: {
      courseDemand: topCourse
        ? `The most registered course in this period is ${topCourse.name}, with ${topCourse.count} registration${topCourse.count === 1 ? "" : "s"}.`
        : "No course demand trend is available for this period.",
      centerPerformance: topCenter
        ? `${topCenter.name} received the highest number of registrations in this period.`
        : "No centre performance trend is available for this period.",
      reviewProgress: `${needsReview} application${needsReview === 1 ? "" : "s"} still require review.`,
      decisionProgress: `${approved} out of ${total} registration${total === 1 ? "" : "s"} have been approved.`,
    },
  };
}
