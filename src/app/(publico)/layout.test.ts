import { resolveAlternates } from "next/dist/lib/metadata/resolvers/resolve-basics";
import { expect, test } from "vitest";
import { metadata } from "./layout";
import { metadata as privacyMetadata } from "./privacidade/page";
import { metadata as termsMetadata } from "./termos/page";

test.each([
  ["/privacidade", privacyMetadata],
  ["/termos", termsMetadata],
])("allows indexing and sets a self-canonical for %s", async (path, page) => {
  const { robots, alternates } = { ...metadata, ...page };
  const baseUrl = new URL("https://example.com");
  const resolved = await resolveAlternates(
    alternates,
    baseUrl,
    Promise.resolve(path),
    { trailingSlash: false, isStaticMetadataRouteFile: false },
  );

  expect(robots).toEqual({ index: true, follow: true });
  expect(resolved?.canonical?.url).toBe(`https://example.com${path}`);
});
