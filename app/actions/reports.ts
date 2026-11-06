"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { DAY_STATUSES, TASK_STATUSES } from "@/lib/report-types";
import { getPreviousReport, refreshReportStatus } from "@/lib/reports";
import { parseAccomplishmentReport } from "@/lib/accomplishment-import";

const dayUpdateSchema = z.object({
  dayId: z.string().min(1),
  reportId: z.string().min(1),
  target: z.string().max(5000),
  output: z.string().max(50000),
  taskStatus: z.enum(TASK_STATUSES),
  completionPercentage: z.number().int().min(0).max(100),
});

export async function saveReportDay(input: z.infer<typeof dayUpdateSchema>) {
  const parsed = dayUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Unable to save. Check the entry values." };
  const day = await prisma.reportDay.findFirst({ where: { id: parsed.data.dayId, reportId: parsed.data.reportId } });
  if (!day) return { ok: false, message: "Report date not found." };
  try {
    await prisma.reportDay.update({ where: { id: day.id }, data: {
      target: parsed.data.target,
      output: parsed.data.output,
      taskStatus: parsed.data.taskStatus,
      completionPercentage: parsed.data.completionPercentage,
    } });
    await refreshReportStatus(input.reportId);
    revalidatePath(`/reports/${input.reportId}`); revalidatePath("/reports");
    return { ok: true, savedAt: Date.now() };
  } catch { return { ok: false, message: "Unable to save this date. Please try again." }; }
}

export async function importAccomplishmentReport(input: { reportId: string; content: string }) {
  const parsed = z.object({ reportId: z.string().min(1), content: z.string().trim().min(1).max(100000) }).safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Paste a valid accomplishment report first." };

  const imported = parseAccomplishmentReport(parsed.data.content);
  if (!imported.length) return { ok: false as const, message: "No dated daily accomplishments were found. Use headings like ### October 19, 2026." };

  const report = await prisma.report.findUnique({ where: { id: parsed.data.reportId }, include: { days: true } });
  if (!report) return { ok: false as const, message: "Report not found." };

  const daysByDate = new Map(report.days.map((day) => [day.date.toISOString().slice(0, 10), day]));
  const matched = imported.flatMap((entry) => {
    const day = daysByDate.get(entry.date);
    return day ? [{ day, entry }] : [];
  });
  if (!matched.length) return { ok: false as const, message: "The pasted dates do not belong to this reporting period." };

  await prisma.$transaction(matched.map(({ day, entry }) => prisma.reportDay.update({
    where: { id: day.id },
    data: { target: entry.target, output: entry.output, taskStatus: "COMPLETED", completionPercentage: 100 },
  })));
  await refreshReportStatus(parsed.data.reportId);
  revalidatePath(`/reports/${parsed.data.reportId}`);
  revalidatePath("/reports");

  const matchedDates = new Set(matched.map(({ entry }) => entry.date));
  return {
    ok: true as const,
    imported: matched.map(({ day, entry }) => ({ id: day.id, target: entry.target, output: entry.output })),
    unmatchedDates: imported.filter((entry) => !matchedDates.has(entry.date)).map((entry) => entry.date),
  };
}

export async function setDayStatus(input: { reportId: string; dayIds: string[]; status: string }) {
  const parsed = z.object({ reportId: z.string().min(1), dayIds: z.array(z.string()).min(1), status: z.enum(DAY_STATUSES) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Select at least one date and a valid status." };
  await prisma.reportDay.updateMany({ where: { reportId: parsed.data.reportId, id: { in: parsed.data.dayIds } }, data: { dayStatus: parsed.data.status } });
  await refreshReportStatus(parsed.data.reportId);
  revalidatePath(`/reports/${parsed.data.reportId}`); revalidatePath("/reports");
  return { ok: true };
}

export async function assignBulkTarget(input: { reportId: string; dayIds: string[]; target: string }) {
  const parsed = z.object({ reportId: z.string().min(1), dayIds: z.array(z.string()).min(1), target: z.string().trim().min(1).max(5000) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Select dates and enter a target." };
  await prisma.reportDay.updateMany({ where: { reportId: parsed.data.reportId, id: { in: parsed.data.dayIds } }, data: { target: parsed.data.target } });
  await refreshReportStatus(parsed.data.reportId);
  revalidatePath(`/reports/${parsed.data.reportId}`); revalidatePath("/reports");
  return { ok: true };
}

export async function markCompleted(input: { reportId: string; dayIds?: string[] }) {
  const report = await prisma.report.findUnique({ where: { id: input.reportId }, include: { days: true } });
  if (!report) return { ok: false, message: "Report not found." };
  const selected = input.dayIds?.length ? new Set(input.dayIds) : null;
  const ids = report.days.filter((day) => (!selected || selected.has(day.id)) && Boolean(day.target.trim() || day.output.trim())).map((day) => day.id);
  if (!ids.length) return { ok: false, message: "No populated entries selected." };
  await prisma.reportDay.updateMany({ where: { reportId: input.reportId, id: { in: ids } }, data: { taskStatus: "COMPLETED", completionPercentage: 100 } });
  await refreshReportStatus(input.reportId);
  revalidatePath(`/reports/${input.reportId}`); revalidatePath("/reports");
  return { ok: true };
}

export async function copyTargetsFromPrevious(input: { reportId: string; dayIds: string[] }) {
  const report = await prisma.report.findUnique({ where: { id: input.reportId }, include: { days: { orderBy: { sortOrder: "asc" } } } });
  if (!report) return { ok: false, message: "Report not found." };
  const previous = await getPreviousReport(report.periodStart);
  if (!previous) return { ok: false, message: "No previous cutoff is available." };
  const currentWorkdays = report.days.filter((day) => day.dayStatus === "WORKING" || day.dayStatus === "WFH");
  const previousWorkdays = previous.days.filter((day) => (day.dayStatus === "WORKING" || day.dayStatus === "WFH") && day.target.trim());
  const selected = new Set(input.dayIds);
  const copied = currentWorkdays.flatMap((day, index) => selected.has(day.id) && previousWorkdays[index]?.target ? [{ id: day.id, target: previousWorkdays[index].target }] : []);
  if (!copied.length) return { ok: false, message: "No matching previous targets were found for the selected dates." };
  await prisma.$transaction(copied.map((item) => prisma.reportDay.update({ where: { id: item.id }, data: { target: item.target } })));
  await refreshReportStatus(input.reportId);
  revalidatePath(`/reports/${input.reportId}`); revalidatePath("/reports");
  return { ok: true, copied };
}
