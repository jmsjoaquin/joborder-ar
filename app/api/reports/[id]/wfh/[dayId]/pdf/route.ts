import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { dateKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { ensureProfile } from "@/lib/reports";
import { generateWfhAccomplishmentPdf } from "@/lib/wfh-accomplishment-pdf";
import { seedWfhTasks } from "@/lib/wfh-tasks";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; dayId: string }> }) {
  const { id, dayId } = await params;
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const [day, profile] = await Promise.all([
    prisma.reportDay.findFirst({ where: { id: dayId, reportId: id }, include: { wfhTasks: { orderBy: { sortOrder: "asc" } } } }),
    ensureProfile(),
  ]);
  if (!day) return NextResponse.json({ message: "WFH date not found." }, { status: 404 });
  if (day.dayStatus !== "WFH") return NextResponse.json({ message: "This date is not marked as WFH." }, { status: 400 });
  const tasks = day.wfhTasks.length ? day.wfhTasks : seedWfhTasks({ target: day.target, output: day.output, perspective: profile.defaultBscPerspective });
  if (!tasks.length || tasks.some((task) => !task.perspective.trim() || !task.target.trim() || !task.accomplished.trim())) return NextResponse.json({ message: "Complete every WFH task row before generating the form." }, { status: 400 });
  const pdf = await generateWfhAccomplishmentPdf(profile, { date: day.date, hours: day.wfhHours ?? profile.defaultWfhHours, startTime: day.wfhStartTime ?? profile.defaultWfhStartTime, endTime: day.wfhEndTime ?? profile.defaultWfhEndTime, tasks }).catch(() => null);
  if (!pdf) return NextResponse.json({ message: "A WFH task is too long for the official form. Split long content into smaller task rows." }, { status: 400 });
  const filename = `WFH_${dateKey(day.date)}_${profile.fullName.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`;
  if (!preview) {
    const directory = path.join(process.cwd(), "generated-reports", "wfh");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), pdf);
  }
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${filename}"`, "Cache-Control": "private, no-store" } });
}
