"use client";

import { CalendarDays, Ellipsis, House, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const destinations = [
  { id: "today", label: "Hoje", icon: House },
  { id: "students", label: "Alunos", icon: Users },
  { id: "calendar", label: "Agenda", icon: CalendarDays },
  { id: "more", label: "Mais", icon: Ellipsis },
] as const;

export type TeacherLinks = Partial<
  Record<(typeof destinations)[number]["id"], string>
>;

export function TeacherNavigation({ links }: { links: TeacherLinks }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-sidebar-border bg-sidebar px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-sidebar-foreground md:static md:border-0 md:p-3"
    >
      <ul className="flex gap-1 md:flex-col">
        {destinations.map(({ id, label, icon: Icon }) => {
          const href = links[id];
          if (!href) return null;

          const isCurrent = pathname === href;
          const isActive =
            isCurrent || (id !== "today" && pathname.startsWith(`${href}/`));

          return (
            <li key={id} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                data-active={isActive}
                className="flex min-h-12 min-w-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[active=true]:bg-sidebar-accent data-[active=true]:font-bold data-[active=true]:text-sidebar-accent-foreground md:flex-row md:justify-start md:gap-3 md:px-3 md:text-sm"
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
