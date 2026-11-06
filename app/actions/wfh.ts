"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dailyFieldsFromWfhTasks } from "@/lib/wfh-tasks";
import { refreshReportStatus } from "@/lib/reports";

const taskSchema = z.object({
  perspective: z.string().trim().min(1).max(200),
  target: z.string().trim().min(1).max(5000),
  accomplished: z.string().trim().min(1).max(50000),
  notes: z.string().trim().max(5000),
});

const saveSchema = z.object({
  reportId: z.string().min(1),
  dayId: z.string().min(1),
  hours: z.number().positive().max(24),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  includeInCertification: z.boolean(),
  tasks: z.array(taskSchema).min(1).max(50),
});

export async function saveWfhDay(input: z.infer<typeof saveSchema>) {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Complete the WFH schedule and every task row." };

  const [startHour, startMinute] = parsed.data.startTime.split(":").map(Number);
  const [endHour, endMinute] = parsed.data.endTime.split(":").map(Number);
  if (endHour * 60 + endMinute <= startHour * 60 + startMinute) return { ok: false as const, message: "WFH end time must be later than the start time." };

  const day = await prisma.reportDay.findFirst({ where: { id: parsed.data.dayId, reportId: parsed.data.reportId } });
  if (!day || day.dayStatus !== "WFH") return { ok: false as const, message: "This date is not marked as WFH." };

  const daily = dailyFieldsFromWfhTasks(parsed.data.tasks);
  await prisma.$transaction(async (tx) => {
    await tx.wfhTask.deleteMany({ where: { reportDayId: day.id } });
    await tx.wfhTask.createMany({ data: parsed.data.tasks.map((task, sortOrder) => ({ reportDayId: day.id, ...task, sortOrder })) });
    await tx.reportDay.update({
      where: { id: day.id },
      data: {
        wfhHours: parsed.data.hours,
        wfhStartTime: parsed.data.startTime,
        wfhEndTime: parsed.data.endTime,
        includeInServiceCertification: parsed.data.includeInCertification,
        target: daily.target,
        output: daily.output,
        taskStatus: "COMPLETED",
        completionPercentage: 100,
      },
    });
  });
  await refreshReportStatus(parsed.data.reportId);
  revalidatePath(`/reports/${parsed.data.reportId}`);
  revalidatePath(`/reports/${parsed.data.reportId}/wfh/${day.id}`);
  revalidatePath("/reports");
  return { ok: true as const };
}
