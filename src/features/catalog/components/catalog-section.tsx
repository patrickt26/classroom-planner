"use client";

import { useActionState, useId } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { saveCatalogItem } from "../actions";
import { type CatalogTable, catalogNameMaxLength } from "../schema";

type Item = {
  id: string;
  name: string;
  archived_at: string | null;
  inUse: boolean;
};

function CatalogItemForm({
  table,
  item,
  label,
}: {
  table: CatalogTable;
  item?: Item;
  label: string;
}) {
  const [feedback, action, pending] = useActionState(
    saveCatalogItem.bind(null, table, item?.id ?? null),
    null,
  );
  const fieldId = useId();
  const formId = useId();

  return (
    <form id={formId} action={action} className="grid gap-2">
      <label htmlFor={fieldId} className="text-sm font-medium">
        Nome da {label}
      </label>
      <Input
        id={fieldId}
        name="name"
        required
        disabled={pending}
        maxLength={catalogNameMaxLength}
        defaultValue={item?.name}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="intent" value="save" disabled={pending}>
          {item ? "Salvar nome" : "Adicionar"}
        </Button>
        {item && (
          <Button
            type="submit"
            name="intent"
            value={item.archived_at ? "unarchive" : "archive"}
            variant="outline"
            formNoValidate
            disabled={pending}
          >
            {item.archived_at ? "Desarquivar" : "Arquivar"}
          </Button>
        )}
        {item && !item.inUse && (
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={pending}>
                Excluir
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton={false}>
              <DialogTitle className="wrap-anywhere">
                Excluir a {label} “{item.name}”?
              </DialogTitle>
              <DialogDescription>A exclusão é permanente.</DialogDescription>
              <Alert
                variant="error"
                message={
                  feedback?.variant === "error" ? feedback.message : undefined
                }
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={pending}>
                    Manter {label}
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  form={formId}
                  name="intent"
                  value="delete"
                  formNoValidate
                  variant="destructive"
                  disabled={pending}
                >
                  {pending ? "Excluindo…" : "Confirmar exclusão"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {item?.inUse && (
        <p className="text-sm text-muted-foreground">
          Esta {label} está em uso. Arquivar preserva os registros vinculados.
        </p>
      )}
      <Alert
        variant="error"
        message={feedback?.variant === "error" ? feedback.message : undefined}
      />
      <Alert
        variant="success"
        message={feedback?.variant === "success" ? feedback.message : undefined}
      />
    </form>
  );
}

export function CatalogSection({
  table,
  items,
}: {
  table: CatalogTable;
  items: Item[];
}) {
  const sectionId = table === "subjects" ? "materias" : "series";
  const title = table === "subjects" ? "Matérias" : "Séries";
  const label = table === "subjects" ? "matéria" : "série";
  return (
    <section
      id={sectionId}
      aria-labelledby={`${sectionId}-titulo`}
      className="grid scroll-mt-4 gap-4 rounded-xl border bg-card p-5 sm:p-7"
    >
      <h2 id={`${sectionId}-titulo`} className="text-xl font-semibold">
        {title}
      </h2>
      <CatalogItemForm table={table} label={label} />
      {items.length > 0 && (
        <ul className="divide-y border-t">
          {items.map((item) => (
            <li key={item.id}>
              <details>
                <summary className="min-h-11 cursor-pointer wrap-anywhere py-2.5">
                  {item.name}
                  {item.archived_at && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      Arquivada
                    </span>
                  )}
                </summary>
                <div className="pb-4">
                  <CatalogItemForm
                    key={item.name}
                    table={table}
                    item={item}
                    label={label}
                  />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
