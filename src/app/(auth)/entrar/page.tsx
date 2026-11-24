import type { Metadata } from "next";
import type { FormFeedback } from "@/components/ui/alert";
import { AuthScreen } from "@/features/auth/components/auth-screen";

export const metadata: Metadata = {
  title: "Entrar | Planejamento de aulas",
  description:
    "Acesse seu espaço de professora particular para organizar alunos, agendar e planejar aulas e acompanhar cobranças.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { aviso } = await searchParams;
  const notice: FormFeedback =
    aviso === "link"
      ? {
          variant: "error",
          message:
            "O link expirou ou já foi usado. Solicite um novo link de recuperação.",
        }
      : aviso === "acesso"
        ? {
            variant: "info",
            message:
              "Entre com uma conta de professora para acessar este espaço.",
          }
        : null;
  return <AuthScreen mode="login" notice={notice} />;
}
