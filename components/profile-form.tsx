"use client";

import { useActionState, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { WORKWEEK_TYPES } from "@/lib/report-types";
import { humanizeEnum } from "@/lib/utils";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Profile = {
  fullName: string;
  position: string;
  department: string;
  officeShortName: string;
  fullDepartmentName: string;
  workweekType: string;
  defaultWfhEnabled: boolean;
  defaultWfhWeekday: number;
  defaultWfhHours: number;
  defaultWfhStartTime: string;
  defaultWfhEndTime: string;
  defaultBscPerspective: string;
  approvingOfficerName: string | null;
  approvingOfficerPosition: string | null;
  certifyingOfficerName: string | null;
  certifyingOfficerPosition: string | null;
  wfhApproverName: string | null;
  wfhApproverPosition: string | null;
};

function Field({ name, label, value, required = false, error }: { name: string; label: string; value: string | number; required?: boolean; error?: string[] }) {
  return <div><label className="field-label" htmlFor={name}>{label}</label><input className="field" id={name} name={name} defaultValue={value} required={required} />{error && <p className="mt-1 text-xs text-red-600">{error[0]}</p>}</div>;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  const [workweekType, setWorkweekType] = useState(profile.workweekType);
  const [wfhEnabled, setWfhEnabled] = useState(profile.defaultWfhEnabled);
  useEffect(() => { if (state.ok) toast.success(state.message ?? "Profile saved."); }, [state]);

  return (
    <form action={action} className="max-w-4xl space-y-6">
      {state.message && !state.ok && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</div>}

      <section className="card p-5 sm:p-7">
        <h2 className="text-lg font-bold">Employee information</h2><p className="mt-1 text-sm text-slate-500">Used across Annex C, WFH accomplishments, and certifications.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field name="fullName" label="Full Name" value={profile.fullName} required error={state.errors?.fullName} /></div>
          <Field name="position" label="Position" value={profile.position} required error={state.errors?.position} />
          <Field name="department" label="Annex C Office / Department" value={profile.department} required error={state.errors?.department} />
          <Field name="officeShortName" label="WFH Office" value={profile.officeShortName} required error={state.errors?.officeShortName} />
          <Field name="fullDepartmentName" label="Full Department Name" value={profile.fullDepartmentName} required error={state.errors?.fullDepartmentName} />
          <div className="sm:col-span-2"><label className="field-label" htmlFor="workweekType">Workweek Schedule</label><select className="field" id="workweekType" name="workweekType" value={workweekType} onChange={(event) => setWorkweekType(event.target.value)}>{WORKWEEK_TYPES.map((type) => <option key={type} value={type}>{humanizeEnum(type)} Workweek</option>)}</select>{state.errors?.workweekType && <p className="mt-1 text-xs text-red-600">{state.errors.workweekType[0]}</p>}</div>
        </div>
      </section>

      <section className="card p-5 sm:p-7">
        <h2 className="text-lg font-bold">Default WFH schedule</h2><p className="mt-1 text-sm text-slate-500">Applied only when new cutoff dates are created. Individual dates remain editable.</p>
        <label className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 p-4"><input type="checkbox" name="defaultWfhEnabled" checked={wfhEnabled} onChange={(event) => setWfhEnabled(event.target.checked)} className="size-4" /><span><span className="block text-sm font-semibold">Automatically mark one weekday as WFH</span><span className="text-xs text-slate-500">Disable this to use only manual WFH date selection.</span></span></label>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div><label className="field-label" htmlFor="defaultWfhWeekday">Default WFH Weekday</label><select className="field" id="defaultWfhWeekday" name="defaultWfhWeekday" defaultValue={profile.defaultWfhWeekday} disabled={!wfhEnabled}>{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>{!wfhEnabled && <input type="hidden" name="defaultWfhWeekday" value={profile.defaultWfhWeekday} />}</div>
          <Field name="defaultWfhHours" label="Default Hours" value={profile.defaultWfhHours} required error={state.errors?.defaultWfhHours} />
          <div><label className="field-label" htmlFor="defaultWfhStartTime">Start Time</label><input className="field" type="time" id="defaultWfhStartTime" name="defaultWfhStartTime" defaultValue={profile.defaultWfhStartTime} required /></div>
          <div><label className="field-label" htmlFor="defaultWfhEndTime">End Time</label><input className="field" type="time" id="defaultWfhEndTime" name="defaultWfhEndTime" defaultValue={profile.defaultWfhEndTime} required />{state.errors?.defaultWfhEndTime && <p className="mt-1 text-xs text-red-600">{state.errors.defaultWfhEndTime[0]}</p>}</div>
          <div className="sm:col-span-2"><Field name="defaultBscPerspective" label="Default BSC Perspective" value={profile.defaultBscPerspective} required error={state.errors?.defaultBscPerspective} /></div>
        </div>
      </section>

      <section className="card p-5 sm:p-7">
        <h2 className="text-lg font-bold">Signatories</h2><p className="mt-1 text-sm text-slate-500">Each generated document uses its own editable approving officer.</p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div className="space-y-4"><h3 className="text-sm font-bold text-slate-700">Annex C Approver</h3><Field name="approvingOfficerName" label="Name" value={profile.approvingOfficerName ?? ""} /><Field name="approvingOfficerPosition" label="Position" value={profile.approvingOfficerPosition ?? ""} /></div>
          <div className="space-y-4"><h3 className="text-sm font-bold text-slate-700">Certification Officer</h3><Field name="certifyingOfficerName" label="Name" value={profile.certifyingOfficerName ?? ""} /><Field name="certifyingOfficerPosition" label="Position" value={profile.certifyingOfficerPosition ?? ""} /></div>
          <div className="space-y-4 sm:col-span-2"><h3 className="text-sm font-bold text-slate-700">WFH Approver</h3><div className="grid gap-4 sm:grid-cols-2"><Field name="wfhApproverName" label="Name" value={profile.wfhApproverName ?? ""} /><Field name="wfhApproverPosition" label="Position" value={profile.wfhApproverPosition ?? ""} /></div></div>
        </div>
      </section>

      <div className="flex justify-end"><Button disabled={pending}><Save size={17} />{pending ? "Saving…" : "Save profile and WFH defaults"}</Button></div>
    </form>
  );
}
