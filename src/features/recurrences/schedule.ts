export const weekdays = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function weeklySchedule(day: number, time: string) {
  const [hour, minute, second] = time.split(":");
  const clock =
    Number(minute) === 0 && !Number(second)
      ? `${Number(hour)}h`
      : time.slice(0, Number(second) ? 8 : 5);
  return `${day === 0 || day === 6 ? "Todo" : "Toda"} ${weekdays[day].toLowerCase()} às ${clock}`;
}
