import { Skeleton } from "./Skeleton";

export function SummaryCardsSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-white/5 bg-card px-4 py-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-6 w-10" />
        </div>
      ))}
    </div>
  );
}
