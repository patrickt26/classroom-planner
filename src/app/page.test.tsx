import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import HomePage from "./page";

test("the home page renders its heading inside the main landmark", () => {
  const html = renderToStaticMarkup(<HomePage />);

  expect(html).toMatch(/<main[^>]*><h1[^>]*>Planejamento de aulas<\/h1>/);
});
