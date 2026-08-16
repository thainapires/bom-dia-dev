import { Skeleton } from "./Skeleton";

export function YesterdayListSkeleton() {
  return (
    <div className="rounded-lg border border-white/5 bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 flex-none rounded-full bg-status-neutral" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 flex-none rounded-full" />
            <Skeleton className="h-3 w-10 flex-none" />
            <Skeleton className="h-3 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
