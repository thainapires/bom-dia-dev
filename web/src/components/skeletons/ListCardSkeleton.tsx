import { Skeleton } from "./Skeleton";

export function ListCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-card p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-md border-l-4 border-l-white/10 bg-white/5 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="mt-1.5 h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 flex-none rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
