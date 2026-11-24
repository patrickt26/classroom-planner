import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import type { DayLesson } from "@/features/lessons/queries";
import { TodayLesson } from "./today-page";

vi.mock("@/components/ui/badge", () => import("../../../components/ui/badge"));
vi.mock(
  "@/components/ui/button",
  () => import("../../../components/ui/button"),
);
vi.mock("@/lib/utils", () => import("../../../lib/utils"));
vi.mock("@/features/lessons/calendar", () => import("../../lessons/calendar"));
vi.mock(
  "@/features/lessons/form-state",
  () => import("../../lessons/form-state"),
);
vi.mock(
  "@/features/students/form-state",
  () => import("../../students/form-state"),
);
vi.mock("@/features/charges/queries", () => ({
  getPendingChargeTotal: vi.fn(),
}));
vi.mock("@/features/lesson-notes/queries", () => ({
  listLessonsWithoutNotes: vi.fn(),
}));
vi.mock("@/features/lessons/queries", () => ({ listDayLessons: vi.fn() }));
vi.mock("@/features/recurrences/queries", () => ({
  countPendingMakeups: vi.fn(),
}));
vi.mock("@/features/workspace/queries", () => ({
  requireTeacherWorkspace: vi.fn(),
}));

test.each(["confirmada", "realizada", "cancelada"] as const)(
  "links to the plan for a %s lesson",
  (status) => {
    const lesson: DayLesson = {
      id: "lesson-id",
      starts_at: "2026-11-24T12:30:00Z",
      duration_minutes: 45,
      status,
      modality: "presencial",
      meeting_url: null,
      students: { name: "Aluno A" },
      subjects: { name: "Matemática" },
      hasNote: false,
    };

    const markup = renderToStaticMarkup(
      <TodayLesson lesson={lesson} timeZone="America/Sao_Paulo" />,
    );

    expect(markup).toMatch(
      /<a\b[^>]*href="\/agenda\/lesson-id\/planejamento\?origem=hoje"[^>]*>Ver plano<span class="sr-only"> da aula de Aluno A às 09:30<\/span><\/a>/,
    );
  },
);
