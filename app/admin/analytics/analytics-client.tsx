"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { CalendarDays, Download, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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

function compactNumber(value: number) {
  return new Intl.NumberFormat(undefined, { notation: value >= 10000 ? "compact" : "standard" }).format(value);
}

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
  const reportRef = useRef<HTMLDivElement>(null);

  const hasData = Boolean(data && data.totals.total > 0);
  const kpis = useMemo(() => {
    const totals = data?.totals;
    return [
      { label: "Total Registrations", value: totals ? compactNumber(totals.total) : "0", tone: "navy" },
      { label: "Needs Review", value: totals ? compactNumber(totals.needsReview) : "0", tone: "review" },
      { label: "Approved", value: totals ? compactNumber(totals.approved) : "0", tone: "approved" },
      { label: "Unapproved", value: totals ? compactNumber(totals.unapproved) : "0", tone: "danger" },
      { label: "Further Review", value: totals ? compactNumber(totals.needsFurtherReview) : "0", tone: "amber" },
      { label: "Most Registered Course", value: totals?.mostRegisteredCourse?.name || "No course data yet", tone: "wide" },
      { label: "Top Center", value: totals?.topCenter?.name || "No centre data yet", tone: "plain" },
      { label: "Top Batch / Session", value: totals?.topBatch?.name || "No batch/session data yet", tone: "wide" },
    ];
  }, [data]);

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
    void loadAnalytics(filter);
  }

  function applyCustomRange() {
    const filter = { range: "custom" as const, startDate: customStart, endDate: customEnd };
    setActiveFilter(filter);
    void loadAnalytics(filter);
  }

  async function generatePdfReport() {
    if (!reportRef.current || !data) return;

    setPdfLoading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#f3f6fa",
        scale: 2,
        useCORS: true,
      });
      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imageHeight;
      let position = 0;

      pdf.addImage(image, "PNG", 0, position, pageWidth, imageHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight;
        pdf.addPage();
        pdf.addImage(image, "PNG", 0, position, pageWidth, imageHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`MPVTL-Registration-Analytics-${sanitizeFilename(data.dateRange.label)}-${fileDate()}.pdf`);
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-700 sm:text-xs">Report Period</p>
            <h2 className="mt-1 text-sm font-semibold leading-6 text-navy-950 sm:text-base">{rangeSubtitle(data)}</h2>
          </div>
          <button
            type="button"
            onClick={generatePdfReport}
            disabled={!hasData || pdfLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-3 py-2.5 text-xs font-semibold text-white shadow-[0_14px_35px_rgba(127,29,45,0.18)] transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-3 sm:text-sm"
          >
            <Download size={16} />
            {pdfLoading ? "Generating PDF..." : "Generate PDF Report"}
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:mt-4 sm:flex-wrap sm:overflow-visible sm:pb-0">
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

        <div className="mt-3 grid gap-2 sm:mt-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">Start date</span>
            <input
              type="date"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 sm:h-11"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs">End date</span>
            <input
              type="date"
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 sm:h-11"
            />
          </label>
          <button
            type="button"
            onClick={applyCustomRange}
            className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-navy-950 transition hover:border-brand-300 hover:text-brand-700 sm:h-11"
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

      <div ref={reportRef} className="space-y-3 bg-[#f3f6fa] sm:space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(6,19,33,0.07)] sm:p-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700 sm:text-xs">MPVTL Registration System</p>
              <h2 className="mt-1 text-lg font-semibold text-navy-950 sm:text-xl">Registration Analytics Report</h2>
              <p className="mt-1 text-sm text-slate-600">{rangeSubtitle(data)}</p>
            </div>
            <p className="text-xs font-medium text-slate-500 sm:text-sm">Generated {new Date().toLocaleDateString()}</p>
          </div>

          {loading && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
              <RefreshCw size={16} className="animate-spin" />
              Loading analytics...
            </div>
          )}

          {!loading && !hasData && !error && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-600">
              No registrations found for this period.
            </div>
          )}

          {!loading && data && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} tone={kpi.tone} />
              ))}
            </div>
          )}
        </section>

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

function KpiCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  const className = tone === "navy"
    ? "border-navy-900 bg-navy-950 text-white"
    : tone === "review"
      ? "border-brand-100 bg-brand-50 text-brand-800"
      : tone === "approved"
        ? "border-teal-100 bg-teal-50 text-teal-800"
        : tone === "danger"
          ? "border-rose-100 bg-rose-50 text-rose-800"
          : tone === "amber"
            ? "border-amber-100 bg-amber-50 text-amber-800"
            : "border-slate-200 bg-white text-navy-950";
  const labelClass = tone === "navy" ? "text-brand-100" : "text-slate-500";
  const valueClass = tone === "wide"
    ? "text-sm font-semibold leading-5 text-navy-950 sm:text-base"
    : "text-xl font-semibold leading-none sm:text-2xl";

  return (
    <div className={`min-h-[76px] rounded-xl border p-3 shadow-[0_10px_28px_rgba(6,19,33,0.05)] sm:min-h-[92px] sm:rounded-2xl sm:p-4 ${className} ${tone === "wide" ? "col-span-2" : ""}`}>
      <p className={`text-[9px] font-semibold uppercase tracking-[0.1em] sm:text-[10px] ${labelClass}`}>{label}</p>
      <p className={`mt-2 break-words ${valueClass}`}>{value}</p>
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
