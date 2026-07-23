import { renderToStaticMarkup } from "react-dom/server";
import { AdminDashboardShell } from "./AdminDashboardShell";

describe("AdminDashboardShell — server-rendered output", () => {
  it("renders an Insights heading and a coming-soon placeholder", () => {
    const html = renderToStaticMarkup(<AdminDashboardShell />);

    expect(html).toMatch(/Insights/);
    expect(html).toMatch(/coming soon/i);
  });
});
