import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { generateAnnexCPdf } from "@/lib/annex-c-pdf";
import { dateKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { hasActualAccomplishment, isIncludedDay, reportTarget } from "@/lib/report-types";
import { ensureProfile } from "@/lib/reports";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const [report, profile] = await Promise.all([
    prisma.report.findUnique({ where: { id }, include: { days: { orderBy: { sortOrder: "asc" } } } }),
    ensureProfile(),
  ]);
  if (!report) return NextResponse.json({ message: "Report not found." }, { status: 404 });
  const entries = report.days.filter(isIncludedDay).map((day) => ({ date: day.date, target: reportTarget(day), output: day.output, status: day.taskStatus, completionPercentage: day.completionPercentage, showStatus: hasActualAccomplishment(day) }));
  const pdf = await generateAnnexCPdf(profile, { start: report.periodStart, end: report.periodEnd }, entries);
  const filename = `AR_${dateKey(report.periodStart)}_to_${dateKey(report.periodEnd)}.pdf`;
  if (!preview) {
    const directory = path.join(process.cwd(), "generated-reports");
    await mkdir(directory, { recursive: true });
    const absolutePath = path.join(directory, filename);
    await writeFile(absolutePath, pdf);
    await prisma.report.update({ where: { id }, data: { generatedAt: new Date(), generatedPdfPath: path.join("generated-reports", filename), status: "FINAL" } });
  }
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${filename}"`, "Cache-Control": "private, no-store" } });
}
