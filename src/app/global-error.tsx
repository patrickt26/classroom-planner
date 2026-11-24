"use client";

import { ErrorMessage } from "./error-message";
import "./globals.css";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="pt-BR" className="font-[Arial,sans-serif]">
      <head>
        <title>Erro | Planejamento de aulas</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body>
        <main className="grid min-h-dvh place-items-center px-5 py-8">
          <ErrorMessage retry={retry} />
        </main>
      </body>
    </html>
  );
}
