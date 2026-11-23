import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Tables } from "@/types/database";
import { ActionForm } from "./action-form";
import { saveRecurrence } from "./actions";
import { weekdays } from "./schedule";

type Option = { id: string; name: string };
export function RecurrenceForm({
  row,
  subjects,
}: {
  row: Tables<"recurrences">;
  subjects: Option[];
}) {
  return (
    <ActionForm action={saveRecurrence.bind(null, row.id)} label="Salvar série">
      <div className="grid gap-3 sm:grid-cols-2 [&_label]:min-w-0 [&_label]:text-sm [&_label]:font-medium">
        <label htmlFor="series-subject">
          Disciplina
          <Select
            id="series-subject"
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
          </Select>
        </label>
        <label htmlFor="series-weekday">
          Dia da semana
          <Select
            id="series-weekday"
            name="day_of_week"
            defaultValue={row.day_of_week}
          >
            {weekdays.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </Select>
        </label>
        <label htmlFor="series-time">
          Horário
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
        <div className="min-w-0">
          <label htmlFor="series-end">Repetir até (opcional)</label>
          <DatePicker
            id="series-end"
            label="Repetir até"
            name="end_date"
            min={row.start_date}
            defaultValue={row.end_date ?? ""}
          />
        </div>
        <label htmlFor="series-modality">
          Modalidade
          <Select
            id="series-modality"
            name="modality"
            defaultValue={row.modality}
          >
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
          </Select>
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
