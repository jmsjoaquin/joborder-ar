import { defaultDayStatus, type DayStatus, type WorkweekType } from "./dates";

export type AutomaticWfhSettings = {
  enabled: boolean;
  weekday: number;
};

export function automaticDayStatus(date: Date, workweekType: WorkweekType, settings: AutomaticWfhSettings): DayStatus {
  if (settings.enabled && date.getUTCDay() === settings.weekday) return "WFH";
  return defaultDayStatus(date, workweekType);
}

export function shouldApplyAutomaticWfh(day: { date: Date; dayStatus: string; target: string; output: string }, settings: AutomaticWfhSettings) {
  return settings.enabled
    && day.date.getUTCDay() === settings.weekday
    && (day.dayStatus === "WORKING" || day.dayStatus === "WEEKEND")
    && !day.target.trim()
    && !day.output.trim();
}

export function isCertificationEligible(day: {
  dayStatus: string;
  includeInServiceCertification: boolean;
  wfhHours: number | null;
  output: string;
}) {
  return day.dayStatus === "WFH"
    && day.includeInServiceCertification
    && (day.wfhHours ?? 0) > 0
    && Boolean(day.output.trim());
}

export function formatHours(hours: number) {
  return Number.isInteger(hours) ? String(hours) : String(hours).replace(/0+$/, "").replace(/\.$/, "");
}
