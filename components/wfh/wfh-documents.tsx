import Link from "next/link";
import { CheckCircle2, Download, FileText, Pencil, TriangleAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatWorkDate } from "@/lib/dates";
import { formatHours, isCertificationEligible } from "@/lib/wfh-rules";

type WfhDay = {
  id: string;
  date: Date;
  dayStatus: string;
  output: string;
  wfhHours: number | null;
  wfhStartTime: string | null;
  wfhEndTime: string | null;
  includeInServiceCertification: boolean;
  wfhTasks: { id: string; target: string; accomplished: string }[];
};

export function WfhDocuments({ reportId, days }: { reportId: string; days: WfhDay[] }) {
  const wfhDays = days.filter((day) => day.dayStatus === "WFH");
  const eligible = wfhDays.filter(isCertificationEligible);
  return <div className="space-y-5"><section className="card p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-lg font-bold">WFH Documents</h2><p className="mt-1 text-sm text-slate-500">Prepare each WFH accomplishment, then generate the cutoff certification.</p></div><div className="flex flex-wrap gap-2"><a href={`/api/reports/${reportId}/wfh-certification/pdf?preview=1`} target="_blank" className={buttonVariants({ variant: "secondary" })}><FileText size={17} /> Preview Certification</a><a href={`/api/reports/${reportId}/wfh-certification/pdf`} download className={buttonVariants()}><Download size={17} /> Download Certification</a></div></div><p className="mt-4 text-xs font-semibold text-slate-500">{eligible.length} of {wfhDays.length} WFH dates eligible for certification</p></section>
  {!wfhDays.length ? <section className="card p-8 text-center"><TriangleAlert className="mx-auto text-amber-500" /><h3 className="mt-3 font-bold">No WFH dates configured</h3><p className="mt-1 text-sm text-slate-500">Open the Dates tab and mark at least one date as WFH.</p></section> : <section className="grid gap-3">{wfhDays.map((day) => { const ready = day.wfhTasks.length > 0 && day.wfhTasks.every((task) => task.target.trim() && task.accomplished.trim()); return <article key={day.id} className="card flex flex-wrap items-center justify-between gap-4 p-5"><div className="flex items-start gap-3">{ready ? <CheckCircle2 className="mt-0.5 text-emerald-600" size={20} /> : <TriangleAlert className="mt-0.5 text-amber-500" size={20} />}<div><h3 className="font-bold">{formatWorkDate(day.date)}</h3><p className="mt-1 text-sm text-slate-500">{formatHours(day.wfhHours ?? 0)} hours · {day.wfhStartTime ?? "Schedule missing"}–{day.wfhEndTime ?? "Schedule missing"} · {day.wfhTasks.length} {day.wfhTasks.length === 1 ? "task" : "tasks"}</p><p className={`mt-1 text-xs font-semibold ${ready ? "text-emerald-700" : "text-amber-700"}`}>{ready ? "Ready for WFH PDF" : day.output.trim() ? "Open and convert the daily entry into task rows" : "Accomplishment details required"}</p></div></div><div className="flex flex-wrap gap-2"><Link href={`/reports/${reportId}/wfh/${day.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}><Pencil size={15} /> Edit</Link>{ready && <><a href={`/api/reports/${reportId}/wfh/${day.id}/pdf?preview=1`} target="_blank" className={buttonVariants({ variant: "secondary", size: "sm" })}>Preview</a><a href={`/api/reports/${reportId}/wfh/${day.id}/pdf`} download className={buttonVariants({ size: "sm" })}><Download size={15} /> PDF</a></>}</div></article>; })}</section>}
  </div>;
}
