export const DAY_STATUSES = ["WORKING", "WFH", "WEEKEND", "HOLIDAY", "SUSPENDED", "LEAVE", "OTHER"] as const;
export const WORKWEEK_TYPES = ["NORMAL", "COMPRESSED"] as const;
export const TASK_STATUSES = ["COMPLETED", "IN_PROGRESS", "FOR_QA", "BLOCKED", "ON_HOLD"] as const;
export const REPORT_STATUSES = ["NOT_STARTED", "DRAFT", "READY", "FINAL"] as const;

export type DayStatus = (typeof DAY_STATUSES)[number];
export type WorkweekType = (typeof WORKWEEK_TYPES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export function isIncludedDay(day: { dayStatus: string; target: string; output: string }) {
  return day.dayStatus === "WORKING" || day.dayStatus === "WFH";
}

export function isRequiredWorkday(day: { dayStatus: string; target: string; output: string }) {
  return day.dayStatus === "WORKING" || (day.dayStatus === "WFH" && Boolean(day.target.trim() || day.output.trim()));
}

export function reportTarget(day: { dayStatus: string; target: string; output: string }) {
  if (day.dayStatus === "WFH" && !day.target.trim() && !day.output.trim()) return "Work From Home";
  return day.target;
}

export function hasActualAccomplishment(day: { target: string; output: string }) {
  return Boolean(day.target.trim() || day.output.trim());
}
