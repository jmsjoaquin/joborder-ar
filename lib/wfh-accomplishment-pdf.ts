import PDFDocument from "pdfkit";
import path from "node:path";
import { existsSync } from "node:fs";
import { formatWorkDate } from "./dates";

export type WfhPdfProfile = {
  fullName: string;
  position: string;
  officeShortName: string;
  wfhApproverName: string | null;
  wfhApproverPosition: string | null;
};

export type WfhPdfTask = { perspective: string; target: string; accomplished: string; notes: string };
export type WfhPdfDay = { date: Date; hours: number; startTime: string; endTime: string; tasks: WfhPdfTask[] };

const LETTERHEAD = path.join(process.cwd(), "public/document-assets/philhealth-letterhead.png");
const GEORGIA = "/System/Library/Fonts/Supplemental/Georgia.ttf";
const GEORGIA_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf";
const REGULAR = existsSync(GEORGIA) ? "Georgia" : "Times-Roman";
const BOLD = existsSync(GEORGIA_BOLD) ? "GeorgiaBold" : "Times-Bold";
const PAGE_HEIGHT = 841.89;
const LEFT = 54;
const WIDTH = 496;
const COLS = [85, 122, 163, 126] as const;

export function groupPerspectiveRows(rows: { perspective: string; height: number }[]) {
  return rows.reduce<Array<{ perspective: string; startIndex: number; rowCount: number; height: number }>>((groups, row, index) => {
    const current = groups.at(-1);
    if (current?.perspective === row.perspective) {
      current.rowCount += 1;
      current.height += row.height;
    } else {
      groups.push({ perspective: row.perspective, startIndex: index, rowCount: 1, height: row.height });
    }
    return groups;
  }, []);
}

function timeLabel(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function box(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, fill?: string) {
  if (fill) doc.save().fillColor(fill).rect(x, y, width, height).fill().restore();
  doc.lineWidth(0.55).strokeColor("#000000").rect(x, y, width, height).stroke();
}

function drawLetterhead(doc: PDFKit.PDFDocument) {
  doc.image(LETTERHEAD, 45, 32, { width: 540, height: 73 });
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number) {
  let x = LEFT;
  COLS.forEach((width) => { box(doc, x, y, width, 34, "#fff2cc"); x += width; });
  doc.fillColor("#000").font(BOLD).fontSize(11);
  doc.text("BSC\nPerspective", LEFT + 2, y + 5, { width: COLS[0] - 4, align: "center" });
  doc.text("Targets", LEFT + COLS[0], y + 3, { width: COLS[1], align: "center" });
  doc.font(REGULAR).fontSize(8).text("(Deliverables/Tasks to Do)", LEFT + COLS[0] + 2, y + 17, { width: COLS[1] - 4, align: "center" });
  doc.font(BOLD).fontSize(11).text("Accomplished", LEFT + COLS[0] + COLS[1], y + 9, { width: COLS[2], align: "center" });
  doc.text("Notes", LEFT + COLS[0] + COLS[1] + COLS[2], y + 2, { width: COLS[3], align: "center" });
  doc.font(REGULAR).fontSize(8).text("(Indicate dates, status and other details)", LEFT + COLS[0] + COLS[1] + COLS[2] + 2, y + 16, { width: COLS[3] - 4, align: "center" });
  return y + 34;
}

function startPage(doc: PDFKit.PDFDocument, profile: WfhPdfProfile, day: WfhPdfDay, continuation = false) {
  doc.addPage({ size: "A4", layout: "portrait", margin: 0 });
  drawLetterhead(doc);
  doc.fillColor("#000").font(BOLD).fontSize(11).text("Work From Home (WFH)", LEFT, 121, { width: WIDTH, align: "center" });
  doc.text(`Accomplishment for ${formatWorkDate(day.date)}, ${timeLabel(day.startTime)}-${timeLabel(day.endTime)}`, LEFT, 134, { width: WIDTH, align: "center" });
  if (!continuation) {
    doc.font(REGULAR).fontSize(11).text("Name of Employee:", LEFT + 5, 158);
    doc.font(REGULAR).text(profile.fullName.toUpperCase(), LEFT + 115, 158, { underline: true });
    doc.font(REGULAR).text("Schedule Agreed with Supervisor:", LEFT + 305, 158);
    doc.text("Office:", LEFT + 5, 174);
    doc.text(profile.officeShortName.toUpperCase(), LEFT + 115, 174, { underline: true });
    doc.text(`WFH (Full Time):  ${day.date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })}`, LEFT + 305, 174, { underline: true });
  }
  return drawTableHeader(doc, continuation ? 166 : 195);
}

function drawFooter(doc: PDFKit.PDFDocument, profile: WfhPdfProfile, y: number) {
  const noteHeight = 70;
  box(doc, LEFT, y, WIDTH, noteHeight);
  doc.font(REGULAR).fontSize(11).text("N.B.\nThe supervisor may assign other tasks in addition to the agreed WFH deliverables. ", LEFT + 5, y + 5, { width: WIDTH - 10, lineGap: 1, continued: true });
  doc.font(BOLD).text("Specific outputs/tasks accomplished for the day must be clearly stated in the 3rd column", { underline: true, continued: true });
  doc.font(REGULAR).text(" with the dates and other details written in the notes.");
  y += noteHeight + 14;
  doc.font(REGULAR).fontSize(11).text("I hereby certify that the foregoing accomplishments declared in this report are true and correct to the best of my knowledge and belief. This report is open for validation and audit by the proper authority in the Corporation.", LEFT, y, { width: WIDTH, align: "justify" });
  y += 56;
  doc.moveTo(198, y).lineTo(397, y).stroke();
  doc.font(BOLD).fontSize(9).text(profile.fullName.toUpperCase(), 198, y + 3, { width: 199, align: "center" });
  doc.font(REGULAR).text(profile.position, 198, y + 16, { width: 199, align: "center" });
  doc.text("Date Prepared: __________________", 204, y + 42, { width: 190, align: "center" });
  doc.font(BOLD).text("APPROVED BY", LEFT, y + 72, { width: WIDTH, align: "center" });
  const approverY = y + 115;
  doc.moveTo(180, approverY).lineTo(415, approverY).stroke();
  doc.text((profile.wfhApproverName || "WFH APPROVER").toUpperCase(), 180, approverY + 3, { width: 235, align: "center" });
  doc.font(REGULAR).text((profile.wfhApproverPosition || "WFH APPROVER POSITION").toUpperCase(), 170, approverY + 16, { width: 255, align: "center" });
  doc.text("Date Signed: __________________", 190, approverY + 34, { width: 215, align: "center" });
}

export async function generateWfhAccomplishmentPdf(profile: WfhPdfProfile, day: WfhPdfDay) {
  const doc = new PDFDocument({ autoFirstPage: false, margin: 0, bufferPages: true, info: { Title: `WFH Accomplishment - ${formatWorkDate(day.date)}`, Author: profile.fullName } });
  if (existsSync(GEORGIA)) doc.registerFont("Georgia", GEORGIA);
  if (existsSync(GEORGIA_BOLD)) doc.registerFont("GeorgiaBold", GEORGIA_BOLD);
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });
  let y = startPage(doc, profile, day);
  const MAX_ROW_HEIGHT = 400;
  const measuredRows = day.tasks.map((task) => {
    doc.font(REGULAR).fontSize(11);
    const heights = [task.perspective, task.target, task.accomplished, task.notes].map((text, index) => doc.heightOfString(text || " ", { width: COLS[index] - 8, lineGap: 1 }));
    const height = Math.max(30, ...heights.map((value) => value + 10));
    if (height > MAX_ROW_HEIGHT) throw new Error("A WFH task is too long for the official form. Split it into smaller task rows.");
    return { task, perspective: task.perspective, height };
  });

  function drawPageRows(rows: typeof measuredRows, startY: number) {
    const groups = groupPerspectiveRows(rows);
    let groupY = startY;
    for (const group of groups) {
      box(doc, LEFT, groupY, COLS[0], group.height);
      doc.font(REGULAR).fontSize(11).text(group.perspective, LEFT + 4, groupY + 5, { width: COLS[0] - 8, lineGap: 1 });
      let rowY = groupY;
      for (const row of rows.slice(group.startIndex, group.startIndex + group.rowCount)) {
        let x = LEFT + COLS[0];
        [row.task.target, row.task.accomplished, row.task.notes].forEach((text, index) => {
          box(doc, x, rowY, COLS[index + 1], row.height);
          doc.text(text, x + 4, rowY + 5, { width: COLS[index + 1] - 8, lineGap: 1 });
          x += COLS[index + 1];
        });
        rowY += row.height;
      }
      groupY += group.height;
    }
    return groupY;
  }

  let pageRows: typeof measuredRows = [];
  let pageRowsHeight = 0;
  for (const row of measuredRows) {
    if (pageRows.length && y + pageRowsHeight + row.height > 650) {
      y = drawPageRows(pageRows, y);
      y = startPage(doc, profile, day, true);
      pageRows = [];
      pageRowsHeight = 0;
    }
    pageRows.push(row);
    pageRowsHeight += row.height;
  }
  if (pageRows.length) y = drawPageRows(pageRows, y);
  if (y + 305 > PAGE_HEIGHT - 20) y = startPage(doc, profile, day, true);
  drawFooter(doc, profile, y);
  const pages = doc.bufferedPageRange().count;
  for (let index = 0; index < pages; index += 1) { doc.switchToPage(index); doc.font(REGULAR).fontSize(7).text(`Page ${index + 1} of ${pages}`, 490, 810, { width: 60, align: "right" }); }
  doc.end();
  return completed;
}
