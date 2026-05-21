"use client";

import { CalendarDays, Download, MoreHorizontal, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsRange =
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "allTime"
  | "custom";

type CountPoint = {
  name: string;
  count: number;
  status?: string;
};

type OverTimePoint = {
  date: string;
  count: number;
};

type AnalyticsData = {
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

const quickFilters: { label: string; range: AnalyticsRange }[] = [
  { label: "This Week", range: "thisWeek" },
  { label: "Last Week", range: "lastWeek" },
  { label: "This Month", range: "thisMonth" },
  { label: "Last Month", range: "lastMonth" },
  { label: "This Year", range: "thisYear" },
  { label: "Last Year", range: "lastYear" },
  { label: "So Far / All Time", range: "allTime" },
];

const chartColors = [
  "#8f1d2f",
  "#0b1f33",
  "#0f766e",
  "#b7791f",
  "#4f46e5",
  "#0284c7",
  "#be123c",
  "#64748b",
  "#047857",
  "#7c3aed",
];

function readableStatus(value: string) {
  return value.replaceAll("_", " ");
}

function dateLabel(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function rangeSubtitle(data: AnalyticsData | null) {
  if (!data) return "Loading selected period";
  const start = dateLabel(data.dateRange.startDate);
  const end = dateLabel(data.dateRange.endDate);
  if (start && end) return `${data.dateRange.label}: ${start} - ${end}`;
  return data.dateRange.label;
}

function fileDate() {
  return new Date().toISOString().slice(0, 10);
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

export default function AnalyticsClient() {
  const [activeFilter, setActiveFilter] = useState<{ range: AnalyticsRange; startDate?: string; endDate?: string }>({ range: "thisMonth" });
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);

  const hasData = Boolean(data && data.totals.total > 0);
  const activeFilterLabel = quickFilters.find((filter) => filter.range === activeFilter.range)?.label || "Custom Range";

  async function loadAnalytics(filter = activeFilter) {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ range: filter.range });
    if (filter.range === "custom") {
      if (filter.startDate) params.set("startDate", filter.startDate);
      if (filter.endDate) params.set("endDate", filter.endDate);
    }

    try {
      const response = await fetch(`/api/admin/analytics?${params.toString()}`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as AnalyticsData & { message?: string } | null;

      if (!response.ok || !result) {
        throw new Error(result?.message || "Could not load analytics.");
      }

      setData(result);
    } catch (loadError) {
      setData(null);
      setError(loadError instanceof Error ? loadError.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }

  function selectQuickFilter(range: AnalyticsRange) {
    const filter = { range };
    setActiveFilter(filter);
    setPeriodMenuOpen(false);
    void loadAnalytics(filter);
  }

  function applyCustomRange() {
    const filter = { range: "custom" as const, startDate: customStart, endDate: customEnd };
    setActiveFilter(filter);
    void loadAnalytics(filter);
  }

  async function generatePdfReport() {
    if (!data) return;

    setPdfLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ range: activeFilter.range });
      if (activeFilter.range === "custom") {
        if (activeFilter.startDate) params.set("startDate", activeFilter.startDate);
        if (activeFilter.endDate) params.set("endDate", activeFilter.endDate);
      }

      const response = await fetch(`/api/admin/analytics/report?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(result?.message || "Could not generate PDF report.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `MPVTL-Registration-Analytics-Report-${sanitizeFilename(data.dateRange.label)}-${fileDate()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : "Could not generate PDF report.");
    } finally {
      setPdfLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics(activeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3 sm:space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_14px_40px_rgba(6,19,33,0.07)] sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 sm:text-xs">Report Period</p>
            <h2 className="mt-1 text-[15px] font-semibold leading-6 text-navy-950 sm:text-lg">{rangeSubtitle(data)}</h2>
            <p className="mt-1 hidden text-sm leading-6 text-slate-600 sm:block">Use the controls below to update the dashboard and formal PDF report.</p>
          </div>
          <button
            type="button"
            onClick={generatePdfReport}
            disabled={!hasData || pdfLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-700 px-3 text-xs font-semibold text-white shadow-[0_14px_35px_rgba(127,29,45,0.18)] transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto sm:px-4 sm:py-3 sm:text-sm"
          >
            <Download size={16} />
            {pdfLoading ? "Preparing PDF..." : "Download PDF Report"}
          </button>
        </div>

        <div className="relative mt-3 sm:hidden">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/90 shadow-[0_12px_34px_rgba(6,19,33,0.06)]">
            <div className="flex min-h-11 items-center gap-3 px-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Period</p>
                <p className="truncate text-sm font-semibold text-navy-950">{activeFilterLabel}</p>
              </div>
              <button
                type="button"
                aria-label="Open period filters"
                aria-expanded={periodMenuOpen}
                onClick={() => setPeriodMenuOpen((current) => !current)}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-navy-950 shadow-[0_8px_20px_rgba(6,19,33,0.08)]"
              >
                <MoreHorizontal size={17} />
              </button>
            </div>

            <div className="border-t border-slate-200/80">
              <label className="flex min-h-11 items-center justify-between gap-3 px-3">
                <span className="text-xs font-semibold text-slate-500">Start</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="h-9 min-w-0 flex-1 bg-transparent text-right text-sm font-medium text-navy-950 outline-none"
                />
              </label>
            </div>

            <div className="border-t border-slate-200/80">
              <label className="flex min-h-11 items-center justify-between gap-3 px-3">
                <span className="text-xs font-semibold text-slate-500">End</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="h-9 min-w-0 flex-1 bg-transparent text-right text-sm font-medium text-navy-950 outline-none"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={applyCustomRange}
              className="flex min-h-11 w-full items-center justify-center gap-2 border-t border-slate-200/80 bg-white text-sm font-semibold text-brand-700"
            >
              <CalendarDays size={15} />
              Apply Filter
            </button>
          </div>

          {periodMenuOpen && (
            <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_22px_60px_rgba(6,19,33,0.16)]">
              {quickFilters.map((filter) => (
                <button
                  key={filter.range}
                  type="button"
                  onClick={() => selectQuickFilter(filter.range)}
                  className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    activeFilter.range === filter.range
                      ? "bg-navy-950 text-white"
                      : "text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 hidden gap-2 sm:flex sm:flex-wrap">
          {quickFilters.map((filter) => (
            <button
              key={filter.range}
              type="button"
              onClick={() => selectQuickFilter(filter.range)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                activeFilter.range === filter.range
                  ? "bg-navy-950 text-white shadow-[0_12px_30px_rgba(6,19,33,0.18)]"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:text-brand-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-4 hidden gap-3 sm:grid md:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">Start date</span>
            <input
              type="date"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">End date</span>
            <input
              type="date"
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <button
            type="button"
            onClick={applyCustomRange}
            className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-navy-950 transition hover:border-brand-300 hover:text-brand-700"
          >
            <CalendarDays size={16} />
            Apply Filter
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm font-semibold text-brand-800">
          {error}
        </div>
      )}

      <div className="space-y-3 bg-[#f3f6fa] sm:space-y-5">
        {loading && (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-[0_14px_40px_rgba(6,19,33,0.06)]">
            <RefreshCw size={16} className="animate-spin" />
            Loading analytics...
          </div>
        )}

        {!loading && !hasData && !error && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600 shadow-[0_14px_40px_rgba(6,19,33,0.06)]">
            No registrations found for this period.
          </div>
        )}

        {data && hasData && (
          <>
            <section className="grid gap-3 xl:grid-cols-2 xl:gap-5">
              <ChartCard title="Most Registered Courses" subtitle="Course demand by registration count">
                <HorizontalBarChart data={data.byCourse.slice(0, 8)} />
              </ChartCard>
              <ChartCard title="Registrations by Center" subtitle="Training centre/location performance">
                <DonutChart data={data.byCenter} />
              </ChartCard>
              <ChartCard title="Registrations by Course Category" subtitle="Demand grouped by programme category">
                <HorizontalBarChart data={data.byCategory} />
              </ChartCard>
              <ChartCard title="Registration Status Breakdown" subtitle="Review and decision distribution">
                <StatusChart data={data.byStatus} />
              </ChartCard>
            </section>

            <section className="grid gap-3 xl:grid-cols-2 xl:gap-5">
              <ChartCard title="Registrations Over Time" subtitle="Registration movement across the selected period">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.overTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Batch / Session Registration Comparison" subtitle="Registration count by selected batch/session">
                {data.byBatch.length > 0 ? (
                  <HorizontalBarChart data={data.byBatch} />
                ) : (
                  <EmptyChart message="Batch/session analytics will appear once registrations include batch/session data." />
                )}
              </ChartCard>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <InsightCard title="Course Demand Insight" text={data.insights.courseDemand} />
              <InsightCard title="Center Performance Insight" text={data.insights.centerPerformance} />
              <InsightCard title="Review Progress Insight" text={data.insights.reviewProgress} />
              <InsightCard title="Conversion / Decision Insight" text={data.insights.decisionProgress} />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-xs font-semibold text-slate-500">
              MOA Professional Vocational Training Limited · MPVTL Registration Analytics Report
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(6,19,33,0.06)] sm:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-navy-950 sm:text-base">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function HorizontalBarChart({ data }: { data: CountPoint[] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyChart message="No data available for this chart." />;
  }

  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const width = `${Math.max(8, (item.count / max) * 100)}%`;
        const color = chartColors[index % chartColors.length];

        return (
          <div key={`${item.name}-${index}`} className="min-w-0">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs font-medium text-slate-700" title={item.name}>{item.name}</p>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-navy-950">{item.count}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data }: { data: CountPoint[] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyChart message="No data available for this chart." />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-center">
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid gap-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
              <span className="truncate text-xs font-medium text-slate-700">{entry.name}</span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-navy-950">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusChart({ data }: { data: CountPoint[] }) {
  const safeData = Array.isArray(data) ? data.map((item) => ({ ...item, name: readableStatus(item.name) })) : [];
  if (safeData.length === 0) {
    return <EmptyChart message="No status data available." />;
  }

  return <HorizontalBarChart data={safeData} />;
}

function InsightCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(6,19,33,0.06)] sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-700 sm:text-xs">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </article>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm font-medium text-slate-500">
      {message}
    </div>
  );
}
