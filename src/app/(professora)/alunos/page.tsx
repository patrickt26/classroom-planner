import { Pencil, Plus, Search, Users } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatReais } from "@/features/students/form-state";
import { listStudents } from "@/features/students/queries";

const notices = {
  cadastrado: "Aluno cadastrado.",
  salvo: "Alterações salvas.",
  arquivado: "Aluno arquivado.",
  reativado: "Aluno reativado.",
};
const noticeSchema = z.enum(["cadastrado", "salvo", "arquivado", "reativado"]);

export const metadata = { title: "Alunos | Planejamento de aulas" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { students, filters, hasNextPage } = await listStudents(params);
  const notice = noticeSchema.safeParse(params.aviso);
  const archived = filters.situacao === "arquivados";
  const emptyActiveList =
    !archived &&
    !filters.busca &&
    filters.pagina === 1 &&
    students.length === 0;

  function listHref(status: typeof filters.situacao, page = 1) {
    const query = new URLSearchParams();
    if (filters.busca) query.set("busca", filters.busca);
    if (status === "arquivados") query.set("situacao", status);
    if (page > 1) query.set("pagina", String(page));
    return query.size ? `/alunos?${query}` : "/alunos";
  }

  const addStudent = (
    <Button asChild className="px-4">
      <Link href="/alunos/novo">
        <Plus aria-hidden="true" /> Cadastrar aluno
      </Link>
    </Button>
  );

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-brown">Alunos</h1>
        {!emptyActiveList && addStudent}
      </header>
      {notice.success && (
        <Alert variant="success" message={notices[notice.data]} />
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <Form action="/alunos" className="grid gap-2 lg:max-w-lg">
          {archived && (
            <input type="hidden" name="situacao" value="arquivados" />
          )}
          <label htmlFor="busca" className="text-sm font-semibold">
            Buscar por nome
          </label>
          <div className="flex gap-2">
            <Input
              key={filters.busca}
              id="busca"
              name="busca"
              type="search"
              maxLength={100}
              placeholder="Nome do aluno"
              defaultValue={filters.busca}
            />
            <Button type="submit" variant="outline">
              <Search aria-hidden="true" /> Buscar
            </Button>
          </div>
        </Form>

        <nav
          aria-label="Situação dos alunos"
          className="flex w-fit gap-1 rounded-xl bg-muted p-1"
        >
          <Button
            asChild
            variant={archived ? "ghost" : "default"}
            className="px-4"
          >
            <Link
              href={listHref("ativos")}
              aria-current={archived ? undefined : "page"}
            >
              Ativos
            </Link>
          </Button>
          <Button
            asChild
            variant={archived ? "default" : "ghost"}
            className="px-4"
          >
            <Link
              href={listHref("arquivados")}
              aria-current={archived ? "page" : undefined}
            >
              Arquivados
            </Link>
          </Button>
        </nav>
      </div>

      {students.length > 0 ? (
        <ul className="grid gap-3 xl:grid-cols-2">
          {students.map((student) => {
            const subjects = student.student_subjects
              .flatMap(({ subjects }) => (subjects ? [subjects.name] : []))
              .sort((a, b) => a.localeCompare(b, "pt-BR"));
            const details = [student.grades?.name, ...subjects]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={student.id}
                className="flex items-start gap-3 rounded-xl border bg-card p-4 sm:p-5"
              >
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary font-bold text-navy"
                >
                  {Array.from(student.name)[0]?.toLocaleUpperCase("pt-BR")}
                </span>
                <div className="min-w-0 flex-1 wrap-anywhere">
                  <h2 className="font-bold">
                    <Link
                      href={`/alunos/${student.id}`}
                      className="inline-flex min-h-11 items-center rounded-sm underline decoration-border underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {student.name}
                    </Link>
                  </h2>
                  {details && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {details}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm font-semibold">
                    {student.is_free
                      ? "Gratuito"
                      : `${formatReais.format(student.hourly_rate / 100)} / hora`}
                  </p>
                </div>
                <Button variant="ghost" asChild>
                  <Link
                    href={`/alunos/${student.id}/editar`}
                    aria-label={`Editar ${student.name}`}
                  >
                    <Pencil aria-hidden="true" /> Editar
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <section className="grid justify-items-center gap-3 rounded-xl border bg-card px-5 py-10 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-muted">
            <Users aria-hidden="true" className="size-6" />
          </div>
          <h2 className="font-bold">
            {filters.busca
              ? "Nenhum aluno encontrado"
              : archived
                ? "Nenhum aluno arquivado"
                : emptyActiveList
                  ? "Nenhum aluno ativo"
                  : "Nenhum aluno nesta página"}
          </h2>
          {emptyActiveList && addStudent}
          {filters.busca && (
            <Button asChild variant="outline">
              <Link href={archived ? "/alunos?situacao=arquivados" : "/alunos"}>
                Limpar busca
              </Link>
            </Button>
          )}
        </section>
      )}

      {(filters.pagina > 1 || hasNextPage) && (
        <nav
          aria-label="Páginas de alunos"
          className="flex items-center justify-end gap-3"
        >
          {filters.pagina > 1 && (
            <Button asChild variant="outline">
              <Link href={listHref(filters.situacao, filters.pagina - 1)}>
                Anterior
              </Link>
            </Button>
          )}
          <span className="text-sm">Página {filters.pagina}</span>
          {hasNextPage && (
            <Button asChild variant="outline">
              <Link href={listHref(filters.situacao, filters.pagina + 1)}>
                Próxima
              </Link>
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
