import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";
import { AccountForm } from "@/features/auth/components/account-form";
import { CatalogSection } from "@/features/catalog/components/catalog-section";
import { listCatalogItems } from "@/features/catalog/queries";
import { saveWorkspace } from "@/features/workspace/actions";
import { requireTeacherWorkspace } from "@/features/workspace/queries";

export default async function SettingsPage() {
  const [workspace, subjects, grades] = await Promise.all([
    requireTeacherWorkspace(),
    listCatalogItems("subjects"),
    listCatalogItems("grades"),
  ]);
  return (
    <>
      <h1 className="mb-7 text-3xl font-bold text-brown">Configurações</h1>
      <div className="grid items-start gap-5 lg:grid-cols-2">
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
              {
                name: "week_start",
                label: "Primeiro dia da semana",
                defaultValue: workspace.week_start,
                options: [
                  { value: "monday", label: "Segunda-feira" },
                  { value: "sunday", label: "Domingo" },
                ],
              },
            ]}
            submit="Salvar alterações"
          />
        </section>
        <CatalogSection table="subjects" items={subjects} />
        <CatalogSection table="grades" items={grades} />
        <section className="grid gap-4 rounded-xl border bg-card p-5 sm:p-7 lg:col-start-2 lg:row-start-1">
          <h2 className="text-xl font-semibold">Conta</h2>
          <form action={logout}>
            <Button variant="outline">Sair</Button>
          </form>
        </section>
      </div>
    </>
  );
}
