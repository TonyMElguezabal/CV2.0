import { renderToStaticMarkup } from "react-dom/server";
import { StatCard } from "./StatCard";

describe("StatCard — server-rendered output", () => {
  it("renders the value and label", () => {
    const html = renderToStaticMarkup(
      <StatCard label="Page views" value="1,234" />,
    );

    expect(html).toMatch(/1,234/);
    expect(html).toMatch(/Page views/);
  });
});
