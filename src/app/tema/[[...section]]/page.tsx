import { CalendarDays, LayoutList } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const sections = ["alunos", "agenda", "mais"];

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { section: [] },
    ...sections.map((section) => ({ section: [section] })),
  ];
}

function FieldsAndBadges() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campos e etiquetas</CardTitle>
        <CardDescription>
          Exemplos de entrada de texto e de status.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="example-subject" className="font-semibold">
            Disciplina
          </label>
          <Input id="example-subject" placeholder="Ex.: Matemática" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Planejada</Badge>
          <Badge>Realizada</Badge>
          <Badge variant="outline">Reposição</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function DialogExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Janela de diálogo</CardTitle>
        <CardDescription>
          Use quando a pessoa precisar ler uma mensagem antes de continuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <CalendarDays aria-hidden="true" data-icon="inline-start" />
              Abrir diálogo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exemplo de diálogo</DialogTitle>
              <DialogDescription>
                Você pode fechar a janela com o botão abaixo ou pela tecla Esc.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function SheetExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Painel lateral</CardTitle>
        <CardDescription>
          Use para mostrar detalhes mantendo a tela de origem em contexto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              <LayoutList aria-hidden="true" data-icon="inline-start" />
              Abrir painel
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Exemplo de painel</SheetTitle>
              <SheetDescription>
                Este painel abre sobre o conteúdo da página.
              </SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">Fechar painel</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}

export default async function ThemePage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section = [] } = await params;
  const [current] = section;

  if (section.length > 1 || (current && !sections.includes(current))) {
    notFound();
  }

  return (
    <>
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-bold text-brown md:text-4xl">
          Tema e componentes
        </h1>
        <p className="max-w-prose text-secondary-text">
          Exemplos da identidade visual e da navegação da professora.
        </p>
      </header>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        {(!current || current === "alunos") && <FieldsAndBadges />}
        {(!current || current === "agenda") && <DialogExample />}
        {(!current || current === "mais") && <SheetExample />}
      </div>
    </>
  );
}
