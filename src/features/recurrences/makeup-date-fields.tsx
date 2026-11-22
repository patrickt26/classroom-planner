"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

export function MakeupDateFields({
  id,
  originalDate,
  originalTime,
  today,
  timeZone,
}: {
  id: string;
  originalDate: string;
  originalTime: string;
  today: string;
  timeZone: string;
}) {
  const [date, setDate] = useState(today < originalDate ? originalDate : today);

  return (
    <>
      <label htmlFor={`${id}-date`}>
        Nova data
        <Input
          id={`${id}-date`}
          type="date"
          name="date"
          required
          min={originalDate}
          value={date}
          onChange={(event) => setDate(event.currentTarget.value)}
        />
      </label>
      <label htmlFor={`${id}-time`}>
        Novo horário ({timeZone})
        <Input
          id={`${id}-time`}
          type="time"
          name="time"
          required
          min={date === originalDate ? originalTime : undefined}
          step="any"
          defaultValue={originalTime}
        />
      </label>
    </>
  );
}
