import { Select } from "@/components/ui/select";
import { ActionForm } from "@/features/recurrences/action-form";
import { changeOccurrence } from "@/features/recurrences/actions";
import type { Tables } from "@/types/database";
import { lessonStatusLabels } from "../form-state";

export function OccurrenceActions({
  lesson,
  canChangeStatus,
}: {
  lesson: Pick<Tables<"lessons">, "id" | "status"> & { hasMakeup: boolean };
  canChangeStatus: boolean;
}) {
  const cancelled = lesson.status === "cancelada";
  return (
    <>
      {(lesson.status === "falta" || cancelled) && !lesson.hasMakeup && (
        <ActionForm
          action={changeOccurrence.bind(null, lesson.id)}
          label="Solicitar reposição"
        >
          <input type="hidden" name="status" value="reposicao_pendente" />
        </ActionForm>
      )}
      {canChangeStatus &&
        (lesson.status === "agendada" || lesson.status === "confirmada") && (
          <details className="min-w-0">
            <summary className="min-h-11 cursor-pointer py-3 text-sm">
              Alterar situação
            </summary>
            <ActionForm
              action={changeOccurrence.bind(null, lesson.id)}
              label="Aplicar"
            >
              <label
                htmlFor={`occurrence-status-${lesson.id}`}
                className="text-sm"
              >
                Situação
                <Select
                  id={`occurrence-status-${lesson.id}`}
                  name="status"
                  defaultValue=""
                  required
                >
                  <option value="">Selecione</option>
                  {(
                    ["confirmada", "realizada", "falta", "cancelada"] as const
                  ).map((s) => (
                    <option value={s} key={s}>
                      {lessonStatusLabels[s]}
                    </option>
                  ))}
                </Select>
              </label>
            </ActionForm>
          </details>
        )}
    </>
  );
}
