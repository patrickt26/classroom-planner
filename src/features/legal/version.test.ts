import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { legalVersion } from "./version";

test("o banco e o app exigem a mesma versão dos termos", () => {
  const migrations = new URL("../../../supabase/migrations/", import.meta.url);
  const definition = readdirSync(migrations)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .reverse()
    .map((name) => readFileSync(new URL(name, migrations), "utf8"))
    .find((sql) =>
      /create\s+(?:or\s+replace\s+)?function\s+public\.current_terms_version\s*\(/i.test(
        sql,
      ),
    );

  expect(
    definition?.match(
      /function\s+public\.current_terms_version\s*\(\s*\)[\s\S]*?\breturn\s+'([^']+)'::text\s*;/i,
    )?.[1],
  ).toBe(legalVersion);
});
