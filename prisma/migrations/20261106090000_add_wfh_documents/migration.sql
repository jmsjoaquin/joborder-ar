-- Extend the local singleton profile with WFH defaults and separate signatories.
ALTER TABLE "EmployeeProfile" ADD COLUMN "officeShortName" TEXT NOT NULL DEFAULT 'PMT-ISM, ITMD';
ALTER TABLE "EmployeeProfile" ADD COLUMN "fullDepartmentName" TEXT NOT NULL DEFAULT 'Information Technology Management Department';
ALTER TABLE "EmployeeProfile" ADD COLUMN "defaultWfhEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "EmployeeProfile" ADD COLUMN "defaultWfhWeekday" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "EmployeeProfile" ADD COLUMN "defaultWfhHours" REAL NOT NULL DEFAULT 8;
ALTER TABLE "EmployeeProfile" ADD COLUMN "defaultWfhStartTime" TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE "EmployeeProfile" ADD COLUMN "defaultWfhEndTime" TEXT NOT NULL DEFAULT '17:00';
ALTER TABLE "EmployeeProfile" ADD COLUMN "defaultBscPerspective" TEXT NOT NULL DEFAULT 'Excellent Process';
ALTER TABLE "EmployeeProfile" ADD COLUMN "certifyingOfficerName" TEXT;
ALTER TABLE "EmployeeProfile" ADD COLUMN "certifyingOfficerPosition" TEXT;
ALTER TABLE "EmployeeProfile" ADD COLUMN "wfhApproverName" TEXT DEFAULT 'MARCO PAOLO Z. NATIVIDAD';
ALTER TABLE "EmployeeProfile" ADD COLUMN "wfhApproverPosition" TEXT DEFAULT 'INFORMATION SYSTEM ANALYST II, ITMD';

-- Store schedule/certification metadata directly on each existing report date.
ALTER TABLE "ReportDay" ADD COLUMN "wfhHours" REAL;
ALTER TABLE "ReportDay" ADD COLUMN "wfhStartTime" TEXT;
ALTER TABLE "ReportDay" ADD COLUMN "wfhEndTime" TEXT;
ALTER TABLE "ReportDay" ADD COLUMN "includeInServiceCertification" BOOLEAN NOT NULL DEFAULT true;

-- Structured rows used by the official WFH accomplishment form.
CREATE TABLE "WfhTask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reportDayId" TEXT NOT NULL,
  "perspective" TEXT NOT NULL DEFAULT 'Excellent Process',
  "target" TEXT NOT NULL,
  "accomplished" TEXT NOT NULL,
  "notes" TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "WfhTask_reportDayId_fkey" FOREIGN KEY ("reportDayId") REFERENCES "ReportDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "WfhTask_reportDayId_sortOrder_idx" ON "WfhTask"("reportDayId", "sortOrder");

-- Preserve the officer already configured in the local profile as the certificate signatory.
UPDATE "EmployeeProfile"
SET "certifyingOfficerName" = COALESCE("certifyingOfficerName", "approvingOfficerName"),
    "certifyingOfficerPosition" = COALESCE("certifyingOfficerPosition", "approvingOfficerPosition")
WHERE "id" = 1;
