import type { ReactNode } from "react";
import { TeacherShell } from "@/features/navigation/components/teacher-shell";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  const workspace = await requireTeacherWorkspace();
  return (
    <TeacherShell
      workspaceName={workspace.name}
      workspaceBrand={workspace.brand}
      links={{
        today: "/",
        students: "/alunos",
        calendar: "/agenda",
        more: "/mais",
      }}
    >
      {children}
    </TeacherShell>
  );
}
