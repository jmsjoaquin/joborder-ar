import PDFDocument from "pdfkit";
import { existsSync } from "node:fs";
import { formatWorkDate, type ReportingPeriod } from "@/lib/dates";
import { isMeetingReportItem, outputAsBulletedList, splitReportItems } from "@/lib/report-format";
import { humanizeEnum } from "@/lib/utils";

type ReportUser = {
  fullName: string;
  position: string;
  department: string;
  approvingOfficerName: string | null;
  approvingOfficerPosition: string | null;
};

type ReportEntry = {
  date: Date;
  target: string;
  status: string;
  completionPercentage: number;
  output: string;
  showStatus: boolean;
};

type ReportRow = ReportEntry & { displayStatus: boolean };

const PAGE_HEIGHT = 595.28;
const LEFT = 52;
const TABLE_WIDTH = 732;
const COLUMNS = [93, 235, 225, 179] as const;
const BOTTOM = 54;
const FONT_SIZE = 8.3;
const GEORGIA_REGULAR = "/System/Library/Fonts/Supplemental/Georgia.ttf";
const GEORGIA_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf";
const HAS_GEORGIA = existsSync(GEORGIA_REGULAR) && existsSync(GEORGIA_BOLD);
const REGULAR_FONT = HAS_GEORGIA ? "Georgia" : "Times-Roman";
const BOLD_FONT = HAS_GEORGIA ? "Georgia-Bold" : "Times-Bold";

function reportPeriodLabel(period: ReportingPeriod) {
  const month = period.start.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const startDay = String(period.start.getUTCDate()).padStart(2, "0");
  if (period.start.getUTCMonth() === period.end.getUTCMonth()) {
    return `${month} ${startDay} to ${period.end.getUTCDate()}, ${period.end.getUTCFullYear()}`;
  }
  const endMonth = period.end.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  return `${month} ${startDay} to ${endMonth} ${period.end.getUTCDate()}, ${period.end.getUTCFullYear()}`;
}

function drawBox(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number) {
  doc.lineWidth(0.7).rect(x, y, width, height).stroke("#000000");
}

function drawFirstPageHeader(doc: PDFKit.PDFDocument, user: ReportUser, period: ReportingPeriod) {
  doc.fillColor("#000000");
  doc.font(BOLD_FONT).fontSize(9.6);
  const annexTitle = "Annex C: Individual Daily Accomplishment Report";
  doc.text(annexTitle, LEFT + TABLE_WIDTH - doc.widthOfString(annexTitle), 54, { lineBreak: false });
  doc.font(BOLD_FONT).fontSize(8.3).text("JOB ORDER DAILY ACCOMPLISHMENT REPORT", LEFT, 67, { width: TABLE_WIDTH, align: "center" });
  doc.font(REGULAR_FONT).fontSize(8.3).text(`For the period ${reportPeriodLabel(period)}`, LEFT, 78, { width: TABLE_WIDTH, align: "center" });

  const profileTop = 86;
  const profileRows = [
    ["Name", user.fullName],
    ["Position:", user.position],
    ["Office Department:", user.department],
    ["", ""],
  ];
  profileRows.forEach(([label, value], index) => {
    const y = profileTop + index * 10;
    let x = LEFT;
    COLUMNS.forEach((width) => { drawBox(doc, x, y, width, 10); x += width; });
    doc.font(REGULAR_FONT).fontSize(FONT_SIZE).text(label, LEFT + 2, y + 1, { width: COLUMNS[0] - 4, height: 9 });
    if (value) doc.font(BOLD_FONT).text(value, LEFT + COLUMNS[0] + 2, y + 1, { width: COLUMNS[1] - 4, height: 9 });
  });
  return drawColumnHeader(doc, profileTop + 40);
}

function drawColumnHeader(doc: PDFKit.PDFDocument, y: number) {
  const height = 20;
  let x = LEFT;
  COLUMNS.forEach((width) => { drawBox(doc, x, y, width, height); x += width; });
  doc.font(BOLD_FONT).fontSize(FONT_SIZE);
  doc.text("Date", LEFT, y + 5, { width: COLUMNS[0], align: "center" });
  doc.text("Targets", LEFT + COLUMNS[0], y + 9, { width: COLUMNS[1], align: "center" });
  const regularX = LEFT + COLUMNS[0] + COLUMNS[1];
  doc.text("Output", regularX, y + 3, { width: COLUMNS[2], align: "center" });
  doc.font(REGULAR_FONT).text("(during regular working hours)", regularX, y + 11, { width: COLUMNS[2], align: "center" });
  const overtimeX = regularX + COLUMNS[2];
  doc.font(BOLD_FONT).text("Output", overtimeX, y + 3, { width: COLUMNS[3], align: "center" });
  doc.font(REGULAR_FONT).text("(during overtime, if Applicable)", overtimeX, y + 11, { width: COLUMNS[3], align: "center" });
  return y + height;
}

function splitEntryRows(entry: ReportEntry): ReportRow[] {
  if (!entry.showStatus && entry.target === "Work From Home") return [{ ...entry, displayStatus: false }];
  const targets = splitReportItems(entry.target);
  const outputs = splitReportItems(entry.output);
  const count = Math.max(1, targets.length, outputs.length);
  return Array.from({ length: count }, (_, index) => {
    const target = targets[index] ?? "";
    const output = outputs[index] ?? "";
    return {
      ...entry,
      target,
      output,
      displayStatus: entry.showStatus && !isMeetingReportItem(`${target} ${output}`),
    };
  });
}

function rowHeight(doc: PDFKit.PDFDocument, entry: ReportRow) {
  if (!entry.showStatus && entry.target === "Work From Home") return 10;
  const formattedOutput = outputAsBulletedList(entry.output);
  const targetHeight = doc.font(BOLD_FONT).fontSize(FONT_SIZE).heightOfString(entry.target, { width: COLUMNS[1] - 4, lineGap: 0.5 });
  const outputHeight = doc.font(REGULAR_FONT).fontSize(FONT_SIZE).heightOfString(formattedOutput, { width: COLUMNS[2] - 5, lineGap: 0.5 });
  const statusHeight = entry.displayStatus ? doc.font(BOLD_FONT).heightOfString(`Status: ${humanizeEnum(entry.status)} ${entry.completionPercentage}%`, { width: COLUMNS[2] - 5 }) : 0;
  return Math.ceil(Math.max(48, targetHeight + 9, outputHeight + statusHeight + 11));
}

function drawDateCell(doc: PDFKit.PDFDocument, entry: ReportRow, y: number, height: number) {
  drawBox(doc, LEFT, y, COLUMNS[0], height);
  doc.fillColor("#000000").font(REGULAR_FONT).fontSize(FONT_SIZE);
  const label = formatWorkDate(entry.date);
  const labelHeight = doc.heightOfString(label, { width: COLUMNS[0] - 4, align: "center" });
  doc.text(label, LEFT + 2, y + Math.max(3, (height - labelHeight) / 2), { width: COLUMNS[0] - 4, align: "center" });
}

function drawEntryRow(doc: PDFKit.PDFDocument, entry: ReportRow, y: number, height: number, includeDate = true) {
  if (!entry.showStatus && entry.target === "Work From Home") {
    drawBox(doc, LEFT, y, COLUMNS[0], height);
    drawBox(doc, LEFT + COLUMNS[0], y, COLUMNS[1] + COLUMNS[2], height);
    drawBox(doc, LEFT + COLUMNS[0] + COLUMNS[1] + COLUMNS[2], y, COLUMNS[3], height);
    doc.fillColor("#000000").font(REGULAR_FONT).fontSize(FONT_SIZE).text(formatWorkDate(entry.date), LEFT + 2, y + 0.2, { width: COLUMNS[0] - 4, height: height - 0.4, align: "center", lineBreak: false });
    doc.font(BOLD_FONT).text(entry.target, LEFT + COLUMNS[0] + 2, y + 0.2, { width: COLUMNS[1] + COLUMNS[2] - 4, height: height - 0.4, align: "center", lineBreak: false });
    return;
  }
  if (includeDate) drawDateCell(doc, entry, y, height);
  let x = LEFT + COLUMNS[0];
  COLUMNS.slice(1).forEach((width) => { drawBox(doc, x, y, width, height); x += width; });
  doc.fillColor("#000000").fontSize(FONT_SIZE);
  doc.font(BOLD_FONT).text(entry.target, LEFT + COLUMNS[0] + 2, y + 3, { width: COLUMNS[1] - 4, lineGap: 0.5, align: entry.showStatus ? "left" : "center" });
  const outputX = LEFT + COLUMNS[0] + COLUMNS[1] + 2;
  const outputY = y + 3;
  const formattedOutput = outputAsBulletedList(entry.output);
  doc.font(REGULAR_FONT).text(formattedOutput, outputX, outputY, { width: COLUMNS[2] - 4, lineGap: 0.5 });
  const outputHeight = doc.heightOfString(formattedOutput, { width: COLUMNS[2] - 4, lineGap: 0.5 });
  if (entry.displayStatus) doc.font(BOLD_FONT).text(`Status: ${humanizeEnum(entry.status)} ${entry.completionPercentage}%`, outputX, outputY + outputHeight + 1, { width: COLUMNS[2] - 4, underline: true });
}

function addLandscapePage(doc: PDFKit.PDFDocument, withTableHeader = false) {
  doc.addPage({ size: "A4", layout: "landscape", margin: 0 });
  return withTableHeader ? drawColumnHeader(doc, 54) : 54;
}

function drawCertification(doc: PDFKit.PDFDocument, user: ReportUser, y: number) {
  const leftWidth = 355;
  const rightWidth = TABLE_WIDTH - leftWidth;
  const statementHeight = 52;
  const nameHeight = 29;
  const titleHeight = 11;
  const leftText = "This is to certify that the tasks I accomplished are within the assigned deliverables/targets/expected outputs or have met the target performance standards as agreed or set forth in the Job Order Contract.";
  const rightText = "This is to certify that the above-named Job Order has satisfactorily delivered the assigned deliverables/targets/expected outputs or have met the target performance standards set forth in the Job Order Contract, thereby constitute payment of corresponding remuneration and/or overtime pay (if applicable) for services rendered.";
  drawBox(doc, LEFT, y, leftWidth, statementHeight);
  drawBox(doc, LEFT + leftWidth, y, rightWidth, statementHeight);
  doc.font(REGULAR_FONT).fontSize(FONT_SIZE).text(leftText, LEFT + 2, y + 3, { width: leftWidth - 4, align: "justify", lineGap: 0.5 });
  doc.text(rightText, LEFT + leftWidth + 2, y + 3, { width: rightWidth - 4, align: "justify", lineGap: 0.5 });

  const nameY = y + statementHeight;
  drawBox(doc, LEFT, nameY, leftWidth, nameHeight);
  drawBox(doc, LEFT + leftWidth, nameY, rightWidth, nameHeight);
  doc.font(BOLD_FONT).text(user.fullName.toUpperCase(), LEFT, nameY + 17, { width: leftWidth, align: "center" });
  doc.text((user.approvingOfficerName || "APPROVING OFFICER").toUpperCase(), LEFT + leftWidth, nameY + 17, { width: rightWidth, align: "center", underline: true });

  const titleY = nameY + nameHeight;
  drawBox(doc, LEFT, titleY, leftWidth, titleHeight);
  drawBox(doc, LEFT + leftWidth, titleY, rightWidth, titleHeight);
  doc.font(REGULAR_FONT).text("Name and signature of Job Order", LEFT, titleY + 2, { width: leftWidth, align: "center" });
  doc.text((user.approvingOfficerPosition || "Approving Officer Position").toUpperCase(), LEFT + leftWidth, titleY + 2, { width: rightWidth, align: "center" });
}

export async function generateAnnexCPdf(user: ReportUser, period: ReportingPeriod, entries: ReportEntry[]) {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0, autoFirstPage: false, info: { Title: `Annex C - ${reportPeriodLabel(period)}`, Author: user.fullName } });
  if (HAS_GEORGIA) {
    doc.registerFont("Georgia", GEORGIA_REGULAR);
    doc.registerFont("Georgia-Bold", GEORGIA_BOLD);
  }
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.addPage({ size: "A4", layout: "landscape", margin: 0 });
  let y = drawFirstPageHeader(doc, user, period);
  if (!entries.length) {
    drawBox(doc, LEFT, y, TABLE_WIDTH, 48);
    doc.font(REGULAR_FONT).fontSize(FONT_SIZE).text("No accomplishment entries for this reporting period.", LEFT, y + 18, { width: TABLE_WIDTH, align: "center" });
    y += 48;
  } else {
    const pageCapacity = PAGE_HEIGHT - BOTTOM - 54;
    for (const entry of entries) {
      const rows = splitEntryRows(entry);
      const heights = rows.map((row) => rowHeight(doc, row));
      const groupHeight = heights.reduce((sum, height) => sum + height, 0);

      if (rows.length === 1 && !entry.showStatus && entry.target === "Work From Home") {
        if (y + heights[0] > PAGE_HEIGHT - BOTTOM) y = addLandscapePage(doc);
        drawEntryRow(doc, rows[0], y, heights[0]);
        y += heights[0];
        continue;
      }

      if (groupHeight <= pageCapacity && y + groupHeight > PAGE_HEIGHT - BOTTOM) y = addLandscapePage(doc);
      let rowIndex = 0;
      while (rowIndex < rows.length) {
        if (y + heights[rowIndex] > PAGE_HEIGHT - BOTTOM) y = addLandscapePage(doc);
        const segmentStart = rowIndex;
        let segmentHeight = 0;
        while (rowIndex < rows.length && y + segmentHeight + heights[rowIndex] <= PAGE_HEIGHT - BOTTOM) {
          segmentHeight += heights[rowIndex];
          rowIndex += 1;
        }
        if (rowIndex === segmentStart) {
          segmentHeight = heights[rowIndex];
          rowIndex += 1;
        }
        drawDateCell(doc, rows[segmentStart], y, segmentHeight);
        for (let index = segmentStart; index < rowIndex; index += 1) {
          drawEntryRow(doc, rows[index], y, heights[index], false);
          y += heights[index];
        }
        if (rowIndex < rows.length) y = addLandscapePage(doc);
      }
    }
  }
  if (y + 96 > PAGE_HEIGHT - BOTTOM) y = addLandscapePage(doc, false);
  drawCertification(doc, user, y);
  doc.end();
  return completed;
}
