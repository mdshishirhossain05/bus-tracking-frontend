import { Skeleton } from "@/components/ui/skeleton";

export function SectionSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Skeleton className="h-[520px] w-full" />
        <Skeleton className="h-[520px] w-full" />
      </div>
    </div>
  );
}
