import { NextResponse } from "next/server";
import { ensureCurrentReport } from "@/lib/reports";

export async function GET(request: Request) {
  const report = await ensureCurrentReport();
  return NextResponse.redirect(new URL(`/reports/${report.id}?tab=entries`, request.url));
}
