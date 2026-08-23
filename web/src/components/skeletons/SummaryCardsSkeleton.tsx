import { Skeleton } from "./Skeleton";

export function SummaryCardsSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-card px-4 py-3">
          <div className="flex items-center justify-between gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
          <Skeleton className="mt-2 h-8 w-10" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}
