import { LoadingSkeleton, Skeleton } from "./loading-skeleton";

export default function TodayLoading() {
  return (
    <LoadingSkeleton label="Carregando a tela Hoje…" className="gap-6">
      <div className="grid gap-1">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b bg-muted/35 px-4 py-3">
            <Skeleton className="h-7 w-32" />
          </div>
          <div className="grid gap-2 px-4 py-3 lg:grid-cols-[7rem_minmax(0,1fr)]">
            <Skeleton className="h-5 w-24" />
            <div className="grid gap-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-1 h-11 w-32" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {[1, 2].map((card) => (
            <div
              key={card}
              className="grid gap-2 rounded-xl border bg-card p-4"
            >
              <Skeleton className="h-7 w-40 max-w-full" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-11 w-32" />
            </div>
          ))}
        </div>
      </div>
    </LoadingSkeleton>
  );
}
