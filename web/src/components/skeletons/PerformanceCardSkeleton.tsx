import { Skeleton } from "./Skeleton";
import { Card } from "../ui";

export function PerformanceCardSkeleton() {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-36" />
            <Skeleton className="mt-2 h-7 w-24" />
            <Skeleton className="mt-3 h-28 w-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}
