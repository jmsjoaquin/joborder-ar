"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WORKWEEK_TYPES } from "@/lib/report-types";

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string[]> };

const optionalText = z.string().trim().optional().transform((value) => value || null);
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  position: z.string().trim().min(1, "Position is required."),
  department: z.string().trim().min(1, "Office / Department is required."),
  officeShortName: z.string().trim().min(1, "WFH office is required."),
  fullDepartmentName: z.string().trim().min(1, "Full department name is required."),
  workweekType: z.enum(WORKWEEK_TYPES),
  defaultWfhEnabled: z.boolean(),
  defaultWfhWeekday: z.coerce.number().int().min(0).max(6),
  defaultWfhHours: z.coerce.number().positive().max(24),
  defaultWfhStartTime: z.string().regex(timePattern, "Enter a valid start time."),
  defaultWfhEndTime: z.string().regex(timePattern, "Enter a valid end time."),
  defaultBscPerspective: z.string().trim().min(1, "BSC perspective is required."),
  approvingOfficerName: optionalText,
  approvingOfficerPosition: optionalText,
  certifyingOfficerName: optionalText,
  certifyingOfficerPosition: optionalText,
  wfhApproverName: optionalText,
  wfhApproverPosition: optionalText,
});

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const values = Object.fromEntries(formData);
  const parsed = profileSchema.safeParse({ ...values, defaultWfhEnabled: formData.get("defaultWfhEnabled") === "on" });
  if (!parsed.success) return { message: "Review the highlighted fields.", errors: parsed.error.flatten().fieldErrors };
  const [startHour, startMinute] = parsed.data.defaultWfhStartTime.split(":").map(Number);
  const [endHour, endMinute] = parsed.data.defaultWfhEndTime.split(":").map(Number);
  if (endHour * 60 + endMinute <= startHour * 60 + startMinute) return { message: "Default WFH end time must be later than the start time.", errors: { defaultWfhEndTime: ["Choose a later end time."] } };

  try {
    const existing = await prisma.employeeProfile.findUnique({ where: { id: 1 }, select: { workweekType: true } });
    await prisma.employeeProfile.upsert({
      where: { id: 1 },
      update: parsed.data,
      create: { id: 1, ...parsed.data },
    });
    if (existing && existing.workweekType !== parsed.data.workweekType) {
      const candidateDays = await prisma.reportDay.findMany({
        where: { dayStatus: { in: ["WORKING", "WEEKEND"] } },
        select: { id: true, date: true, dayStatus: true },
      });
      const fridayIds = candidateDays
        .filter((day) => day.date.getUTCDay() === 5)
        .filter((day) => parsed.data.workweekType === "COMPRESSED" ? day.dayStatus === "WORKING" : day.dayStatus === "WEEKEND")
        .map((day) => day.id);
      if (fridayIds.length) await prisma.reportDay.updateMany({ where: { id: { in: fridayIds } }, data: { dayStatus: parsed.data.workweekType === "COMPRESSED" ? "WEEKEND" : "WORKING" } });
    }
    revalidatePath("/profile");
    revalidatePath("/reports", "layout");
    return { ok: true, message: "Profile and WFH defaults saved." };
  } catch {
    return { message: "Unable to save your profile." };
  }
}

const targetSchema = z.object({ name: z.string().trim().min(1), targetText: z.string().trim().min(1) });

export async function saveTarget(input: { id?: string; name: string; targetText: string }) {
  const parsed = targetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Name and target text are required." };
  if (input.id) await prisma.savedTarget.update({ where: { id: input.id }, data: parsed.data });
  else await prisma.savedTarget.create({ data: parsed.data });
  revalidatePath("/saved-targets"); revalidatePath("/reports");
  return { ok: true };
}

export async function deleteSavedTarget(id: string) {
  await prisma.savedTarget.delete({ where: { id } });
  revalidatePath("/saved-targets"); revalidatePath("/reports");
  return { ok: true };
}
