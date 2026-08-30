import { Skeleton } from "./Skeleton";
import { Card } from "../ui";

export function PerformanceCardSkeleton() {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-3 w-44" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[var(--card-radius)] border border-border-subtle p-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-4 h-9 w-20" />
            <Skeleton className="mt-4 h-32 w-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}
