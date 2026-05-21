import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import type { AnalyticsData, CountPoint } from "@/lib/admin-analytics";
import { buildAnalyticsData, percent } from "@/lib/admin-analytics";
import { getCurrentAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BRAND = [127, 29, 45] as const;
const NAVY = [6, 19, 33] as const;
const SLATE = [71, 85, 105] as const;
const LIGHT = [243, 246, 250] as const;
const BORDER = [226, 232, 240] as const;
const CHART_COLORS = [
  [143, 29, 47],
  [6, 19, 33],
  [15, 118, 110],
  [183, 121, 31],
  [79, 70, 229],
  [2, 132, 199],
  [190, 18, 60],
  [100, 116, 139],
] as const;

type PdfDoc = InstanceType<typeof jsPDF>;

function setColor(doc: PdfDoc, color: readonly number[], target: "text" | "fill" | "draw" = "text") {
  if (target === "fill") doc.setFillColor(color[0], color[1], color[2]);
  if (target === "draw") doc.setDrawColor(color[0], color[1], color[2]);
  if (target === "text") doc.setTextColor(color[0], color[1], color[2]);
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

function dateLabel(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function rangeLabel(data: AnalyticsData) {
  const start = dateLabel(data.dateRange.startDate);
  const end = dateLabel(data.dateRange.endDate);
  if (start && end) return `${data.dateRange.label}: ${start} - ${end}`;
  return data.dateRange.label;
}

function generatedDate() {
  return new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fileDate() {
  return new Date().toISOString().slice(0, 10);
}

function addPageHeader(doc: PdfDoc, title: string) {
  setColor(doc, BRAND, "fill");
  doc.rect(0, 0, PAGE_WIDTH, 7, "F");
  setColor(doc, NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("MPVTL Registration System", MARGIN, 18);
  setColor(doc, BRAND);
  doc.setFontSize(13);
  doc.text(title, MARGIN, 27);
  setColor(doc, BORDER, "draw");
  doc.line(MARGIN, 32, PAGE_WIDTH - MARGIN, 32);
}

function addFooter(doc: PdfDoc) {
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    setColor(doc, BORDER, "draw");
    doc.line(MARGIN, PAGE_HEIGHT - 18, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 18);
    setColor(doc, SLATE);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("MOA Professional Vocational Training Limited", MARGIN, PAGE_HEIGHT - 11);
    doc.text(`MPVTL Registration Analytics Report · Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 11, { align: "right" });
  }
}

function newReportPage(doc: PdfDoc, title: string) {
  doc.addPage();
  addPageHeader(doc, title);
  return 42;
}

function addTextBlock(doc: PdfDoc, text: string, x: number, y: number, width: number, lineHeight = 5.5, fontSize = 10) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  setColor(doc, SLATE);
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function drawBadge(doc: PdfDoc, text: string, x: number, y: number, color: readonly number[] = BRAND) {
  setColor(doc, color, "fill");
  doc.roundedRect(x, y, 34, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(text, x + 17, y + 5.4, { align: "center" });
}

function drawSectionTitle(doc: PdfDoc, title: string, y: number) {
  setColor(doc, BRAND);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, MARGIN, y);
  setColor(doc, BORDER, "draw");
  doc.line(MARGIN, y + 3, PAGE_WIDTH - MARGIN, y + 3);
  return y + 12;
}

function drawTable(doc: PdfDoc, headers: string[], rows: string[][], x: number, y: number, widths: number[], options?: { compact?: boolean }) {
  const rowBaseHeight = options?.compact ? 7 : 8;
  let currentY = y;

  setColor(doc, NAVY, "fill");
  doc.rect(x, currentY, widths.reduce((sum, width) => sum + width, 0), rowBaseHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  let currentX = x;
  headers.forEach((header, index) => {
    doc.text(header, currentX + 2, currentY + 5.2);
    currentX += widths[index];
  });
  currentY += rowBaseHeight;

  rows.forEach((row, rowIndex) => {
    const wrappedCells = row.map((cell, index) => doc.splitTextToSize(cell || "-", widths[index] - 4));
    const rowHeight = Math.max(rowBaseHeight, Math.max(...wrappedCells.map((lines) => lines.length)) * 4.2 + 3);

    if (rowIndex % 2 === 0) {
      setColor(doc, LIGHT, "fill");
      doc.rect(x, currentY, widths.reduce((sum, width) => sum + width, 0), rowHeight, "F");
    }

    setColor(doc, BORDER, "draw");
    doc.rect(x, currentY, widths.reduce((sum, width) => sum + width, 0), rowHeight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(doc, NAVY);

    currentX = x;
    wrappedCells.forEach((lines, index) => {
      doc.text(lines, currentX + 2, currentY + 5);
      currentX += widths[index];
    });

    currentY += rowHeight;
  });

  return currentY;
}

function drawKpiTable(doc: PdfDoc, data: AnalyticsData, y: number) {
  const rows = [
    ["Total registrations", String(data.totals.total), "All registrations submitted in the period"],
    ["Needs review", String(data.totals.needsReview), "NEW and VIEWED registrations"],
    ["Approved", String(data.totals.approved), `${data.totals.approvalRate}% approval rate`],
    ["Unapproved", String(data.totals.unapproved), "Final negative decisions"],
    ["Needs further review", String(data.totals.needsFurtherReview), "Escalated applications"],
    ["Decision rate", `${data.totals.decisionRate}%`, "Share of registrations with final decisions"],
  ];

  return drawTable(doc, ["Metric", "Value", "Meaning"], rows, MARGIN, y, [60, 30, 88]);
}

function drawHorizontalBarChart(doc: PdfDoc, title: string, data: CountPoint[], x: number, y: number, width: number, height: number, maxRows = 8) {
  setColor(doc, NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, x, y);

  const chartData = data.slice(0, maxRows);
  if (chartData.length === 0) {
    return addTextBlock(doc, "No data available for this chart.", x, y + 10, width);
  }

  const max = Math.max(...chartData.map((item) => item.count), 1);
  const rowHeight = Math.min(10, (height - 12) / chartData.length);
  const labelWidth = width * 0.38;
  const barWidth = width - labelWidth - 18;
  let currentY = y + 13;

  chartData.forEach((item, index) => {
    const color = CHART_COLORS[index % CHART_COLORS.length];
    const label = `${index + 1}. ${item.name}`;
    const labelLines = doc.splitTextToSize(label, labelWidth - 2).slice(0, 2);
    const barActualWidth = Math.max(4, (item.count / max) * barWidth);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    setColor(doc, SLATE);
    doc.text(labelLines, x, currentY + 2.5);
    setColor(doc, [229, 231, 235], "fill");
    doc.roundedRect(x + labelWidth, currentY - 2, barWidth, 5, 1.5, 1.5, "F");
    setColor(doc, color, "fill");
    doc.roundedRect(x + labelWidth, currentY - 2, barActualWidth, 5, 1.5, 1.5, "F");
    setColor(doc, NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(String(item.count), x + labelWidth + barWidth + 4, currentY + 2);
    currentY += rowHeight;
  });

  return y + height;
}

function drawMiniTableForCounts(doc: PdfDoc, data: CountPoint[], y: number, total: number, label = "Name") {
  const rows = data.slice(0, 8).map((item) => [
    item.name,
    String(item.count),
    `${percent(item.count, total)}%`,
  ]);

  return drawTable(doc, [label, "Count", "Share"], rows, MARGIN, y, [118, 25, 35], { compact: true });
}

function drawCoverPage(doc: PdfDoc, data: AnalyticsData) {
  setColor(doc, BRAND, "fill");
  doc.rect(0, 0, PAGE_WIDTH, 12, "F");
  setColor(doc, NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("MOA Professional Vocational Training Limited", MARGIN, 32);
  setColor(doc, BRAND);
  doc.setFontSize(24);
  doc.text("MPVTL Registration", MARGIN, 55);
  doc.text("Analytics Report", MARGIN, 67);

  setColor(doc, SLATE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(rangeLabel(data), MARGIN, 83);
  doc.text(`Generated: ${generatedDate()}`, MARGIN, 91);
  doc.text("Prepared by MPVTL Registration System", MARGIN, 99);

  drawBadge(doc, "CONFIDENTIAL", MARGIN, 112, NAVY);

  let y = drawSectionTitle(doc, "Executive Summary", 136);
  y = addTextBlock(
    doc,
    `This report summarizes MPVTL short course registration activity for ${rangeLabel(data)}. It highlights total demand, review progress, final decisions, course interest, centre performance, category trends, and batch/session movement for management review.`,
    MARGIN,
    y,
    CONTENT_WIDTH,
  );

  y = drawSectionTitle(doc, "Key KPI Table", y + 12);
  drawKpiTable(doc, data, y);
}

function drawRegistrationSummary(doc: PdfDoc, data: AnalyticsData) {
  let y = newReportPage(doc, "Registration Summary");
  y = addTextBlock(doc, "A concise view of the registration pipeline and decision progress for the selected reporting period.", MARGIN, y, CONTENT_WIDTH);
  y = drawSectionTitle(doc, "Pipeline Metrics", y + 10);
  y = drawKpiTable(doc, data, y);
  y = drawSectionTitle(doc, "Decision Indicators", y + 14);

  drawTable(doc, ["Indicator", "Value"], [
    ["Approval rate", `${data.totals.approvalRate}%`],
    ["Decision rate", `${data.totals.decisionRate}%`],
    ["Most registered course", data.totals.mostRegisteredCourse?.name || "No course data"],
    ["Top centre", data.totals.topCenter?.name || "No centre data"],
    ["Top batch/session", data.totals.topBatch?.name || "No batch/session data yet"],
  ], MARGIN, y, [70, 108]);
}

function drawCourseDemand(doc: PdfDoc, data: AnalyticsData) {
  let y = newReportPage(doc, "Course Demand Analysis");
  y = drawHorizontalBarChart(doc, "Most Registered Courses", data.byCourse, MARGIN, y, CONTENT_WIDTH, 88);
  y = drawSectionTitle(doc, "Course Demand Table", y + 8);
  y = drawMiniTableForCounts(doc, data.byCourse, y, data.totals.total, "Course");
  y = drawSectionTitle(doc, "Interpretation", y + 12);
  addTextBlock(doc, data.insights.courseDemand, MARGIN, y, CONTENT_WIDTH);
}

function drawCenterPerformance(doc: PdfDoc, data: AnalyticsData) {
  let y = newReportPage(doc, "Center Performance Analysis");
  y = drawHorizontalBarChart(doc, "Registrations by Center", data.byCenter, MARGIN, y, CONTENT_WIDTH, 78);
  y = drawSectionTitle(doc, "Center Performance Table", y + 8);
  y = drawMiniTableForCounts(doc, data.byCenter, y, data.totals.total, "Center");
  y = drawSectionTitle(doc, "Interpretation", y + 12);
  addTextBlock(doc, data.insights.centerPerformance, MARGIN, y, CONTENT_WIDTH);
}

function drawCategoryAndBatch(doc: PdfDoc, data: AnalyticsData) {
  let y = newReportPage(doc, "Category and Batch Analysis");
  y = drawHorizontalBarChart(doc, "Course Category Demand", data.byCategory, MARGIN, y, CONTENT_WIDTH, 76);
  y = drawSectionTitle(doc, "Batch / Session Comparison", y + 8);

  if (data.byBatch.length > 0) {
    y = drawHorizontalBarChart(doc, "Batch / Session Registrations", data.byBatch, MARGIN, y, CONTENT_WIDTH, 62);
    drawMiniTableForCounts(doc, data.byBatch, y + 6, data.totals.total, "Batch / Session");
  } else {
    addTextBlock(doc, "Batch/session analytics will appear once registrations include batch/session data.", MARGIN, y, CONTENT_WIDTH);
  }
}

function drawStatusProgress(doc: PdfDoc, data: AnalyticsData) {
  let y = newReportPage(doc, "Status and Review Progress");
  y = drawHorizontalBarChart(doc, "Registration Status Breakdown", data.byStatus, MARGIN, y, CONTENT_WIDTH, 82);
  y = drawSectionTitle(doc, "Review Progress", y + 8);
  y = drawTable(doc, ["Area", "Count", "Meaning"], [
    ["Needs review", String(data.totals.needsReview), "Registrations awaiting review action"],
    ["Final decisions", String(data.totals.finalDecisions), "Approved, unapproved, further review, or rejected"],
    ["Approval rate", `${data.totals.approvalRate}%`, "Approved registrations as a share of total registrations"],
    ["Decision rate", `${data.totals.decisionRate}%`, "Final decisions as a share of total registrations"],
  ], MARGIN, y, [55, 28, 95]);
  y = drawSectionTitle(doc, "Interpretation", y + 12);
  addTextBlock(doc, `${data.insights.reviewProgress} ${data.insights.decisionProgress}`, MARGIN, y, CONTENT_WIDTH);
}

function drawConclusion(doc: PdfDoc, data: AnalyticsData) {
  let y = newReportPage(doc, "Conclusion / Management Notes");
  y = addTextBlock(doc, "This report is intended to support management review of registration demand, centre performance, applicant review progress, and programme planning.", MARGIN, y, CONTENT_WIDTH);
  y = drawSectionTitle(doc, "Management Notes", y + 12);

  const notes = [
    data.totals.mostRegisteredCourse
      ? `Course planning should consider continued demand for ${data.totals.mostRegisteredCourse.name}.`
      : "Course demand data was not available for this period.",
    data.totals.topCenter
      ? `${data.totals.topCenter.name} is the strongest registration centre for this period.`
      : "Centre performance data was not available for this period.",
    data.totals.needsReview > 0
      ? `${data.totals.needsReview} registration${data.totals.needsReview === 1 ? "" : "s"} still require review action.`
      : "All registrations in this period have received a final decision.",
  ];

  notes.forEach((note, index) => {
    setColor(doc, BRAND);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${index + 1}.`, MARGIN, y);
    y = addTextBlock(doc, note, MARGIN + 8, y, CONTENT_WIDTH - 8);
    y += 4;
  });

  y = drawSectionTitle(doc, "Footer", y + 10);
  addTextBlock(doc, "MOA Professional Vocational Training Limited\nMPVTL Registration Analytics Report", MARGIN, y, CONTENT_WIDTH);
}

function buildPdf(data: AnalyticsData) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  drawCoverPage(doc, data);
  drawRegistrationSummary(doc, data);
  drawCourseDemand(doc, data);
  drawCenterPerformance(doc, data);
  drawCategoryAndBatch(doc, data);
  drawStatusProgress(doc, data);
  drawConclusion(doc, data);
  addFooter(doc);

  return doc;
}

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
    const doc = buildPdf(data);
    const arrayBuffer = doc.output("arraybuffer");
    const filename = `MPVTL-Registration-Analytics-Report-${sanitizeFilename(data.dateRange.label)}-${fileDate()}.pdf`;

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Could not generate analytics PDF", error);
    return NextResponse.json({ message: "Could not generate analytics PDF." }, { status: 500 });
  }
}
