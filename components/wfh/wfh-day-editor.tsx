"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Download, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveWfhDay } from "@/app/actions/wfh";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatWorkDate } from "@/lib/dates";

type Task = { id?: string; perspective: string; target: string; accomplished: string; notes: string };

type Props = {
  reportId: string;
  dayId: string;
  date: string;
  initialHours: number;
  initialStartTime: string;
  initialEndTime: string;
  initialInclude: boolean;
  initialTasks: Task[];
};

const blankTask = (perspective = "Excellent Process"): Task => ({ perspective, target: "", accomplished: "", notes: "" });

export function WfhDayEditor(props: Props) {
  const [hours, setHours] = useState(String(props.initialHours));
  const [startTime, setStartTime] = useState(props.initialStartTime);
  const [endTime, setEndTime] = useState(props.initialEndTime);
  const [include, setInclude] = useState(props.initialInclude);
  const [tasks, setTasks] = useState(props.initialTasks.length ? props.initialTasks : [blankTask()]);
  const [pending, startTransition] = useTransition();
  const date = new Date(`${props.date}T00:00:00Z`);

  function patchTask(index: number, field: keyof Task, value: string) {
    setTasks((current) => current.map((task, taskIndex) => taskIndex === index ? { ...task, [field]: value } : task));
  }

  function save() {
    startTransition(async () => {
      const result = await saveWfhDay({ reportId: props.reportId, dayId: props.dayId, hours: Number(hours), startTime, endTime, includeInCertification: include, tasks });
      if (result.ok) toast.success("WFH accomplishment saved and synced to Annex C.");
      else toast.error(result.message);
    });
  }

  return <div className="page-container space-y-6">
    <section className="flex flex-wrap items-end justify-between gap-4"><div><Link href={`/reports/${props.reportId}?tab=wfh`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700"><ArrowLeft size={15} /> WFH Documents</Link><p className="text-sm font-semibold text-blue-600">Work From Home</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{formatWorkDate(date)} Accomplishment</h1><p className="mt-2 text-sm text-slate-500">Structured rows feed both the official WFH form and the daily Annex C entry.</p></div><div className="flex gap-2"><a className={buttonVariants({ variant: "secondary" })} href={`/api/reports/${props.reportId}/wfh/${props.dayId}/pdf?preview=1`} target="_blank"><Download size={17} /> Preview PDF</a><Button onClick={save} disabled={pending}><Save size={17} />{pending ? "Saving…" : "Save"}</Button></div></section>

    <section className="card p-5"><h2 className="font-bold">Schedule and certification</h2><div className="mt-4 grid gap-4 sm:grid-cols-3"><div><label className="field-label" htmlFor="wfh-hours">Hours rendered</label><input className="field" id="wfh-hours" type="number" min="0.25" max="24" step="0.25" value={hours} onChange={(event) => setHours(event.target.value)} /></div><div><label className="field-label" htmlFor="wfh-start">Start time</label><input className="field" id="wfh-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></div><div><label className="field-label" htmlFor="wfh-end">End time</label><input className="field" id="wfh-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></div></div><label className="mt-4 flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={include} onChange={(event) => setInclude(event.target.checked)} className="size-4" /> Include this date in Certification of Services Rendered</label></section>

    <section className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">WFH task rows</h2><p className="text-sm text-slate-500">Every row requires a target and accomplished output. Notes are optional.</p></div><Button variant="secondary" onClick={() => setTasks((current) => [...current, blankTask(current.at(-1)?.perspective)])}><Plus size={17} /> Add task</Button></div>{tasks.map((task, index) => <article className="card p-5" key={task.id ?? index}><div className="mb-4 flex items-center justify-between"><h3 className="font-bold">Task {index + 1}</h3><button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40" disabled={tasks.length === 1} onClick={() => setTasks((current) => current.filter((_, taskIndex) => taskIndex !== index))} aria-label={`Delete task ${index + 1}`}><Trash2 size={17} /></button></div><div className="grid gap-4 lg:grid-cols-2"><div><label className="field-label">BSC Perspective</label><input className="field" value={task.perspective} onChange={(event) => patchTask(index, "perspective", event.target.value)} /></div><div><label className="field-label">Notes</label><input className="field" value={task.notes} onChange={(event) => patchTask(index, "notes", event.target.value)} /></div><div><label className="field-label">Target / Deliverable</label><textarea className="field min-h-28 resize-y" value={task.target} onChange={(event) => patchTask(index, "target", event.target.value)} /></div><div><label className="field-label">Accomplished</label><textarea className="field min-h-28 resize-y" value={task.accomplished} onChange={(event) => patchTask(index, "accomplished", event.target.value)} /></div></div></article>)}</section>
  </div>;
}
