import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { dateKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { ensureProfile } from "@/lib/reports";
import { generateServicesCertificationPdf } from "@/lib/services-certification-pdf";
import { isCertificationEligible } from "@/lib/wfh-rules";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const [report, profile] = await Promise.all([
    prisma.report.findUnique({ where: { id }, include: { days: { orderBy: { sortOrder: "asc" } } } }),
    ensureProfile(),
  ]);
  if (!report) return NextResponse.json({ message: "Report not found." }, { status: 404 });
  const services = report.days.filter(isCertificationEligible).map((day) => ({ date: day.date, hours: day.wfhHours! }));
  if (!services.length) return NextResponse.json({ message: "No completed WFH services are eligible for certification." }, { status: 400 });
  if (!profile.certifyingOfficerName?.trim() || !profile.certifyingOfficerPosition?.trim()) return NextResponse.json({ message: "Complete the certification officer in Profile first." }, { status: 400 });
  const pdf = await generateServicesCertificationPdf(profile, { start: report.periodStart, end: report.periodEnd }, services);
  const filename = `CERT_SERVICES_${dateKey(report.periodStart)}_to_${dateKey(report.periodEnd)}.pdf`;
  if (!preview) {
    const directory = path.join(process.cwd(), "generated-reports", "certifications");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), pdf);
  }
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${filename}"`, "Cache-Control": "private, no-store" } });
}
