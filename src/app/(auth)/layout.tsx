import type { ReactNode } from "react";
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center px-5 py-10">
      <section className="grid gap-6 rounded-xl border border-border border-t-4 border-t-mustard bg-card p-6 shadow-sm sm:p-8">
        {children}
      </section>
    </main>
  );
}
