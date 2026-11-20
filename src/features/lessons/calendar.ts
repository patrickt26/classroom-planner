const timeZone = "America/Sao_Paulo";
const localDateTime = new Intl.DateTimeFormat("sv-SE", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function localLessonDateTime(date: Date) {
  return localDateTime
    .format(date)
    .replace(/^\d+/, (year) => year.padStart(4, "0"))
    .replace(" ", "T");
}

export function lessonStartInstant(date: string, time: string) {
  const wallTime = new Date(`${date}T${time}Z`);
  const timestamp = wallTime.getTime();
  const wallTimeText = wallTime.toISOString().slice(0, 19);

  // Offsets on either side of the date also cover historical clock changes.
  const wholeSecond = Math.floor(timestamp / 1_000) * 1_000;
  const offsets = [-24, 24].map((hours) => {
    const sample = new Date(wholeSecond + hours * 3_600_000);
    return Date.parse(`${localLessonDateTime(sample)}Z`) - sample.getTime();
  });

  for (const offset of offsets.sort((a, b) => b - a)) {
    const instant = new Date(timestamp - offset);
    if (localLessonDateTime(instant) === wallTimeText) return instant;
  }
  return null;
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function weekStart(date: string) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

export function calendarDayStart(date: string) {
  // In older weeks, the switch to summer time skipped local midnight.
  const midnight =
    lessonStartInstant(date, "00:00") ?? lessonStartInstant(date, "01:00");
  if (!midnight) throw new RangeError("Data inválida para a agenda.");
  return midnight.toISOString();
}

export function formatCalendarDay(
  date: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("pt-BR", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatLessonTime(date: Date) {
  return localLessonDateTime(date).slice(11, 16);
}

export function agendaHref(date: string, notice?: string) {
  const query = new URLSearchParams({ semana: weekStart(date) });
  if (notice) query.set("aviso", notice);
  return `/agenda?${query}`;
}
