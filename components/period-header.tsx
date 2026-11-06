import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { adjacentPeriod, formatPeriod, periodKey, type ReportingPeriod } from "@/lib/dates";
import { buttonVariants } from "@/components/ui/button";

export function ReportingPeriodHeader({ period, eyebrow = "Reporting period", navigationBase }: { period: ReportingPeriod; eyebrow?: string; navigationBase?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold text-blue-600">{eyebrow}</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{formatPeriod(period)}</h1></div>
      {navigationBase && <PeriodNavigator period={period} base={navigationBase} />}
    </div>
  );
}

export function PeriodNavigator({ period, base }: { period: ReportingPeriod; base: string }) {
  const previous = periodKey(adjacentPeriod(period, -1));
  const next = periodKey(adjacentPeriod(period, 1));
  return <div className="flex gap-2"><Link aria-label="Previous reporting period" className={buttonVariants({ variant: "secondary", size: "icon" })} href={`${base}?period=${previous}`}><ChevronLeft size={18} /></Link><Link aria-label="Next reporting period" className={buttonVariants({ variant: "secondary", size: "icon" })} href={`${base}?period=${next}`}><ChevronRight size={18} /></Link></div>;
}
