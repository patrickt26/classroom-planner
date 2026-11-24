import type { ReactNode } from "react";
import { TeacherShell } from "@/features/navigation/components/teacher-shell";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { WeekStartProvider } from "@/features/workspace/week-start-context";

export async function TeacherLayout({ children }: { children: ReactNode }) {
  const workspace = await requireTeacherWorkspace();
  return (
    <TeacherShell
      workspaceName={workspace.name}
      workspaceBrand={workspace.brand}
      links={{
        today: "/",
        students: "/alunos",
        calendar: "/agenda",
        billing: "/cobrancas",
        settings: "/configuracoes",
      }}
    >
      <WeekStartProvider value={workspace.week_start}>
        {children}
      </WeekStartProvider>
    </TeacherShell>
  );
}
