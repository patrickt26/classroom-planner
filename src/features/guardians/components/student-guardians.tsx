import {
  Link2,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { removeGuardian, saveGuardian } from "../actions";
import { listStudentGuardians } from "../queries";
import { normalizePhone } from "../schema";
import { GuardianForm, RemoveGuardianForm } from "./guardian-form";
import { GuardianLinkPanel } from "./guardian-link-panel";

const notices = {
  cadastrado: "Responsável cadastrado.",
  vinculado: "Responsável vinculado.",
  salvo: "Responsável atualizado.",
  removido: "Responsável removido desta ficha.",
};
const panelSchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("cadastrar") }),
  z.object({ acao: z.literal("vincular") }),
  z.object({ acao: z.enum(["editar", "remover"]), responsavel: z.uuid() }),
]);
const noticeSchema = z.enum(["cadastrado", "vinculado", "salvo", "removido"]);

export async function StudentGuardians({
  studentId,
  params,
}: {
  studentId: string;
  params: Record<string, string | string[] | undefined>;
}) {
  const guardians = await listStudentGuardians(studentId);
  const panel = panelSchema.safeParse(params).data;
  const selected =
    panel && "responsavel" in panel
      ? guardians.find(({ guardian_id }) => guardian_id === panel.responsavel)
      : undefined;
  const adding = panel?.acao === "cadastrar";
  const linking = panel?.acao === "vincular";
  const editing = panel?.acao === "editar" && selected;
  const removing = panel?.acao === "remover" && selected;
  const baseHref = `/alunos/${studentId}`;
  const sectionHref = `${baseHref}#responsaveis`;
  const notice = noticeSchema.safeParse(params.aviso);

  return (
    <section aria-labelledby="responsaveis" className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2
          id="responsaveis"
          className="scroll-mt-4 text-xl font-bold text-brown"
        >
          Responsáveis
        </h2>
        <div className="flex flex-wrap gap-2">
          {!adding && (
            <Button asChild variant="outline">
              <Link href={`${baseHref}?acao=cadastrar#responsaveis`}>
                <Plus aria-hidden="true" /> Cadastrar responsável
              </Link>
            </Button>
          )}
          {!linking && (
            <Button asChild variant="outline">
              <Link href={`${baseHref}?acao=vincular#responsaveis`}>
                <Link2 aria-hidden="true" /> Vincular responsável existente
              </Link>
            </Button>
          )}
        </div>
      </header>

      {notice.success && (
        <Alert variant="success" message={notices[notice.data]} />
      )}
      {panel && "responsavel" in panel && !selected && (
        <Alert
          variant="error"
          message="Este responsável não está vinculado ao aluno."
        />
      )}

      {linking && <GuardianLinkPanel studentId={studentId} params={params} />}

      {(adding || editing || removing) && (
        <div className="grid gap-4 rounded-xl border bg-card p-4 sm:p-5">
          <h3 className="font-bold">
            {adding
              ? "Cadastrar responsável"
              : editing
                ? "Editar responsável"
                : "Remover responsável"}
          </h3>
          {removing ? (
            <RemoveGuardianForm
              key={removing.guardian_id}
              name={removing.guardians.name}
              action={removeGuardian.bind(
                null,
                studentId,
                removing.guardian_id,
              )}
              cancelHref={sectionHref}
            />
          ) : (
            <GuardianForm
              key={editing ? editing.guardian_id : "new"}
              action={saveGuardian.bind(
                null,
                studentId,
                editing ? editing.guardian_id : null,
              )}
              initialValues={{
                name: editing ? editing.guardians.name : "",
                relationship: editing ? editing.relationship : "",
                phone: editing ? (editing.guardians.phone ?? "") : "",
                financial: editing ? editing.is_financial_guardian : false,
              }}
              cancelHref={sectionHref}
            />
          )}
        </div>
      )}

      {guardians.length > 0 && (
        <ul className="grid gap-3">
          {guardians.map(
            ({
              guardian_id: id,
              guardians: guardian,
              relationship,
              is_financial_guardian,
            }) => {
              const phone = guardian.phone && normalizePhone(guardian.phone);
              return (
                <li
                  key={id}
                  className="grid gap-3 rounded-xl border bg-card p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0 wrap-anywhere">
                      <h3 className="font-bold">{guardian.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {relationship}
                      </p>
                    </div>
                    {is_financial_guardian && (
                      <p className="rounded-md bg-info-surface px-2 py-1 text-sm font-semibold text-navy">
                        Responsável financeiro
                      </p>
                    )}
                  </div>
                  {guardian.phone && (
                    <p className="wrap-anywhere text-sm">{guardian.phone}</p>
                  )}
                  {phone && (
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline">
                        <a
                          href={`tel:${phone}`}
                          aria-label={`Ligar para ${guardian.name}`}
                        >
                          <Phone aria-hidden="true" /> Ligar
                        </a>
                      </Button>
                      <Button asChild variant="outline">
                        <a
                          href={`https://wa.me/${phone.slice(1)}`}
                          aria-label={`WhatsApp de ${guardian.name}`}
                        >
                          <MessageCircle aria-hidden="true" /> WhatsApp
                        </a>
                      </Button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 border-t pt-2">
                    <Button asChild variant="ghost">
                      <Link
                        href={`${baseHref}?acao=editar&responsavel=${id}#responsaveis`}
                        aria-label={`Editar ${guardian.name}`}
                      >
                        <Pencil aria-hidden="true" /> Editar
                      </Link>
                    </Button>
                    <Button asChild variant="ghost">
                      <Link
                        href={`${baseHref}?acao=remover&responsavel=${id}#responsaveis`}
                        aria-label={`Remover ${guardian.name}`}
                      >
                        <Trash2 aria-hidden="true" /> Remover
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            },
          )}
        </ul>
      )}
    </section>
  );
}
