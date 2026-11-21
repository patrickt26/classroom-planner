import { Input } from "@/components/ui/input";
import type { Tables } from "@/types/database";
import { ActionForm } from "./action-form";
import { saveRecurrence } from "./actions";

export const weekdays = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
type Option = { id: string; name: string };
const selectClass =
  "block min-h-11 w-full min-w-0 rounded-lg border bg-card px-2";
export function RecurrenceForm({
  row,
  students,
  subjects,
  today,
  timeZone,
}: {
  row?: Tables<"recurrences">;
  students: Option[];
  subjects: Option[];
  today: string;
  timeZone: string;
}) {
  return (
    <ActionForm
      action={saveRecurrence.bind(null, row?.id ?? null)}
      label="Salvar recorrência"
    >
      <div className="grid gap-3 sm:grid-cols-2 [&_label]:min-w-0 [&_label]:text-sm [&_label]:font-medium">
        {row ? (
          <input type="hidden" name="student_id" value={row.student_id} />
        ) : (
          <label>
            Aluno
            <select
              className={selectClass}
              required
              name="student_id"
              defaultValue=""
            >
              <option value="">Selecione um aluno</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Disciplina
          <select
            className={selectClass}
            required
            name="subject_id"
            defaultValue={row?.subject_id ?? ""}
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
            defaultValue={row?.day_of_week ?? 1}
          >
            {weekdays.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${row?.id ?? "new"}-start_time`}>
          Horário ({timeZone})
          <Input
            id={`${row?.id ?? "new"}-start_time`}
            type="time"
            step="any"
            name="start_time"
            required
            defaultValue={row?.start_time ?? "09:00"}
          />
        </label>
        <label htmlFor={`${row?.id ?? "new"}-duration_minutes`}>
          Duração em minutos
          <Input
            id={`${row?.id ?? "new"}-duration_minutes`}
            type="number"
            name="duration_minutes"
            min={1}
            required
            defaultValue={row?.duration_minutes ?? 60}
          />
        </label>
        <label htmlFor={`${row?.id ?? "new"}-start_date`}>
          Data inicial
          <Input
            id={`${row?.id ?? "new"}-start_date`}
            type="date"
            name="start_date"
            required
            defaultValue={row?.start_date ?? today}
          />
        </label>
        <label htmlFor={`${row?.id ?? "new"}-end_date`}>
          Data final (opcional)
          <Input
            id={`${row?.id ?? "new"}-end_date`}
            type="date"
            name="end_date"
            defaultValue={row?.end_date ?? ""}
          />
        </label>
        <label>
          Modalidade
          <select
            className={selectClass}
            name="modality"
            defaultValue={row?.modality ?? "presencial"}
          >
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
          </select>
        </label>
        <label htmlFor={`${row?.id ?? "new"}-meeting_url`}>
          Google Meet para aula online (opcional)
          <Input
            id={`${row?.id ?? "new"}-meeting_url`}
            name="meeting_url"
            type="url"
            defaultValue={row?.meeting_url ?? ""}
          />
        </label>
      </div>
    </ActionForm>
  );
}
