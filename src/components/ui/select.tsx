import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block w-full min-w-0">
      <select
        {...props}
        className={cn(
          "min-h-11 w-full min-w-0 appearance-none rounded-lg border border-input bg-card py-1 ps-3 pe-9 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm forced-colors:appearance-auto forced-colors:pe-3",
          className,
        )}
      />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 forced-colors:hidden"
      />
    </span>
  );
}
