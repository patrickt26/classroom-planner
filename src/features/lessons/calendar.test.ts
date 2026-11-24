import { expect, test } from "vitest";
import { firstAgendaDate, lessonFormSchema } from "./agenda-schema";
import {
  addDays,
  agendaHref,
  calendarDayStart,
  lessonStartInstant,
  localLessonDateTime,
  weekStart,
} from "./calendar";

test("uses the São Paulo date even when it is already Monday in UTC", () => {
  const local = localLessonDateTime(
    new Date("2026-11-23T01:30:00Z"),
    "America/Sao_Paulo",
  );
  expect(local).toBe("2026-11-22T22:30:00");
  expect(weekStart(local.slice(0, 10))).toBe("2026-11-16");
  expect(calendarDayStart("2026-11-23", "America/Sao_Paulo")).toBe(
    "2026-11-23T03:00:00.000Z",
  );
});

test("navigates weeks across a year boundary", () => {
  const start = weekStart("2027-01-03");
  expect(start).toBe("2026-12-28");
  expect(addDays(start, 7)).toBe("2027-01-04");
});

test("keeps Sunday in the selected week when opening an agenda link", () => {
  const sunday = "2027-01-03";
  const href = new URL(agendaHref(sunday, "salva"), "https://example.test");
  expect(href.searchParams.get("semana")).toBe(sunday);
  expect(weekStart(sunday, "sunday")).toBe(sunday);
  expect(weekStart("2027-01-09", "sunday")).toBe(sunday);
  expect(weekStart(addDays(sunday, -7), "sunday")).toBe("2026-12-27");
  expect(weekStart(addDays(sunday, 7), "sunday")).toBe("2027-01-10");
});

test("starts the next full Sunday week after the earliest agenda date", () => {
  const firstWeek = weekStart(firstAgendaDate, "sunday");
  expect(firstWeek).toBe("0000-12-31");
  expect(addDays(firstWeek, 7)).toBe("0001-01-07");
});

test("uses the historical São Paulo offset and skips nonexistent local times", () => {
  expect(
    lessonStartInstant(
      "2018-12-01",
      "09:15",
      "America/Sao_Paulo",
    )?.toISOString(),
  ).toBe("2018-12-01T11:15:00.000Z");
  expect(
    lessonStartInstant("2018-11-04", "00:30", "America/Sao_Paulo"),
  ).toBeNull();
  expect(calendarDayStart("2018-11-04", "America/Sao_Paulo")).toBe(
    "2018-11-04T03:00:00.000Z",
  );
});

test("validates Meet links and positive duration on the server", () => {
  const input = {
    student_id: "10000000-0000-4000-8000-000000000001",
    subject_id: "10000000-0000-4000-8000-000000000002",
    date: "2026-11-22",
    time: "22:30",
    duration_minutes: "60",
    status: "confirmada",
    modality: "online",
    meeting_url: "https://meet.google.com/abc-defg-hij",
  };

  expect(lessonFormSchema("America/Sao_Paulo").parse(input).starts_at).toBe(
    "2026-11-23T01:30:00.000Z",
  );
  expect(
    lessonFormSchema("America/Sao_Paulo").safeParse({
      ...input,
      duration_minutes: "0",
    }).success,
  ).toBe(false);
  expect(
    lessonFormSchema("America/Sao_Paulo").safeParse({
      ...input,
      meeting_url: "https://meet.google.com.example.test/abc",
    }).success,
  ).toBe(false);
  expect(
    lessonFormSchema("America/Sao_Paulo").parse({
      ...input,
      modality: "presencial",
    }).meeting_url,
  ).toBeNull();
});

test("uses workspace time across UTC dates and resolves repeated times like PostgreSQL", () => {
  expect(calendarDayStart("2026-11-23", "Asia/Tokyo")).toBe(
    "2026-11-22T15:00:00.000Z",
  );
  expect(
    lessonStartInstant(
      "2026-11-01",
      "01:30",
      "America/New_York",
    )?.toISOString(),
  ).toBe("2026-11-01T06:30:00.000Z");
});
