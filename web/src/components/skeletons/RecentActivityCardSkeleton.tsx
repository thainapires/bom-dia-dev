import { Skeleton } from "./Skeleton";
import { Card } from "../ui";

export function RecentActivityCardSkeleton() {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-14" />
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 flex-none rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="mt-1.5 h-3 w-48" />
            </div>
            <Skeleton className="h-3 w-12 flex-none" />
          </div>
        ))}
      </div>
    </Card>
  );
}
