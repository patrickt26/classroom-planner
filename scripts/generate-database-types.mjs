import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { renameSync, rmSync, writeFileSync } from "node:fs";

const destination = new URL("../src/types/database.ts", import.meta.url);
const temporaryFile = new URL(`database.${randomUUID()}.tmp`, destination);
const types = execSync("supabase gen types --lang typescript --schema public", {
  stdio: ["ignore", "pipe", "inherit"],
});
const formattedTypes = execSync("biome format --stdin-file-path=database.ts", {
  input: types,
  stdio: ["pipe", "pipe", "inherit"],
});

try {
  writeFileSync(temporaryFile, formattedTypes);
  renameSync(temporaryFile, destination);
} finally {
  rmSync(temporaryFile, { force: true });
}
