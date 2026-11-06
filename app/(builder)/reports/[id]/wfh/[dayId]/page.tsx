import { notFound, redirect } from "next/navigation";
import { WfhDayEditor } from "@/components/wfh/wfh-day-editor";
import { dateKey } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { ensureProfile } from "@/lib/reports";
import { seedWfhTasks } from "@/lib/wfh-tasks";

export const dynamic = "force-dynamic";

export default async function WfhDayPage({ params }: { params: Promise<{ id: string; dayId: string }> }) {
  const { id, dayId } = await params;
  const [day, profile] = await Promise.all([
    prisma.reportDay.findFirst({ where: { id: dayId, reportId: id }, include: { wfhTasks: { orderBy: { sortOrder: "asc" } } } }),
    ensureProfile(),
  ]);
  if (!day) notFound();
  if (day.dayStatus !== "WFH") redirect(`/reports/${id}?tab=dates`);

  const tasks = day.wfhTasks.length
    ? day.wfhTasks.map((task) => ({ id: task.id, perspective: task.perspective, target: task.target, accomplished: task.accomplished, notes: task.notes }))
    : seedWfhTasks({ target: day.target, output: day.output, perspective: profile.defaultBscPerspective });
  return <WfhDayEditor reportId={id} dayId={day.id} date={dateKey(day.date)} initialHours={day.wfhHours ?? profile.defaultWfhHours} initialStartTime={day.wfhStartTime ?? profile.defaultWfhStartTime} initialEndTime={day.wfhEndTime ?? profile.defaultWfhEndTime} initialInclude={day.includeInServiceCertification} initialTasks={tasks} />;
}
