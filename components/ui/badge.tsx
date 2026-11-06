import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  WORKING: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  WEEKEND: "bg-slate-100 text-slate-600 ring-slate-500/20",
  HOLIDAY: "bg-violet-50 text-violet-700 ring-violet-600/20",
  SUSPENDED: "bg-amber-50 text-amber-700 ring-amber-600/20",
  LEAVE: "bg-sky-50 text-sky-700 ring-sky-600/20",
  OTHER: "bg-stone-100 text-stone-700 ring-stone-600/20",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-600/20",
  FOR_QA: "bg-purple-50 text-purple-700 ring-purple-600/20",
  BLOCKED: "bg-red-50 text-red-700 ring-red-600/20",
  ON_HOLD: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export function Badge({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", styles[value] ?? styles.OTHER, className)}>
      {label}
    </span>
  );
}
