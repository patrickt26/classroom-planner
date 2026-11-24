import type { Metadata } from "next";
import { Arimo } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const arimo = Arimo({ subsets: ["latin"], variable: "--font-arimo" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planejamento de aulas",
  description: "Organização do dia a dia de professoras particulares.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={arimo.variable}>
      <body>{children}</body>
    </html>
  );
}
