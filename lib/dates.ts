export type ReportingPeriod = { start: Date; end: Date };
export type DayStatus = "WORKING" | "WFH" | "WEEKEND" | "HOLIDAY" | "SUSPENDED" | "LEAVE" | "OTHER";
export type WorkweekType = "NORMAL" | "COMPRESSED";

export function calendarDate(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid calendar date");
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function todayCalendarDate(now = new Date()) {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function getReportingPeriod(input = todayCalendarDate()): ReportingPeriod {
  const date = calendarDate(input);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const startDay = day <= 15 ? 1 : 16;
  const endDay = day <= 15 ? 15 : new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return {
    start: new Date(Date.UTC(year, month, startDay)),
    end: new Date(Date.UTC(year, month, endDay)),
  };
}

export function periodFromKey(value?: string | null) {
  try {
    return getReportingPeriod(value ? calendarDate(value) : new Date());
  } catch {
    return getReportingPeriod();
  }
}

export function periodKey(period: ReportingPeriod) {
  return dateKey(period.start);
}

export function formatPeriod(period: ReportingPeriod) {
  const sameMonth = period.start.getUTCMonth() === period.end.getUTCMonth();
  const startMonth = period.start.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const endMonth = period.end.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  return sameMonth
    ? `${startMonth} ${period.start.getUTCDate()}–${period.end.getUTCDate()}, ${period.end.getUTCFullYear()}`
    : `${startMonth} ${period.start.getUTCDate()}, ${period.start.getUTCFullYear()}–${endMonth} ${period.end.getUTCDate()}, ${period.end.getUTCFullYear()}`;
}

export function formatWorkDate(date: Date, withYear = true) {
  return date.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: withYear ? "numeric" : undefined, timeZone: "UTC" });
}

export function datesInPeriod(period: ReportingPeriod) {
  const dates: Date[] = [];
  for (let cursor = new Date(period.start); cursor <= period.end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(new Date(cursor));
  }
  return dates;
}

export function defaultDayStatus(date: Date, workweekType: WorkweekType = "NORMAL"): DayStatus {
  const day = date.getUTCDay();
  return day === 0 || day === 6 || (workweekType === "COMPRESSED" && day === 5) ? "WEEKEND" : "WORKING";
}

export function containsDate(period: ReportingPeriod, date: Date) {
  return date >= period.start && date <= period.end;
}

export function adjacentPeriod(period: ReportingPeriod, direction: -1 | 1) {
  const pivot = new Date(period.start);
  pivot.setUTCDate(direction < 0 ? pivot.getUTCDate() - 1 : period.end.getUTCDate() + 1);
  return getReportingPeriod(pivot);
}

export function previousPeriods(count = 8, from = todayCalendarDate()) {
  const items: ReportingPeriod[] = [];
  let period = getReportingPeriod(from);
  for (let index = 0; index < count; index += 1) {
    items.push(period);
    period = adjacentPeriod(period, -1);
  }
  return items;
}
