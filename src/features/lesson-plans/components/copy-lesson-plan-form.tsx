"use client";

import Form from "next/form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { getLessonPlanning } from "../queries";

type LessonPlanning = Awaited<ReturnType<typeof getLessonPlanning>>;

const selectClassName =
  "min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";
const all = "all";
const noGrade = "no-grade";

function summarizeObjective(objective: string) {
  const characters = Array.from(objective.trim().replace(/\s+/g, " "));
  return characters.length > 72
    ? `${characters.slice(0, 72).join("").trimEnd()}…`
    : characters.join("");
}

export function CopyLessonPlanForm({
  lessonId,
  lesson,
  previousLessons,
  copySourceId,
  timeZone,
}: Pick<LessonPlanning, "lesson" | "previousLessons" | "timeZone"> & {
  lessonId: string;
  copySourceId: string;
}) {
  const [subject, setSubject] = useState(lesson.subject_id);
  const [grade, setGrade] = useState(lesson.students?.grade_id ?? noGrade);
  const [sourceId, setSourceId] = useState(copySourceId);
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    dateStyle: "short",
    timeStyle: "short",
  });

  const subjects = new Map<string, string>();
  const grades = new Map<string, string>();
  for (const item of [lesson, ...previousLessons]) {
    subjects.set(item.subject_id, item.subjects?.name ?? "Matéria");
    grades.set(
      item.students?.grade_id ?? noGrade,
      item.students?.grades?.name ?? "Sem série",
    );
  }

  const matchingLessons = previousLessons.filter(
    (source) =>
      (subject === all || source.subject_id === subject) &&
      (grade === all || (source.students?.grade_id ?? noGrade) === grade),
  );
  const selected = matchingLessons.find((source) => source.id === sourceId);
  const groups = [
    {
      label: "Deste aluno",
      lessons: matchingLessons.filter(
        ({ student_id }) => student_id === lesson.student_id,
      ),
    },
    {
      label: "Outros alunos",
      lessons: matchingLessons.filter(
        ({ student_id }) => student_id !== lesson.student_id,
      ),
    },
  ];

  return (
    <Form
      action={`/agenda/${lessonId}/planejamento`}
      className="grid min-w-0 gap-4 rounded-xl border bg-card p-4 sm:p-6"
    >
      <h2 className="font-semibold text-brown">Copiar plano de outra aula</h2>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="grid min-w-0 gap-1.5">
          <label htmlFor="plan-subject" className="text-sm font-semibold">
            Matéria
          </label>
          <select
            id="plan-subject"
            value={subject}
            onChange={(event) => {
              setSubject(event.target.value);
              setSourceId("");
            }}
            className={selectClassName}
          >
            <option value={all}>Todas</option>
            {[...subjects].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid min-w-0 gap-1.5">
          <label htmlFor="plan-grade" className="text-sm font-semibold">
            Série
          </label>
          <select
            id="plan-grade"
            value={grade}
            onChange={(event) => {
              setGrade(event.target.value);
              setSourceId("");
            }}
            className={selectClassName}
          >
            <option value={all}>Todas</option>
            {[...grades].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid min-w-0 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid min-w-0 gap-1.5">
          <label htmlFor="source-plan" className="text-sm font-semibold">
            Plano anterior
          </label>
          <select
            id="source-plan"
            name="copiar"
            required
            disabled={!matchingLessons.length}
            value={selected?.id ?? ""}
            onChange={(event) => setSourceId(event.target.value)}
            className={selectClassName}
          >
            <option value="">
              {matchingLessons.length
                ? "Selecione uma aula"
                : "Nenhum plano para estes filtros"}
            </option>
            {groups.map(({ label, lessons }) =>
              lessons.length ? (
                <optgroup key={label} label={label}>
                  {lessons.map((source) => (
                    <option key={source.id} value={source.id}>
                      {summarizeObjective(source.lesson_plans.objective)} ·{" "}
                      {source.students?.name} · {source.subjects?.name} ·{" "}
                      {formatter.format(new Date(source.starts_at))}
                    </option>
                  ))}
                </optgroup>
              ) : null,
            )}
          </select>
        </div>
        <Button type="submit" variant="outline" disabled={!selected}>
          Copiar plano
        </Button>
      </div>
      {selected && (
        <p className="wrap-anywhere text-sm text-muted-foreground">
          <strong className="text-foreground">Objetivo do plano</strong>{" "}
          {selected.lesson_plans.objective}
        </p>
      )}
    </Form>
  );
}
