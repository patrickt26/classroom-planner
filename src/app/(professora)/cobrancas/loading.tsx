import { LoadingSkeleton, PeriodSkeleton, Skeleton } from "../loading-skeleton";

export default function BillingLoading() {
  return (
    <LoadingSkeleton label="Carregando cobranças…" className="gap-7">
      <Skeleton className="h-9 w-36" />
      <PeriodSkeleton />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((card) => (
          <div
            key={card}
            className="grid min-w-0 gap-2 rounded-xl border bg-card p-4 first:col-span-2 sm:p-5 sm:first:col-span-1"
          >
            <Skeleton className="h-5 w-24 max-w-full" />
            <Skeleton className="h-7 w-20 max-w-full sm:h-9" />
          </div>
        ))}
      </div>
      <div className="grid items-start gap-7 xl:grid-cols-2">
        {[1, 2].map((column) => (
          <div key={column} className="grid gap-3">
            <Skeleton className="h-7 w-44" />
            <div className="grid gap-2 rounded-xl border bg-card p-4 sm:p-5">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </LoadingSkeleton>
  );
}
