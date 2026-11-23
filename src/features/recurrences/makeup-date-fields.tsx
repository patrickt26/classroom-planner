"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";

export function MakeupDateFields({
  id,
  originalDate,
  originalTime,
  today,
}: {
  id: string;
  originalDate: string;
  originalTime: string;
  today: string;
}) {
  const [date, setDate] = useState(today < originalDate ? originalDate : today);

  return (
    <>
      <div>
        <label htmlFor={`${id}-date`}>Nova data</label>
        <DatePicker
          id={`${id}-date`}
          label="Nova data"
          name="date"
          required
          min={originalDate}
          value={date}
          onValueChange={setDate}
        />
      </div>
      <label htmlFor={`${id}-time`}>
        Novo horário
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
