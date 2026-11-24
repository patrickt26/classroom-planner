import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { getAuthenticatedUserId } from "@/lib/supabase/server";
import Page, { generateMetadata } from "./page";

vi.mock("@/lib/platform", () => import("../../lib/platform"));
vi.mock("@/lib/supabase/server", () => ({
  getAuthenticatedUserId: vi.fn(),
}));
vi.mock("@/features/landing/components/landing-page", () => ({
  LandingPage: () => <h1>Classroom Planner</h1>,
}));
vi.mock("@/features/navigation/components/teacher-layout", () => ({
  TeacherLayout: ({ children }: { children: ReactNode }) => (
    <main aria-label="Espaço da professora">{children}</main>
  ),
}));
vi.mock("@/features/today/components/today-page", () => ({
  TodayPage: () => <h1>Hoje</h1>,
}));

test("presents the platform at the public root", async () => {
  vi.mocked(getAuthenticatedUserId).mockResolvedValue(undefined);

  expect(renderToStaticMarkup(await Page())).toBe("<h1>Classroom Planner</h1>");
  expect(await generateMetadata()).toMatchObject({
    robots: { index: true, follow: true },
    alternates: { canonical: "/" },
  });
});

test("shows Today in the teacher shell at the same URL after login", async () => {
  vi.mocked(getAuthenticatedUserId).mockResolvedValue("teacher");

  expect(renderToStaticMarkup(await Page())).toBe(
    '<main aria-label="Espaço da professora"><h1>Hoje</h1></main>',
  );
  expect(await generateMetadata()).toEqual({
    title: "Hoje | Classroom Planner",
  });
});
