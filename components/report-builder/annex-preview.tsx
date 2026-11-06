export function AnnexPreview({ reportId }: { reportId: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm">
      <iframe
        title="Annex C PDF preview"
        src={`/api/reports/${reportId}/pdf?preview=1`}
        className="h-[calc(100vh-13rem)] min-h-[680px] w-full bg-white"
      />
    </section>
  );
}
