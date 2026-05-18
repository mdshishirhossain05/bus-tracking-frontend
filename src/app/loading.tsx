import { SectionSkeleton } from "@/components/states/section-skeleton";

export default function GlobalLoading() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <SectionSkeleton />
    </main>
  );
}