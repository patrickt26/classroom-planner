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
        <div className="p-1">
          <ActionForm
            action={changeOccurrence.bind(null, lesson.id)}
            label="Solicitar reposição"
          >
            <input type="hidden" name="status" value="reposicao_pendente" />
          </ActionForm>
        </div>
      )}
      {canChangeStatus &&
        (lesson.status === "agendada" || lesson.status === "confirmada") && (
          <details className="px-2 pb-2">
            <summary className="min-h-11 cursor-pointer py-2 text-sm">
              Alterar situação
            </summary>
            <ActionForm
              action={changeOccurrence.bind(null, lesson.id)}
              label="Aplicar"
            >
              <label className="text-sm">
                Situação
                <select
                  className="min-h-11 w-full rounded border bg-card"
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
                </select>
              </label>
            </ActionForm>
          </details>
        )}
    </>
  );
}
