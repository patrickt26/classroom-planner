import { Input } from "@/components/ui/input";
import type { Tables } from "@/types/database";
import { ActionForm } from "./action-form";
import { saveRecurrence } from "./actions";
import { weekdays } from "./schedule";

type Option = { id: string; name: string };
const selectClass =
  "block min-h-11 w-full min-w-0 rounded-lg border bg-card px-2";
export function RecurrenceForm({
  row,
  subjects,
  timeZone,
}: {
  row: Tables<"recurrences">;
  subjects: Option[];
  timeZone: string;
}) {
  return (
    <ActionForm action={saveRecurrence.bind(null, row.id)} label="Salvar série">
      <div className="grid gap-3 sm:grid-cols-2 [&_label]:min-w-0 [&_label]:text-sm [&_label]:font-medium">
        <label>
          Disciplina
          <select
            className={selectClass}
            required
            name="subject_id"
            defaultValue={row.subject_id}
          >
            <option value="">Selecione uma disciplina</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dia da semana
          <select
            className={selectClass}
            name="day_of_week"
            defaultValue={row.day_of_week}
          >
            {weekdays.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="series-time">
          Horário ({timeZone})
          <Input
            id="series-time"
            type="time"
            step="any"
            name="start_time"
            required
            defaultValue={row.start_time}
          />
        </label>
        <label htmlFor="series-duration">
          Duração em minutos
          <Input
            id="series-duration"
            type="number"
            name="duration_minutes"
            min={1}
            required
            defaultValue={row.duration_minutes}
          />
        </label>
        <label htmlFor="series-end">
          Repetir até (opcional)
          <Input
            id="series-end"
            type="date"
            name="end_date"
            min={row.start_date}
            defaultValue={row.end_date ?? ""}
          />
        </label>
        <label>
          Modalidade
          <select
            className={selectClass}
            name="modality"
            defaultValue={row.modality}
          >
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
          </select>
        </label>
        <label htmlFor="series-meeting">
          Google Meet para aula online (opcional)
          <Input
            id="series-meeting"
            name="meeting_url"
            type="url"
            defaultValue={row.meeting_url ?? ""}
          />
        </label>
      </div>
    </ActionForm>
  );
}
