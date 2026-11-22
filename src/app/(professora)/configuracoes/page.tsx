import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";
import { AccountForm } from "@/features/auth/components/account-form";
import { saveWorkspace } from "@/features/workspace/actions";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

export default async function SettingsPage() {
  const workspace = await requireTeacherWorkspace();
  return (
    <>
      <h1 className="mb-7 text-3xl font-bold text-brown">Configurações</h1>
      <div className="grid items-start gap-5 lg:grid-cols-[2fr_1fr]">
        <section className="grid gap-5 rounded-xl border bg-card p-5 sm:p-7">
          <h2 className="text-xl font-semibold">Configurações do espaço</h2>
          <AccountForm
            action={saveWorkspace}
            fields={[
              {
                name: "name",
                label: "Nome do espaço",
                maxLength: 100,
                defaultValue: workspace.name,
              },
              {
                name: "brand",
                label: "Marca (opcional)",
                optional: true,
                maxLength: 100,
                defaultValue: workspace.brand,
              },
            ]}
            submit="Salvar alterações"
          />
        </section>
        <section className="grid gap-4 rounded-xl border bg-card p-5 sm:p-7">
          <h2 className="text-xl font-semibold">Conta</h2>
          <form action={logout}>
            <Button variant="outline">Sair</Button>
          </form>
        </section>
      </div>
    </>
  );
}
