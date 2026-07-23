import { renderToStaticMarkup } from "react-dom/server";
import { EmptyState } from "./EmptyState";

describe("EmptyState — server-rendered output", () => {
  it("renders a no-data-yet message", () => {
    const html = renderToStaticMarkup(<EmptyState />);

    expect(html).toMatch(/no data yet/i);
  });
});
