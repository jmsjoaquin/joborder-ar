"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { saveWfhDay } from "@/app/actions/wfh";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatWorkDate } from "@/lib/dates";
import { parseWfhAccomplishmentPaste } from "@/lib/wfh-tasks";

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
  const [previousTasks, setPreviousTasks] = useState<Task[] | null>(null);
  const [bulkInput, setBulkInput] = useState("");
  const [perspective, setPerspective] = useState(props.initialTasks[0]?.perspective || "Excellent Process");
  const [pending, startTransition] = useTransition();
  const date = new Date(`${props.date}T00:00:00Z`);

  function patchTask(index: number, field: keyof Task, value: string) {
    setTasks((current) => current.map((task, taskIndex) => taskIndex === index ? { ...task, [field]: value } : task));
  }

  function importBulkInput() {
    const parsed = parseWfhAccomplishmentPaste(bulkInput, perspective);
    if (!parsed.length) return toast.error("No bullet accomplishments found. Start each item with a dash (-).");
    if (parsed.length > 50) return toast.error("A maximum of 50 accomplishment bullets can be prepared at once.");
    if (parsed.some((task) => task.accomplished.length > 50000 || task.target.length > 5000)) return toast.error("One or more bullets are too long. Shorten or split them before preparing.");
    setPreviousTasks(tasks);
    setTasks(parsed);
    toast.success(`${parsed.length} accomplishment${parsed.length === 1 ? "" : "s"} prepared. Targets were converted to action wording.`);
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

    <section className="card p-5"><div><h2 className="text-lg font-bold">Paste daily WFH accomplishment</h2><p className="mt-1 text-sm text-slate-500">Paste the whole block, including your name and WFH date. Each bullet becomes one PDF row; its target is automatically changed to action wording instead of past tense.</p></div><div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]"><div><label className="field-label" htmlFor="bulk-perspective">BSC Perspective</label><input className="field" id="bulk-perspective" value={perspective} onChange={(event) => setPerspective(event.target.value)} /></div><div className="self-end flex gap-2">{previousTasks && <Button type="button" variant="secondary" onClick={() => { setTasks(previousTasks); setPreviousTasks(null); toast.success("Previous prepared rows restored."); }}>Undo</Button>}<Button type="button" variant="secondary" onClick={importBulkInput}>Prepare tasks</Button></div></div><textarea className="field mt-4 min-h-64 resize-y font-mono text-sm" value={bulkInput} onChange={(event) => setBulkInput(event.target.value)} placeholder={`James Matthew B. Joaquin\nWFH (11/06/26)\n\n- Attended the FIST Scrum meeting...\n\n- Developed and prepared PAM scripts...`} /><p className="mt-2 text-xs text-slate-500">Preparing replaces the task list below. You can review and adjust the generated target/accomplished pairs before saving.</p></section>

    <section className="space-y-4"><div><h2 className="text-lg font-bold">Prepared WFH rows</h2><p className="text-sm text-slate-500">Targets use action wording; accomplishments preserve your pasted text.</p></div>{tasks.map((task, index) => <article className="card p-5" key={task.id ?? index}><h3 className="mb-4 font-bold">Task {index + 1}</h3><div className="grid gap-4 lg:grid-cols-2"><div><label className="field-label">Target / Deliverable</label><textarea className="field min-h-28 resize-y" value={task.target} onChange={(event) => patchTask(index, "target", event.target.value)} /></div><div><label className="field-label">Accomplished</label><textarea className="field min-h-28 resize-y" value={task.accomplished} onChange={(event) => patchTask(index, "accomplished", event.target.value)} /></div><div><label className="field-label">BSC Perspective</label><input className="field" value={task.perspective} onChange={(event) => patchTask(index, "perspective", event.target.value)} /></div><div><label className="field-label">Notes</label><input className="field" value={task.notes} onChange={(event) => patchTask(index, "notes", event.target.value)} /></div></div></article>)}</section>
  </div>;
}
