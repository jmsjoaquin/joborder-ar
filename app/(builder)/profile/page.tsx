import { ProfileForm } from "@/components/profile-form";
import { ensureProfile } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function ProfilePage() { const profile = await ensureProfile(); return <div className="page-container space-y-6"><div><p className="text-sm font-semibold text-blue-600">Local employee profile</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Report & WFH Details</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Configure the employee, default WFH schedule, and document signatories used by generated reports.</p></div><ProfileForm profile={profile} /></div>; }
