import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { type TeacherLinks, TeacherNavigation } from "./teacher-navigation";

type TeacherShellProps = {
  children: ReactNode;
  workspaceName?: string;
  links?: TeacherLinks;
};

export function TeacherShell({
  children,
  workspaceName,
  links,
}: TeacherShellProps) {
  const hasNavigation = links && Object.values(links).some(Boolean);

  return (
    <div
      className={cn(
        "min-h-dvh",
        hasNavigation &&
          "pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:pb-0 lg:grid-cols-[15rem_minmax(0,1fr)]",
      )}
    >
      <a
        href="#conteudo"
        className="sr-only rounded-lg bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30"
      >
        Ir para o conteúdo
      </a>
      {(workspaceName || hasNavigation) && (
        <div
          className={cn(
            "bg-sidebar",
            hasNavigation &&
              "md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:overflow-y-auto md:border-r md:border-sidebar-border",
          )}
        >
          {workspaceName && (
            <header className="flex min-h-16 items-center gap-3 border-b border-sidebar-border px-5 py-3 md:min-h-20">
              <span
                aria-hidden="true"
                className="h-6 w-1 shrink-0 rounded-full bg-mustard"
              />
              <span className="min-w-0 font-semibold text-brown wrap-anywhere">
                {workspaceName}
              </span>
            </header>
          )}
          {hasNavigation && <TeacherNavigation links={links} />}
        </div>
      )}
      <main
        id="conteudo"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-5 py-7 md:px-8 md:py-10 lg:px-12"
      >
        {children}
      </main>
    </div>
  );
}
