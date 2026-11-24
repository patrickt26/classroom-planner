import { LoadingSkeleton, PeriodSkeleton, Skeleton } from "../loading-skeleton";

export default function AgendaLoading() {
  return (
    <div data-wide-content="">
      <LoadingSkeleton label="Carregando a agenda…" className="min-w-0 gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-11 w-28" />
        </div>
        <PeriodSkeleton />
        <div className="grid gap-2 sm:max-w-sm">
          <Skeleton className="h-5 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-16" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 xl:gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div key={day} className="grid min-w-0 gap-2 rounded-xl border p-2">
              <Skeleton className="h-6 w-20 max-w-full" />
              <div className="grid gap-2 rounded-lg border bg-card p-3">
                <Skeleton className="h-5 w-16 max-w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </LoadingSkeleton>
    </div>
  );
}
