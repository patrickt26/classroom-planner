import { LoadingSkeleton, Skeleton } from "../../loading-skeleton";

export default function StudentLoading() {
  return (
    <LoadingSkeleton label="Carregando a ficha do aluno…" className="gap-6">
      <div className="grid gap-2">
        <Skeleton className="h-11 w-36" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Skeleton className="h-9 w-44" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-11 w-28" />
            <Skeleton className="h-11 w-28" />
          </div>
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
          <Skeleton className="h-7 w-36" />
          {[1, 2, 3].map((field) => (
            <div key={field} className="grid gap-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-3 rounded-xl border bg-card p-4 sm:p-5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      </div>
    </LoadingSkeleton>
  );
}
