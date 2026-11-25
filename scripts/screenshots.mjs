import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = "http://localhost:3000";
const widths = [375, 768, 1280];
const height = 900;
const usage =
  "Uso: pnpm screenshots lancamento ou pnpm screenshots <N> [--public] <nome>=<rota> ...";
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

async function login(page, firstAccess = false) {
  const loginUrl = `${baseUrl}/entrar`;
  await page.goto(loginUrl);
  // Contas fictícias de supabase/seed.sql.
  const email = firstAccess
    ? "primeiro.acesso@example.test"
    : "professora.exemplo@example.test";
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("senha-de-teste");
  await Promise.all([
    page.waitForURL(
      new URL(firstAccess ? "/aceitar-termos" : "/", baseUrl).href,
    ),
    page.getByRole("button", { name: "Entrar", exact: true }).click(),
  ]).catch((cause) => {
    throw new Error(
      "O login falhou. Confira se o Supabase local está populado pelo seed.",
      { cause },
    );
  });
}

async function capture(
  page,
  targets,
  folder,
  { release = false, publicPages = false } = {},
) {
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
        (release || publicPages
          ? destination.href !== url.href
          : destination.pathname === "/entrar")
      ) {
        throw new Error(
          `Não foi possível abrir ${url.pathname} para capturar ${name} em ${width}px.`,
        );
      }

      if (url.pathname === "/aceitar-termos") {
        await page
          .getByRole("heading", { name: "Aceitar termos", exact: true })
          .waitFor();
      }
      if (release || publicPages) {
        await page
          .getByRole("heading", {
            level: 1,
            name: name === "hoje" ? "Hoje" : undefined,
            exact: true,
          })
          .waitFor();
        // biome-ignore lint/performance/useDomNodeTextContent: Os separadores do texto renderizado evitam colar e-mails ao texto vizinho.
        const text = await page.locator("body").innerText();
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
        fullPage: release || publicPages,
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
  const publicPages = !release && routes[0] === "--public";
  if (publicPages) routes.shift();
  if (
    release
      ? routes.length > 0
      : !issue || !/^[1-9]\d*$/.test(issue) || routes.length === 0
  ) {
    throw new Error(usage);
  }

  let targets = parseTargets(routes);
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
      serviceWorkers: release || publicPages ? "block" : "allow",
    });
    if (release || publicPages) {
      await page.route("**/*", (route) =>
        new URL(route.request().url()).origin === baseUrl
          ? route.continue()
          : route.abort(),
      );
    }

    if (!release) {
      const firstAccess = targets.filter(
        ({ url }) => url.pathname === "/aceitar-termos",
      );
      if (!publicPages && firstAccess.length > 0) {
        await login(page, true);
        await capture(page, firstAccess, `issue-${issue}`);
        targets = targets.filter((target) => !firstAccess.includes(target));
        if (targets.length === 0) return;
        await page.context().clearCookies();
      }
      if (!publicPages) await login(page);
      await capture(page, targets, `issue-${issue}`, { publicPages });
      return;
    }

    await capture(
      page,
      parseTargets(["inicio=/", "login=/entrar", "privacidade=/privacidade"]),
      issue,
      { release: true },
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
      { release: true },
    );
  } finally {
    await browser.close();
  }
}

captureScreenshots(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
