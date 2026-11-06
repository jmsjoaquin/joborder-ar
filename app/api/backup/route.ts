import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function sqlitePath() {
  const configured = (process.env.DATABASE_URL || "file:./dev.db").replace(/^file:/, "");
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), "prisma", configured);
}

export async function GET() {
  const zip = new JSZip();
  const database = sqlitePath();
  await prisma.$queryRawUnsafe("PRAGMA wal_checkpoint(TRUNCATE)");
  try { await access(database); zip.file("database/dev.db", await readFile(database)); }
  catch { return NextResponse.json({ message: "SQLite database file was not found." }, { status: 404 }); }
  const reportsDirectory = path.join(process.cwd(), "generated-reports");
  try {
    const files = await readdir(reportsDirectory);
    for (const filename of files.filter((file) => file.toLowerCase().endsWith(".pdf"))) zip.file(`generated-reports/${filename}`, await readFile(path.join(reportsDirectory, filename)));
  } catch { /* No generated reports yet; database-only backup is still valid. */ }
  zip.file("README.txt", "Local Accomplishment Report Builder backup\n\nRestore database/dev.db as prisma/dev.db and copy generated-reports/*.pdf into generated-reports/.\n");
  const archive = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(Buffer.from(archive)), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="accomplishment-report-backup-${stamp}.zip"`, "Cache-Control": "no-store" } });
}
