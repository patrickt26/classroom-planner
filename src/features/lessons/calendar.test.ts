import { expect, test } from "vitest";
import { lessonFormSchema } from "./agenda-schema";
import {
  addDays,
  calendarDayStart,
  lessonStartInstant,
  localLessonDateTime,
  weekStart,
} from "./calendar";

test("uses the São Paulo date even when it is already Monday in UTC", () => {
  const local = localLessonDateTime(new Date("2026-11-23T01:30:00Z"));
  expect(local).toBe("2026-11-22T22:30:00");
  expect(weekStart(local.slice(0, 10))).toBe("2026-11-16");
  expect(calendarDayStart("2026-11-23")).toBe("2026-11-23T03:00:00.000Z");
});

test("navigates weeks across a year boundary", () => {
  const start = weekStart("2027-01-03");
  expect(start).toBe("2026-12-28");
  expect(addDays(start, 7)).toBe("2027-01-04");
});

test("uses the historical São Paulo offset and skips nonexistent local times", () => {
  expect(lessonStartInstant("2018-12-01", "09:15")?.toISOString()).toBe(
    "2018-12-01T11:15:00.000Z",
  );
  expect(lessonStartInstant("2018-11-04", "00:30")).toBeNull();
  expect(calendarDayStart("2018-11-04")).toBe("2018-11-04T03:00:00.000Z");
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

  expect(lessonFormSchema.parse(input).starts_at).toBe(
    "2026-11-23T01:30:00.000Z",
  );
  expect(
    lessonFormSchema.safeParse({ ...input, duration_minutes: "0" }).success,
  ).toBe(false);
  expect(
    lessonFormSchema.safeParse({
      ...input,
      meeting_url: "https://meet.google.com.example.test/abc",
    }).success,
  ).toBe(false);
  expect(
    lessonFormSchema.parse({ ...input, modality: "presencial" }).meeting_url,
  ).toBeNull();
});
