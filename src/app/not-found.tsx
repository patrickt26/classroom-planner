import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageMessage } from "./page-message";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-8">
      <PageMessage
        title="Página não encontrada"
        description="Confira o endereço ou volte ao início para continuar."
      >
        <Button asChild className="px-4">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </PageMessage>
    </main>
  );
}
