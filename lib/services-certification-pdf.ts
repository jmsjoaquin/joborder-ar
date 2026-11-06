import PDFDocument from "pdfkit";
import path from "node:path";
import { existsSync } from "node:fs";
import { formatHours } from "./wfh-rules";
import type { ReportingPeriod } from "./dates";

export type CertificationProfile = {
  fullName: string;
  position: string;
  fullDepartmentName: string;
  certifyingOfficerName: string | null;
  certifyingOfficerPosition: string | null;
};

export type CertifiedService = { date: Date; hours: number };

const LETTERHEAD = path.join(process.cwd(), "public/document-assets/philhealth-letterhead.png");
const ISO_LOGO = path.join(process.cwd(), "public/document-assets/tuv-sud-iso-9001.png");
const GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf";
const GEORGIA_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf";
const REGULAR = existsSync(GEORGIA) ? "Georgia" : "Times-Roman";
const BOLD = existsSync(GEORGIA_BOLD) ? "GeorgiaBold" : "Times-Bold";
const LEFT = 54;
const WIDTH = 487;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function certificationPeriodLabel(period: ReportingPeriod) {
  const month = period.start.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  if (period.start.getUTCMonth() === period.end.getUTCMonth() && period.start.getUTCFullYear() === period.end.getUTCFullYear()) {
    return `${month} ${period.start.getUTCDate()}-${period.end.getUTCDate()}, ${period.end.getUTCFullYear()}`;
  }
  return `${formatDate(period.start)}-${formatDate(period.end)}`;
}

function box(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, fill?: string) {
  if (fill) doc.save().fillColor(fill).rect(x, y, width, height).fill().restore();
  doc.lineWidth(0.45).strokeColor("#b4b4b4").rect(x, y, width, height).stroke();
}

export async function generateServicesCertificationPdf(profile: CertificationProfile, period: ReportingPeriod, services: CertifiedService[]) {
  const doc = new PDFDocument({ autoFirstPage: false, size: "A4", layout: "portrait", margin: 0, info: { Title: `Certification of Services Rendered - ${certificationPeriodLabel(period)}`, Author: profile.fullName } });
  if (existsSync(GEORGIA)) doc.registerFont("Georgia", GEORGIA);
  if (existsSync(GEORGIA_BOLD)) doc.registerFont("GeorgiaBold", GEORGIA_BOLD);
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });

  doc.addPage({ size: "A4", layout: "portrait", margin: 0 });
  doc.image(LETTERHEAD, 45, 32, { width: 540, height: 73 });
  doc.fillColor("#000").font(BOLD).fontSize(14).text("CERTIFICATION OF SERVICES RENDERED", LEFT, 149, { width: WIDTH, align: "center" });

  doc.fillColor("#000").font(REGULAR).fontSize(12).text("This is to certify ", 90, 192, { continued: true });
  doc.font(BOLD).text(`${profile.fullName.toUpperCase()},`, { underline: true });
  doc.font(BOLD).text(profile.position, LEFT, 213, { continued: true, underline: true });
  doc.font(REGULAR).text(" assigned at the", { underline: false });
  doc.font(REGULAR).text(profile.fullDepartmentName, LEFT, 233, { underline: true });
  doc.font(REGULAR).text("have rendered services on", LEFT, 253);
  doc.text("the following date(s):", LEFT, 273);

  const tableWidth = 398;
  const tableLeft = (595.28 - tableWidth) / 2;
  const dateWidth = 232;
  const rowHeight = services.length > 10 ? 20 : 25;
  let y = services.length > 10 ? 282 : 302;
  box(doc, tableLeft, y, dateWidth, 28, "#f2f2f2"); box(doc, tableLeft + dateWidth, y, tableWidth - dateWidth, 28, "#f2f2f2");
  doc.font(BOLD).fontSize(12).fillColor("#000").text("Date", tableLeft, y + 7, { width: dateWidth, align: "center" });
  doc.text("No. of Hours", tableLeft + dateWidth, y + 8, { width: tableWidth - dateWidth, align: "center" });
  y += 28;
  for (const service of services) {
    box(doc, tableLeft, y, dateWidth, rowHeight); box(doc, tableLeft + dateWidth, y, tableWidth - dateWidth, rowHeight);
    doc.font(REGULAR).fontSize(services.length > 10 ? 9.5 : 12).text(formatDate(service.date), tableLeft, y + (services.length > 10 ? 5 : 6), { width: dateWidth, align: "center" });
    doc.text(formatHours(service.hours), tableLeft + dateWidth, y + (services.length > 10 ? 5 : 7), { width: tableWidth - dateWidth, align: "center" });
    y += rowHeight;
  }

  y += 22;
  doc.font(REGULAR).fontSize(12).text("This certification is issued to attest that the above-mentioned JO has satisfactorily rendered the services indicated herein and is being submitted to the Human Resource Department for reference in the processing of remuneration covering the payroll period ", LEFT, y, { width: WIDTH, indent: 36, lineGap: 5, continued: true });
  doc.text(`${certificationPeriodLabel(period)}.`, { underline: true });

  const signatureY = Math.min(690, Math.max(535, y + 75));
  doc.font(BOLD).fontSize(12).text((profile.certifyingOfficerName || "CERTIFYING OFFICER").toUpperCase(), LEFT, signatureY, { width: WIDTH, align: "center" });
  const position = profile.certifyingOfficerPosition || "Certifying Officer Position";
  const [firstLine, ...remaining] = position.split(/,\s*/);
  doc.font(REGULAR).fontSize(12).text(`${firstLine}${remaining.length ? "," : ""}`, LEFT, signatureY + 15, { width: WIDTH, align: "center" });
  if (remaining.length) doc.text(remaining.join(", "), LEFT, signatureY + 29, { width: WIDTH, align: "center" });

  if (existsSync(ISO_LOGO)) doc.image(ISO_LOGO, 52, 755, { width: 58, height: 61 });
  doc.end();
  return completed;
}
