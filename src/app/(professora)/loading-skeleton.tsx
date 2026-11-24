import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className: string }) {
  return <div className={cn("rounded-md bg-muted", className)} />;
}

export function LoadingSkeleton({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <>
      <p role="status" className="sr-only">
        {label}
      </p>
      <div aria-hidden="true" className={cn("grid", className)}>
        {children}
      </div>
    </>
  );
}

export function PeriodSkeleton() {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-card p-2 sm:justify-start sm:px-3">
      <Skeleton className="size-11 shrink-0" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="size-11 shrink-0" />
    </div>
  );
}
