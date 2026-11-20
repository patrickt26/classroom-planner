import type { ReactNode } from "react";

import { TeacherShell } from "@/features/navigation/components/teacher-shell";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <TeacherShell>{children}</TeacherShell>;
}
