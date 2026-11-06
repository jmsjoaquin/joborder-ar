-- CreateTable
CREATE TABLE "EmployeeProfile" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
  "fullName" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "approvingOfficerName" TEXT,
  "approvingOfficerPosition" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Report" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "periodStart" DATETIME NOT NULL,
  "periodEnd" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "generatedPdfPath" TEXT,
  "generatedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ReportDay" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reportId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "dayStatus" TEXT NOT NULL,
  "target" TEXT NOT NULL DEFAULT '',
  "output" TEXT NOT NULL DEFAULT '',
  "taskStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
  "completionPercentage" INTEGER NOT NULL DEFAULT 100,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ReportDay_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SavedTarget" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "targetText" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "Report_periodStart_periodEnd_key" ON "Report"("periodStart", "periodEnd");
CREATE INDEX "Report_periodStart_idx" ON "Report"("periodStart");
CREATE UNIQUE INDEX "ReportDay_reportId_date_key" ON "ReportDay"("reportId", "date");
CREATE INDEX "ReportDay_reportId_sortOrder_idx" ON "ReportDay"("reportId", "sortOrder");
CREATE INDEX "SavedTarget_name_idx" ON "SavedTarget"("name");
