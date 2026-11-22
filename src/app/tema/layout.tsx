import type { Metadata } from "next";
import type { ReactNode } from "react";

import { TeacherShell } from "@/features/navigation/components/teacher-shell";

export const metadata: Metadata = {
  title: "Tema e componentes",
  robots: { index: false, follow: false },
};

export default function ThemeLayout({ children }: { children: ReactNode }) {
  return (
    <TeacherShell
      workspaceName="Professora Exemplo"
      links={{
        today: "/tema",
        students: "/tema/alunos",
        calendar: "/tema/agenda",
        settings: "/tema/mais",
      }}
    >
      {children}
    </TeacherShell>
  );
}
