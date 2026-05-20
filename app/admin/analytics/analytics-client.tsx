"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { CalendarDays, Download, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
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

const chartColors = ["#7f1d2d", "#061321", "#a91f35", "#193b5f", "#c72a42", "#64748b", "#102b46", "#f89bab"];

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
      { label: "Needs Review", value: totals ? compactNumber(totals.needsReview) : "0", tone: "red" },
      { label: "Approved", value: totals ? compactNumber(totals.approved) : "0", tone: "plain" },
      { label: "Unapproved", value: totals ? compactNumber(totals.unapproved) : "0", tone: "plain" },
      { label: "Needs Further Review", value: totals ? compactNumber(totals.needsFurtherReview) : "0", tone: "plain" },
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
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(6,19,33,0.08)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Report Period</p>
            <h2 className="mt-1 text-lg font-bold text-navy-950">{rangeSubtitle(data)}</h2>
          </div>
          <button
            type="button"
            onClick={generatePdfReport}
            disabled={!hasData || pdfLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-sm font-bold text-white shadow-[0_16px_45px_rgba(127,29,45,0.20)] transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            {pdfLoading ? "Generating PDF..." : "Generate PDF Report"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <button
              key={filter.range}
              type="button"
              onClick={() => selectQuickFilter(filter.range)}
              className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                activeFilter.range === filter.range
                  ? "bg-navy-950 text-white shadow-[0_12px_30px_rgba(6,19,33,0.18)]"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:text-brand-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Start date</span>
            <input
              type="date"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">End date</span>
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
            className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-navy-950 transition hover:border-brand-300 hover:text-brand-700"
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

      <div ref={reportRef} className="space-y-5 bg-[#f3f6fa]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(6,19,33,0.08)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">MPVTL Registration System</p>
              <h2 className="mt-1 text-2xl font-bold text-navy-950">Registration Analytics Report</h2>
              <p className="mt-1 text-sm text-slate-600">{rangeSubtitle(data)}</p>
            </div>
            <p className="text-sm font-semibold text-slate-600">Generated {new Date().toLocaleDateString()}</p>
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
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} tone={kpi.tone} />
              ))}
            </div>
          )}
        </section>

        {data && hasData && (
          <>
            <section className="grid gap-5 xl:grid-cols-2">
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

            <section className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Registrations Over Time" subtitle="Registration movement across the selected period">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data.overTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#7f1d2d" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
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
    : tone === "red"
      ? "border-brand-200 bg-brand-50 text-brand-800"
      : "border-slate-200 bg-white text-navy-950";

  return (
    <div className={`min-h-[7rem] rounded-2xl border p-4 shadow-[0_14px_40px_rgba(6,19,33,0.06)] ${className} ${tone === "wide" ? "sm:col-span-2" : ""}`}>
      <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${tone === "navy" ? "text-brand-100" : "text-slate-500"}`}>{label}</p>
      <p className="mt-3 line-clamp-3 text-2xl font-black leading-tight">{value}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(6,19,33,0.08)] sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-bold text-navy-950">{title}</h3>
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

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
        <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="#64748b" />
        <Tooltip />
        <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#7f1d2d" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DonutChart({ data }: { data: CountPoint[] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyChart message="No data available for this chart." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="name" innerRadius={62} outerRadius={98} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function StatusChart({ data }: { data: CountPoint[] }) {
  const safeData = Array.isArray(data) ? data.map((item) => ({ ...item, name: readableStatus(item.name) })) : [];
  if (safeData.length === 0) {
    return <EmptyChart message="No status data available." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={safeData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" interval={0} angle={-20} textAnchor="end" height={70} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
        <Tooltip />
        <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#061321" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function InsightCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(6,19,33,0.08)]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-700">{text}</p>
    </article>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-[260px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm font-semibold text-slate-500">
      {message}
    </div>
  );
}
