import { renderToStaticMarkup } from "react-dom/server";
import { TrendBarList } from "./TrendBarList";

describe("TrendBarList — server-rendered output", () => {
  it("renders one row per entry with its label and value", () => {
    const html = renderToStaticMarkup(
      <TrendBarList
        rows={[
          { label: "2026-07-20", value: 10 },
          { label: "2026-07-21", value: 5 },
        ]}
      />,
    );

    expect(html).toMatch(/2026-07-20/);
    expect(html).toMatch(/2026-07-21/);
    expect(html).toMatch(/>10</);
    expect(html).toMatch(/>5</);
  });

  it("renders nothing but a valid empty container when there are no rows", () => {
    const html = renderToStaticMarkup(<TrendBarList rows={[]} />);

    expect(html).not.toMatch(/undefined/);
  });
});
