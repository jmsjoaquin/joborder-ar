import { SavedTargetsManager } from "@/components/saved-targets-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SavedTargetsPage() { const targets = await prisma.savedTarget.findMany({ orderBy: { name: "asc" } }); return <div className="page-container space-y-6"><div><p className="text-sm font-semibold text-blue-600">Target library</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Saved Targets</h1><p className="mt-2 text-sm text-slate-500">Keep common target text ready for bulk cutoff assignment.</p></div><SavedTargetsManager targets={targets} /></div>; }
