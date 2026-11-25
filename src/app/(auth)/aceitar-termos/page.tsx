import { redirect } from "next/navigation";
import { AcceptanceForm } from "@/features/legal/components/acceptance-form";
import { LegalLinks } from "@/features/legal/components/legal-links";
import { getCurrentAcceptance } from "@/features/legal/queries";
import { legalVersion, legalVersionLabel } from "@/features/legal/version";

export default async function AcceptTermsPage() {
  if (await getCurrentAcceptance()) redirect("/");
  return (
    <>
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold text-brown">Aceitar termos</h1>
        <p>Leia os documentos para continuar para o seu espaço.</p>
      </header>
      <div className="border-y py-3">
        <p className="text-sm text-muted-foreground">
          Versão de <time dateTime={legalVersion}>{legalVersionLabel}</time>
        </p>
        <LegalLinks />
      </div>
      <AcceptanceForm version={legalVersion} />
    </>
  );
}
