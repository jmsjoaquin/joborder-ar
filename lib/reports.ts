import { prisma } from "@/lib/prisma";
import { dateKey, datesInPeriod, defaultDayStatus, getReportingPeriod, type ReportingPeriod } from "@/lib/dates";
import { isRequiredWorkday, type ReportStatus, type WorkweekType } from "@/lib/report-types";

export async function ensureProfile() {
  return prisma.employeeProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      fullName: "JAMES MATTHEW B. JOAQUIN",
      position: "COMPUTER PROGRAMMER III",
      department: "PMT-ISM",
      approvingOfficerName: "ALLAN M. DE VILLA",
      approvingOfficerPosition: "ACTING SENIOR MANAGER - ITMD",
    },
  });
}

export async function ensureReport(period: ReportingPeriod) {
  const [report, profile] = await Promise.all([
    prisma.report.upsert({
      where: { periodStart_periodEnd: { periodStart: period.start, periodEnd: period.end } },
      update: {},
      create: { periodStart: period.start, periodEnd: period.end },
    }),
    ensureProfile(),
  ]);
  const existing = await prisma.reportDay.findMany({ where: { reportId: report.id }, select: { date: true } });
  const existingKeys = new Set(existing.map((day) => dateKey(day.date)));
  const missing = datesInPeriod(period)
    .map((date, sortOrder) => ({ date, sortOrder }))
    .filter(({ date }) => !existingKeys.has(dateKey(date)));
  if (missing.length) {
    await prisma.reportDay.createMany({ data: missing.map(({ date, sortOrder }) => ({ reportId: report.id, date, sortOrder, dayStatus: defaultDayStatus(date, profile.workweekType as WorkweekType), taskStatus: "COMPLETED", completionPercentage: 100 })) });
  }
  return prisma.report.findUniqueOrThrow({ where: { id: report.id }, include: { days: { orderBy: { sortOrder: "asc" } } } });
}

export async function ensureCurrentReport() {
  return ensureReport(getReportingPeriod());
}

export function reportReadiness(profile: { fullName: string; position: string; department: string; approvingOfficerName: string | null; approvingOfficerPosition: string | null }, days: { dayStatus: string; target: string; output: string }[]) {
  const required = days.filter(isRequiredWorkday);
  const missingOutputs = required.filter((day) => !day.output.trim());
  const missingTargets = required.filter((day) => !day.target.trim());
  const profileComplete = Boolean(profile.fullName.trim() && profile.position.trim() && profile.department.trim() && profile.approvingOfficerName?.trim() && profile.approvingOfficerPosition?.trim());
  return {
    profileComplete,
    datesConfigured: days.length > 0,
    missingOutputs,
    missingTargets,
    hasEntries: days.some((day) => day.output.trim()),
    ready: profileComplete && days.length > 0 && missingOutputs.length === 0 && missingTargets.length === 0 && days.some((day) => day.dayStatus === "WORKING" || day.dayStatus === "WFH"),
  };
}

export async function refreshReportStatus(reportId: string) {
  const [report, profile] = await Promise.all([
    prisma.report.findUniqueOrThrow({ where: { id: reportId }, include: { days: true } }),
    ensureProfile(),
  ]);
  const readiness = reportReadiness(profile, report.days);
  const hasData = report.days.some((day) => day.target.trim() || day.output.trim());
  const status: ReportStatus = readiness.ready ? "READY" : hasData ? "DRAFT" : "NOT_STARTED";
  await prisma.report.update({ where: { id: reportId }, data: { status } });
  return status;
}

export async function getPreviousReport(periodStart: Date) {
  return prisma.report.findFirst({ where: { periodStart: { lt: periodStart } }, include: { days: { orderBy: { sortOrder: "asc" } } }, orderBy: { periodStart: "desc" } });
}
