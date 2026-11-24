import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = "http://localhost:3000";
const widths = [375, 768, 1280];
const height = 900;
const usage =
  "Uso: pnpm screenshots lancamento ou pnpm screenshots <N> <nome>=<rota> ...";
const hideDevOverlay = "nextjs-portal { display: none !important; }";
// Position fixed navigation against the full page so it cannot cover content.
const releaseStyle = `
  ${hideDevOverlay}
  @media (max-width: 767px) {
    body { position: relative; }
    nav[aria-label="Navegação principal"] { position: absolute; }
  }
  @media (min-width: 768px) {
    div:has(> nav[aria-label="Navegação principal"]) {
      position: static;
      height: auto;
    }
  }
`;

function parseTargets(routes) {
  const targets = routes.map((entry) => {
    const match = /^([a-z0-9][a-z0-9_-]*)=(\/[^\s]*)$/.exec(entry);
    if (!match) {
      throw new Error(
        `Use um nome simples e uma rota local, como hoje=/. Entrada: ${entry}`,
      );
    }

    const [, name, route] = match;
    const url = new URL(route, baseUrl);
    if (route.startsWith("//") || url.origin !== baseUrl) {
      throw new Error(`Use uma rota local para ${name}.`);
    }
    return { name, url };
  });

  if (new Set(targets.map(({ name }) => name)).size !== targets.length) {
    throw new Error("Use um nome diferente para cada rota.");
  }
  return targets;
}

async function login(page) {
  const loginUrl = `${baseUrl}/entrar`;
  await page.goto(loginUrl);
  // Conta fictícia de supabase/seed.sql.
  await page
    .getByLabel("E-mail", { exact: true })
    .fill("professora.exemplo@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("senha-de-teste");
  await Promise.all([
    page.waitForURL(`${baseUrl}/`),
    page.getByRole("button", { name: "Entrar", exact: true }).click(),
  ]).catch((cause) => {
    throw new Error(
      "O login falhou. Confira se o Supabase local está populado pelo seed.",
      { cause },
    );
  });
}

async function capture(page, targets, folder, release) {
  const directory = fileURLToPath(
    new URL(`../docs/screenshots/${folder}/`, import.meta.url),
  );
  await mkdir(directory, { recursive: true });
  for (const { name, url } of targets) {
    for (const width of release ? [375, 1280] : widths) {
      await page.setViewportSize({ width, height });
      const response = await page.goto(url.href);
      const destination = new URL(page.url());
      if (
        !response?.ok() ||
        destination.origin !== baseUrl ||
        (release
          ? destination.href !== url.href
          : destination.pathname === "/entrar")
      ) {
        throw new Error(
          `Não foi possível abrir ${url.pathname} para capturar ${name} em ${width}px.`,
        );
      }

      if (release) {
        await page
          .getByRole("heading", {
            level: 1,
            name: name === "hoje" ? "Hoje" : undefined,
            exact: true,
          })
          .waitFor();
        const text = await page.locator("body").textContent();
        const contacts = await page
          .locator('a[href^="mailto:"]')
          .evaluateAll((links) => links.map((link) => link.href));
        const emails =
          [text, ...contacts]
            .join(" ")
            .match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi) ?? [];
        if (emails.some((email) => !email.toLowerCase().endsWith(".test"))) {
          throw new Error(
            `A tela ${name} contém um endereço fora do domínio de teste.`,
          );
        }
      }

      const filename = `${name}-${width}.png`;
      await page.screenshot({
        path: join(directory, filename),
        fullPage: release,
        animations: "disabled",
        caret: release ? "hide" : "initial",
        style: release ? releaseStyle : hideDevOverlay,
      });
      console.log(`docs/screenshots/${folder}/${filename}`);
    }
  }
}

async function captureScreenshots([issue, ...routes]) {
  const release = issue === "lancamento";
  if (
    release
      ? routes.length > 0
      : !issue || !/^[1-9]\d*$/.test(issue) || routes.length === 0
  ) {
    throw new Error(usage);
  }

  const targets = parseTargets(routes);
  const loginUrl = `${baseUrl}/entrar`;
  await fetch(loginUrl, {
    method: "HEAD",
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  }).catch((cause) => {
    throw new Error("Inicie `pnpm dev` e rode de novo", { cause });
  });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: widths[0], height },
      serviceWorkers: release ? "block" : "allow",
    });
    if (!release) {
      await login(page);
      await capture(page, targets, `issue-${issue}`, false);
      return;
    }

    await page.route("**/*", (route) =>
      new URL(route.request().url()).origin === baseUrl
        ? route.continue()
        : route.abort(),
    );
    await capture(
      page,
      parseTargets(["inicio=/", "login=/entrar", "privacidade=/privacidade"]),
      issue,
      true,
    );

    await login(page);
    await page.goto(`${baseUrl}/configuracoes`);
    const workspace = await page
      .getByLabel("Nome do espaço", { exact: true })
      .inputValue();
    if (workspace !== "Espaço de exemplo") {
      throw new Error("Use o espaço fictício criado pelo seed local.");
    }
    await page.goto(`${baseUrl}/alunos`);
    const studentPath = await page
      .getByRole("link", { name: "Aluno A", exact: true })
      .getAttribute("href");
    await capture(
      page,
      parseTargets([
        "hoje=/",
        "alunos=/alunos",
        `ficha-aluno=${studentPath}`,
        "agenda=/agenda",
        "cobrancas=/cobrancas",
        "configuracoes=/configuracoes",
      ]),
      issue,
      true,
    );
  } finally {
    await browser.close();
  }
}

captureScreenshots(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
