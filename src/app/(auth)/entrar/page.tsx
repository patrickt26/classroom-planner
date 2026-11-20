import { AuthScreen } from "@/features/auth/components/auth-screen";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { aviso } = await searchParams;
  const notice =
    aviso === "link"
      ? "O link expirou ou já foi usado. Solicite um novo link de recuperação."
      : aviso === "acesso"
        ? "Entre com uma conta de professora para acessar este espaço."
        : undefined;
  return <AuthScreen mode="login" notice={notice} />;
}
