"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WORKWEEK_TYPES } from "@/lib/report-types";

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string[]> };

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  position: z.string().trim().min(1, "Position is required."),
  department: z.string().trim().min(1, "Office / Department is required."),
  workweekType: z.enum(WORKWEEK_TYPES),
  approvingOfficerName: z.string().trim().optional(),
  approvingOfficerPosition: z.string().trim().optional(),
});

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: "Review the highlighted fields.", errors: parsed.error.flatten().fieldErrors };
  try {
    const existingProfile = await prisma.employeeProfile.findUnique({ where: { id: 1 }, select: { workweekType: true } });
    await prisma.employeeProfile.upsert({ where: { id: 1 }, update: { ...parsed.data, approvingOfficerName: parsed.data.approvingOfficerName || null, approvingOfficerPosition: parsed.data.approvingOfficerPosition || null }, create: { id: 1, ...parsed.data } });
    if (existingProfile?.workweekType !== parsed.data.workweekType) {
      const fridayDays = await prisma.reportDay.findMany({
        where: { dayStatus: parsed.data.workweekType === "COMPRESSED" ? "WORKING" : "WEEKEND" },
        select: { id: true, date: true },
      });
      const fridayIds = fridayDays.filter((day) => day.date.getUTCDay() === 5).map((day) => day.id);
      if (fridayIds.length) {
        await prisma.reportDay.updateMany({
          where: { id: { in: fridayIds } },
          data: { dayStatus: parsed.data.workweekType === "COMPRESSED" ? "WEEKEND" : "WORKING" },
        });
      }
    }
    revalidatePath("/profile"); revalidatePath("/reports", "layout");
    return { ok: true, message: "Profile saved." };
  } catch { return { message: "Unable to save your profile." }; }
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
