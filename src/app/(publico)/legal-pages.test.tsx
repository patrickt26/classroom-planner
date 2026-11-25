import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";
import { LandingPage } from "../../features/landing/components/landing-page";
import { LegalLinks } from "../../features/legal/components/legal-links";
import { legalVersion } from "../../features/legal/version";
import PublicLayout from "./layout";
import PrivacyPage from "./privacidade/page";
import TermsPage from "./termos/page";

vi.mock("@/components/ui/button", () => import("../../components/ui/button"));
vi.mock(
  "@/features/legal/components/legal-links",
  () => import("../../features/legal/components/legal-links"),
);
vi.mock("@/lib/platform", () => import("../../lib/platform"));
vi.mock("@/lib/utils", () => import("../../lib/utils"));

afterEach(() => vi.unstubAllEnvs());

test.each([
  ["página inicial", () => <LandingPage />],
  [
    "política de privacidade",
    () => (
      <PublicLayout>
        <PrivacyPage />
      </PublicLayout>
    ),
  ],
  [
    "termos de uso",
    () => (
      <PublicLayout>
        <TermsPage />
      </PublicLayout>
    ),
  ],
])("exibe os links legais e o contato no rodapé da %s", (_, renderPage) => {
  vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", " privacidade@example.test ");

  const footer = renderToStaticMarkup(renderPage()).match(
    /<footer\b[^>]*>(.*?)<\/footer>/,
  )?.[1];
  expect(footer).toMatch(/href="\/termos"[^>]*>Termos de uso<\/a>/);
  expect(footer).toMatch(
    /href="\/privacidade"[^>]*>Política de privacidade<\/a>/,
  );
  expect(footer).toMatch(
    /href="mailto:privacidade@example.test"[^>]*>Contato de privacidade<\/a>/,
  );
  expect(footer).not.toContain("Ao entrar, você concorda");
});

test("exibe o aviso de concordância somente quando solicitado pelo login", () => {
  expect(renderToStaticMarkup(<LegalLinks showLoginAgreement />)).toContain(
    "Ao entrar, você concorda",
  );
  expect(renderToStaticMarkup(<LegalLinks />)).not.toContain(
    "Ao entrar, você concorda",
  );
});

test("exibe o nome e o e-mail configurados para o encarregado", () => {
  vi.stubEnv("NEXT_PUBLIC_PRIVACY_OFFICER_NAME", " Encarregada Exemplo ");
  vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "privacidade@example.test");

  const markup = renderToStaticMarkup(<PrivacyPage />);
  expect(markup).toContain("<p>Nome do encarregado: Encarregada Exemplo</p>");
  expect(markup).toContain('href="mailto:privacidade@example.test"');
});

test.each(["", "   ", undefined])(
  "oculta a linha do nome do encarregado quando a configuração é %j",
  (name) => {
    vi.stubEnv("NEXT_PUBLIC_PRIVACY_OFFICER_NAME", name);

    const markup = renderToStaticMarkup(<PrivacyPage />);
    expect(markup).toContain("Encarregado pelo tratamento de dados");
    expect(markup).not.toContain("Nome do encarregado");
  },
);

test("usa a mesma versão nos dois documentos legais", () => {
  for (const Page of [PrivacyPage, TermsPage]) {
    expect(renderToStaticMarkup(<Page />)).toContain(
      `<time dateTime="${legalVersion}">`,
    );
  }
});
