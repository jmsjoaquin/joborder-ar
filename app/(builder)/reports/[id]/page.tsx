import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Download, FileText, ListChecks } from "lucide-react";
import { AnnexPreview } from "@/components/report-builder/annex-preview";
import { DateSetup, type ReportDayDto } from "@/components/report-builder/date-setup";
import { EntriesEditor } from "@/components/report-builder/entries-editor";
import { ReportReadiness } from "@/components/report-builder/report-readiness";
import { buttonVariants } from "@/components/ui/button";
import { dateKey, formatPeriod } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { reportReadiness, ensureProfile, getPreviousReport } from "@/lib/reports";
import { cn, humanizeEnum } from "@/lib/utils";

const tabs = [{ value: "dates", label: "Dates", icon: CalendarDays }, { value: "entries", label: "Entries", icon: ListChecks }, { value: "preview", label: "Preview", icon: FileText }] as const;

export default async function ReportBuilderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params; const query = await searchParams; const tab = tabs.some((item) => item.value === query.tab) ? query.tab! : "entries";
  const [report, profile, savedTargets] = await Promise.all([prisma.report.findUnique({ where: { id }, include: { days: { orderBy: { sortOrder: "asc" } } } }), ensureProfile(), prisma.savedTarget.findMany({ orderBy: { name: "asc" } })]);
  if (!report) notFound(); const previous = await getPreviousReport(report.periodStart); const readiness = reportReadiness(profile, report.days);
  const dayDtos: ReportDayDto[] = report.days.map((day) => ({ id: day.id, date: dateKey(day.date), dayStatus: day.dayStatus, target: day.target, output: day.output, taskStatus: day.taskStatus, completionPercentage: day.completionPercentage, sortOrder: day.sortOrder }));
  return <div className="page-container space-y-6"><section className="sticky top-16 z-10 -mx-4 border-b border-slate-200 bg-[#f6f7f9]/95 px-4 pb-4 pt-1 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-blue-600">Cutoff report</p><h1 className="mt-1 text-2xl font-bold tracking-tight">{formatPeriod({ start: report.periodStart, end: report.periodEnd })}</h1><p className="mt-1 text-xs font-semibold text-slate-500">{humanizeEnum(report.status)} · Stored locally</p></div><div className="flex gap-2"><Link href="/reports" className={buttonVariants({ variant: "secondary" })}>All Reports</Link><a href={`/api/reports/${report.id}/pdf`} className={buttonVariants()} download><Download size={17} /> Generate PDF</a></div></div><nav className="mt-4 flex w-fit rounded-xl bg-slate-200/70 p-1" aria-label="Report editor tabs">{tabs.map(({ value, label, icon: Icon }) => <Link key={value} href={`/reports/${id}?tab=${value}`} className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold", tab === value ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900")}><Icon size={16} />{label}</Link>)}</nav></section>{tab === "dates" && <DateSetup reportId={id} initialDays={dayDtos} />}{tab === "entries" && <EntriesEditor reportId={id} initialDays={dayDtos} savedTargets={savedTargets.map((target) => ({ id: target.id, name: target.name, targetText: target.targetText }))} hasPreviousReport={Boolean(previous)} />}{tab === "preview" && <div className="space-y-5"><ReportReadiness profileComplete={readiness.profileComplete} datesConfigured={readiness.datesConfigured} missingOutputs={readiness.missingOutputs.length} missingTargets={readiness.missingTargets.length} ready={readiness.ready} /><AnnexPreview reportId={report.id} /></div>}</div>;
}
