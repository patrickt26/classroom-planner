"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { eraseStudent } from "../actions";

export function EraseStudentForm({ id, name }: { id: string; name: string }) {
  const [typedName, setTypedName] = useState("");
  const [feedback, action, pending] = useActionState(
    eraseStudent.bind(null, id),
    null,
  );
  return (
    <form action={action} className="grid gap-4">
      <label htmlFor="erasure-name" className="grid gap-1 font-medium">
        Digite o nome completo do aluno para confirmar
        <Input
          id="erasure-name"
          autoComplete="off"
          spellCheck={false}
          name="name"
          required
          value={typedName}
          onChange={(event) => setTypedName(event.target.value)}
        />
      </label>
      {feedback && <Alert {...feedback} />}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          type="submit"
          disabled={pending || typedName !== name}
        >
          {pending ? "Excluindo…" : "Excluir dados do aluno"}
        </Button>
        <Button asChild variant="outline">
          <Link href={`/alunos/${id}`}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
