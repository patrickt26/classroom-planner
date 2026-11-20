import { describe, expect, it } from "vitest";
import { lessonSchema, recurrenceSchema } from "./schema";

const schedule = {
  student_id: "09000000-0000-4000-8000-000000000001",
  duration_minutes: 60,
  modality: "online",
};

const lesson = {
  ...schedule,
  subject_id: "09000000-0000-4000-8000-000000000002",
  starts_at: "2026-11-23T14:00:00-03:00",
};

const recurrence = {
  ...schedule,
  day_of_week: 1,
  start_time: "14:00",
  start_date: "2026-11-23",
};

describe("lessonSchema", () => {
  it("accepts an explicit offset and defaults the status", () => {
    expect(lessonSchema.parse(lesson).status).toBe("agendada");
    expect(
      lessonSchema.safeParse({ ...lesson, starts_at: "2026-11-23T14:00:00" })
        .success,
    ).toBe(false);
  });

  it("accepts an optional Meet link and rejects similar hostnames", () => {
    const meeting_url = "https://meet.google.com/abc-defg-hij";
    expect(lessonSchema.parse({ ...lesson, meeting_url }).meeting_url).toBe(
      meeting_url,
    );
    expect(
      lessonSchema.safeParse({
        ...lesson,
        meeting_url: "https://meet.google.com.example.net/abc",
      }).success,
    ).toBe(false);
  });
});

describe("recurrenceSchema", () => {
  it("accepts open-ended and single-day date ranges", () => {
    expect(recurrenceSchema.safeParse(recurrence).success).toBe(true);
    expect(
      recurrenceSchema.safeParse({
        ...recurrence,
        end_date: recurrence.start_date,
      }).success,
    ).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = recurrenceSchema.safeParse({
      ...recurrence,
      end_date: "2026-11-22",
    });
    expect(result.error?.issues[0]?.path).toEqual(["end_date"]);
  });
});
