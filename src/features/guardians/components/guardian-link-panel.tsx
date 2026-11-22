import { Search } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linkGuardian } from "../actions";
import { getAvailableGuardian, searchAvailableGuardians } from "../queries";
import { GuardianLinkForm } from "./guardian-link-form";

const searchMaxLength = 120;
const searchSchema = z.object({
  buscaResponsavel: z.string().trim().max(searchMaxLength).catch(""),
  paginaResponsavel: z
    .string()
    .regex(/^\d{1,6}$/)
    .transform(Number)
    .pipe(z.int().positive())
    .catch(1),
  contato: z.uuid().optional().catch(undefined),
});

export async function GuardianLinkPanel({
  studentId,
  params,
}: {
  studentId: string;
  params: Record<string, string | string[] | undefined>;
}) {
  const {
    buscaResponsavel: search,
    paginaResponsavel: page,
    contato: guardianId,
  } = searchSchema.parse(params);
  const baseHref = `/alunos/${studentId}`;
  const sectionHref = `${baseHref}#responsaveis`;

  function searchHref(searchPage = page, selectedId?: string) {
    const query = new URLSearchParams({ acao: "vincular" });
    if (search) query.set("buscaResponsavel", search);
    if (searchPage > 1) query.set("paginaResponsavel", String(searchPage));
    if (selectedId) query.set("contato", selectedId);
    return `${baseHref}?${query}#responsaveis`;
  }

  const selected = guardianId
    ? await getAvailableGuardian(studentId, guardianId)
    : null;
  const results =
    !selected && search
      ? await searchAvailableGuardians(studentId, search, page)
      : null;

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <h3 className="font-bold">Vincular responsável existente</h3>
      {selected ? (
        <>
          <div className="wrap-anywhere">
            <p className="font-semibold">{selected.name}</p>
            {selected.phone && (
              <p className="text-sm text-muted-foreground">{selected.phone}</p>
            )}
          </div>
          <GuardianLinkForm
            key={selected.id}
            action={linkGuardian.bind(null, studentId, selected.id)}
            searchHref={searchHref()}
          />
        </>
      ) : (
        <>
          {guardianId && (
            <Alert
              variant="error"
              message="Este responsável não está mais disponível para vínculo."
            />
          )}
          <form action={sectionHref} className="grid gap-1.5">
            <input type="hidden" name="acao" value="vincular" />
            <label className="text-sm font-semibold" htmlFor="guardian-search">
              Nome do responsável
            </label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="guardian-search"
                name="buscaResponsavel"
                type="search"
                defaultValue={search}
                maxLength={searchMaxLength}
                className="flex-1 basis-40"
                required
              />
              <Button type="submit">
                <Search aria-hidden="true" /> Buscar
              </Button>
            </div>
          </form>
          {results &&
            (results.guardians.length ? (
              <ul className="divide-y rounded-lg border">
                {results.guardians.map((guardian) => (
                  <li key={guardian.id}>
                    <Link
                      href={searchHref(page, guardian.id)}
                      className="flex min-h-11 flex-col justify-center rounded-lg px-3 py-2 wrap-anywhere hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <span className="font-semibold underline">
                        {guardian.name}
                      </span>
                      {guardian.phone && (
                        <span className="text-sm text-muted-foreground">
                          {guardian.phone}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum responsável disponível para este nome.
              </p>
            ))}
          <div className="flex flex-wrap gap-2">
            {results && page > 1 && (
              <Button asChild variant="outline">
                <Link href={searchHref(page - 1)}>Página anterior</Link>
              </Button>
            )}
            {results?.hasNext && (
              <Button asChild variant="outline">
                <Link href={searchHref(page + 1)}>Próxima página</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={sectionHref}>Cancelar</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
