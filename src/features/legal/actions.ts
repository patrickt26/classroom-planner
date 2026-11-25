"use server";

import { redirect } from "next/navigation";
import type { FormFeedback } from "@/components/ui/alert";
import { createClient, getAuthenticatedUserId } from "@/lib/supabase/server";
import { acceptanceSchema } from "./schema";
import { legalVersion } from "./version";

export async function acceptTerms(
  _: FormFeedback,
  form: FormData,
): Promise<FormFeedback> {
  const input = acceptanceSchema.safeParse(Object.fromEntries(form));
  if (!input.success) {
    return {
      variant: "error",
      message:
        form.get("version") === legalVersion
          ? "Marque a caixa de aceite para continuar."
          : "Os documentos mudaram. Atualize a página para ler a versão vigente.",
    };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/entrar");
  const client = await createClient();
  const { error } = await client
    .from("terms_acceptances")
    .upsert(
      { user_id: userId, terms_version: legalVersion },
      { onConflict: "user_id,terms_version", ignoreDuplicates: true },
    );
  if (error)
    return {
      variant: "error",
      message: "Não foi possível registrar seu aceite. Tente novamente.",
    };
  redirect("/");
}
