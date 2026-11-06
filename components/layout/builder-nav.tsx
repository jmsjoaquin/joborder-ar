"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange, FileText, Settings, Target, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/reports/current", label: "Current Cutoff", icon: CalendarRange },
  { href: "/saved-targets", label: "Saved Targets", icon: Target },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BuilderNav() {
  const pathname = usePathname();
  return <><aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-slate-200 bg-white lg:flex lg:flex-col"><div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5"><span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white"><FileText size={20} /></span><div><p className="text-sm font-bold">Accomplishment</p><p className="text-xs text-slate-500">Report Builder</p></div></div><nav className="flex-1 space-y-1 p-4" aria-label="Primary navigation">{links.map(({ href, label, icon: Icon }) => { const active = href === "/reports" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}><Icon size={18} />{label}</Link>; })}</nav><div className="border-t border-slate-100 p-5 text-xs leading-5 text-slate-400">Local-only workspace<br />Data stays on this device</div></aside><nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white/95 p-1 backdrop-blur lg:hidden" aria-label="Mobile navigation">{links.slice(0, 4).map(({ href, label, icon: Icon }) => { const active = href === "/reports" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={cn("flex min-w-16 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium", active ? "text-blue-700" : "text-slate-500")}><Icon size={19} /><span>{label.replace("Saved ", "")}</span></Link>; })}</nav></>;
}
