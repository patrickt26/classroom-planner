import type { FormFeedback } from "@/components/ui/alert";
import { AuthScreen } from "@/features/auth/components/auth-screen";
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
