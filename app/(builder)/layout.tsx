import { BuilderNav } from "@/components/layout/builder-nav";

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen lg:pl-60"><BuilderNav /><header className="sticky top-0 z-20 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8"><div className="flex items-center gap-2 lg:hidden"><span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">AR</span><span className="text-sm font-bold">Report Builder</span></div><p className="ml-auto text-xs font-medium text-slate-500">Local workspace</p></header><main className="pb-20 lg:pb-0">{children}</main></div>;
}
