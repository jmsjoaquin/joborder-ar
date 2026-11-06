"use client";

import { useActionState, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { WORKWEEK_TYPES } from "@/lib/report-types";
import { humanizeEnum } from "@/lib/utils";

type Profile = {
  fullName: string;
  position: string;
  department: string;
  workweekType: string;
  approvingOfficerName: string | null;
  approvingOfficerPosition: string | null;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  const [workweekType, setWorkweekType] = useState(profile.workweekType);
  useEffect(() => { if (state.ok) toast.success("Profile saved."); }, [state]);
  const fields = [
    ["fullName", "Full Name", profile.fullName],
    ["position", "Position", profile.position],
    ["department", "Office / Department", profile.department],
    ["approvingOfficerName", "Approving Officer Name", profile.approvingOfficerName ?? ""],
    ["approvingOfficerPosition", "Approving Officer Position", profile.approvingOfficerPosition ?? ""],
  ] as const;

  return (
    <form action={action} className="card max-w-3xl p-5 sm:p-7">
      {state.message && !state.ok && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</div>}
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(([name, label, value], index) => (
          <div key={name} className={index === 0 ? "sm:col-span-2" : ""}>
            <label className="field-label" htmlFor={name}>{label}</label>
            <input className="field" id={name} name={name} defaultValue={value} required={index < 3} />
            {state.errors?.[name] && <p className="mt-1 text-xs text-red-600">{state.errors[name][0]}</p>}
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="workweekType">Workweek Schedule</label>
          <select className="field" id="workweekType" name="workweekType" value={workweekType} onChange={(event) => setWorkweekType(event.target.value)}>
            {WORKWEEK_TYPES.map((type) => <option key={type} value={type}>{humanizeEnum(type)} Workweek</option>)}
          </select>
          <p className="mt-1.5 text-xs text-slate-500">Compressed workweek uses Monday to Thursday; Fridays are excluded from required report dates.</p>
          {state.errors?.workweekType && <p className="mt-1 text-xs text-red-600">{state.errors.workweekType[0]}</p>}
        </div>
      </div>
      <div className="mt-7 flex justify-end"><Button disabled={pending}><Save size={17} />{pending ? "Saving…" : "Save profile"}</Button></div>
    </form>
  );
}
