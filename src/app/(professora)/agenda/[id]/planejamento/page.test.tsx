import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { getLessonPlanning } from "@/features/lesson-plans/queries";
import LessonPlanningPage from "./page";

vi.mock(
  "@/components/ui/alert",
  () => import("../../../../../components/ui/alert"),
);
vi.mock(
  "@/components/ui/button",
  () => import("../../../../../components/ui/button"),
);
vi.mock("@/lib/utils", () => import("../../../../../lib/utils"));
vi.mock(
  "@/features/lessons/calendar",
  () => import("../../../../../features/lessons/calendar"),
);
vi.mock("@/features/lesson-notes/components/previous-lesson-note", () => ({
  PreviousLessonNote: () => null,
}));
vi.mock("@/features/lesson-plans/components/copy-lesson-plan-form", () => ({
  CopyLessonPlanForm: () => null,
}));
vi.mock("@/features/lesson-plans/queries", () => ({
  getLessonPlanning: vi.fn(),
}));
vi.mock("@/features/lesson-plans/actions", () => ({
  saveLessonPlan: vi.fn(),
}));
vi.mock("@/features/lesson-plans/components/lesson-plan-form", () => ({
  LessonPlanForm: () => null,
}));

test.each([
  { origem: "hoje", label: "Voltar para Hoje", href: "/" },
  {
    origem: undefined,
    label: "Voltar para a agenda",
    href: "/agenda?semana=2026-11-24",
  },
  {
    origem: "agenda",
    label: "Voltar para a agenda",
    href: "/agenda?semana=2026-11-24",
  },
  {
    origem: ["hoje", "hoje"],
    label: "Voltar para a agenda",
    href: "/agenda?semana=2026-11-24",
  },
])(
  "shows the back link $label for origem=$origem",
  async ({ origem, label, href }) => {
    vi.mocked(getLessonPlanning).mockResolvedValue({
      lesson: {
        student_id: "student-id",
        subject_id: "subject-id",
        starts_at: "2026-11-24T12:30:00Z",
        students: { name: "Aluno A", grade_id: null, grades: null },
        subjects: { name: "Matemática" },
        lesson_plans: null,
      },
      previousLessons: [],
      previousNote: null,
      copy: null,
      timeZone: "America/Sao_Paulo",
    });

    const markup = renderToStaticMarkup(
      await LessonPlanningPage({
        params: Promise.resolve({ id: "lesson-id" }),
        searchParams: Promise.resolve({ origem }),
      }),
    );

    expect(markup).toContain(`href="${href}">${label}</a>`);
  },
);
