"use client";

import { Search } from "lucide-react";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchGuardiansForRegistration } from "@/features/guardians/actions";
import { GuardianFields } from "@/features/guardians/components/guardian-form";
import type { GuardianFormState } from "@/features/guardians/schema";

type SearchResults = NonNullable<
  Awaited<ReturnType<typeof searchGuardiansForRegistration>>
>;
type Guardian = SearchResults["guardians"][number];

const modes = [
  { value: "new", label: "Cadastrar novo responsável" },
  { value: "existing", label: "Vincular responsável existente" },
] as const;

export function RegistrationGuardian({ state }: { state: GuardianFormState }) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [selected, setSelected] = useState<Guardian | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<
    (SearchResults & { search: string; page: number }) | null
  >(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [searching, startSearch] = useTransition();
  const existing = mode === "existing";

  function runSearch(query: string, page = 1) {
    const name = query.trim();
    if (!name || searching) return;
    startSearch(async () => {
      setSearchMessage("");
      try {
        const matches = await searchGuardiansForRegistration(name, page);
        if (matches) {
          setResults({ ...matches, search: name, page });
          return;
        }
      } catch {
        // The form remains available when the contact lookup fails.
      }
      setSearchMessage(
        "Não foi possível buscar os responsáveis. Tente novamente.",
      );
    });
  }

  return (
    <fieldset className="grid min-w-0 gap-3 border-t pt-3">
      <legend className="pr-2 font-bold text-brown">
        Responsável obrigatório
      </legend>
      <Alert variant="error" message={state.message} />
      <div className="flex flex-wrap gap-x-4">
        {modes.map(({ value, label }) => (
          <label
            key={value}
            className="flex min-h-11 items-center gap-2 text-sm"
          >
            <input
              type="radio"
              name="guardian_mode"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              className="size-4 accent-primary"
            />
            {label}
          </label>
        ))}
      </div>
      {existing &&
        (selected ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <input type="hidden" name="guardian_id" value={selected.id} />
            <div className="min-w-0 wrap-anywhere">
              <p className="font-semibold">{selected.name}</p>
              {selected.phone && (
                <p className="text-sm text-muted-foreground">
                  {selected.phone}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelected(null)}
            >
              Trocar responsável
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            <label
              htmlFor="registration-guardian-search"
              className="text-sm font-semibold"
            >
              Nome do responsável
            </label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="registration-guardian-search"
                type="search"
                className="flex-1 basis-40"
                maxLength={120}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    runSearch(search);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => runSearch(search)}
                disabled={searching || !search.trim()}
              >
                <Search aria-hidden="true" />{" "}
                {searching ? "Buscando…" : "Buscar"}
              </Button>
            </div>
            <Alert variant="error" message={searchMessage} />
            {results &&
              (results.guardians.length ? (
                <ul className="divide-y rounded-lg border">
                  {results.guardians.map((guardian) => (
                    <li key={guardian.id}>
                      <button
                        type="button"
                        className="flex min-h-11 w-full flex-col justify-center rounded-lg px-3 py-2 text-left wrap-anywhere hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                        onClick={() => setSelected(guardian)}
                        disabled={searching}
                      >
                        <span className="font-semibold underline">
                          {guardian.name}
                        </span>
                        {guardian.phone && (
                          <span className="text-sm text-muted-foreground">
                            {guardian.phone}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p role="status" className="text-sm text-muted-foreground">
                  Nenhum responsável disponível para este nome.
                </p>
              ))}
            {results && (results.page > 1 || results.hasNext) && (
              <div className="flex flex-wrap gap-2">
                {results.page > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={searching}
                    onClick={() => runSearch(results.search, results.page - 1)}
                  >
                    Página anterior
                  </Button>
                )}
                {results.hasNext && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={searching}
                    onClick={() => runSearch(results.search, results.page + 1)}
                  >
                    Próxima página
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      <div key={state.attempt} className="grid gap-3 sm:grid-cols-2">
        <GuardianFields
          values={state.values}
          errors={state.errors}
          prefix="guardian_"
          existing={existing}
        />
      </div>
    </fieldset>
  );
}
