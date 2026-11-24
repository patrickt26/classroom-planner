import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PageMessage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="mx-auto w-full max-w-md py-6 text-center sm:py-8">
      <CardHeader className="gap-2 px-6">
        <h1 className="text-2xl font-bold text-brown sm:text-3xl">{title}</h1>
        <p className="text-base text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
