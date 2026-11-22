import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = "http://127.0.0.1:3000";
const widths = [375, 768, 1280];
const height = 900;

async function captureScreenshots([issue, ...routes]) {
  if (!issue || !/^[1-9]\d*$/.test(issue) || routes.length === 0) {
    throw new Error("Uso: pnpm screenshots <N> <nome>=<rota> ...");
  }

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

  const directory = fileURLToPath(
    new URL(`../docs/screenshots/issue-${issue}/`, import.meta.url),
  );
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: widths[0], height },
    });
    await page.goto(`${baseUrl}/entrar`);
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

    await mkdir(directory, { recursive: true });
    for (const { name, url } of targets) {
      for (const width of widths) {
        await page.setViewportSize({ width, height });
        const response = await page.goto(url.href);
        const destination = new URL(page.url());
        if (
          !response?.ok() ||
          destination.origin !== baseUrl ||
          destination.pathname === "/entrar"
        ) {
          throw new Error(
            `Não foi possível abrir ${url.pathname} para capturar ${name} em ${width}px.`,
          );
        }

        const filename = `${name}-${width}.png`;
        await page.screenshot({
          path: join(directory, filename),
          animations: "disabled",
          caret: "initial",
          style: "nextjs-portal { display: none !important; }",
        });
        console.log(`docs/screenshots/issue-${issue}/${filename}`);
      }
    }
  } finally {
    await browser.close();
  }
}

captureScreenshots(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
