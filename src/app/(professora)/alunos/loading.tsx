import { LoadingSkeleton, Skeleton } from "../loading-skeleton";

export default function StudentsLoading() {
  return (
    <LoadingSkeleton label="Carregando alunos…" className="gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-11 w-36" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-2 lg:max-w-lg">
          <Skeleton className="h-5 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-20" />
          </div>
        </div>
        <Skeleton className="h-13 w-44" />
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {[1, 2, 3, 4].map((card) => (
          <div
            key={card}
            className="flex items-start gap-3 rounded-xl border bg-card p-4 sm:p-5"
          >
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="grid min-w-0 flex-1 gap-2">
              <Skeleton className="h-11 w-32 max-w-full" />
              <Skeleton className="h-4 w-24 max-w-full" />
              <Skeleton className="h-4 w-20 max-w-full" />
            </div>
            <Skeleton className="h-11 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </LoadingSkeleton>
  );
}
