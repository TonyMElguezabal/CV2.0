import { renderToStaticMarkup } from "react-dom/server";
import { StructuredData } from "./StructuredData";

vi.mock("../lib/content/read.ts", () => ({
  getProfile: () => ({
    name: "Fixture Person",
    positioning: "Fixture Positioning",
    summary: "Fixture summary.",
    links: { linkedin: "https://www.linkedin.com/in/fixture" },
    contact: { email: "fixture@example.com", scheduling: "https://cal.com/fixture" },
  }),
}));

vi.mock("../lib/seo/siteUrl.ts", () => ({
  resolveSiteUrl: () => "https://fixture.example.com",
}));

describe("StructuredData — server-rendered JSON-LD", () => {
  it("renders a valid application/ld+json script with Person mainEntity", () => {
    const html = renderToStaticMarkup(<StructuredData />);

    expect(html).toContain('type="application/ld+json"');

    const scriptMatch = html.match(
      /<script type="application\/ld\+json">(.*?)<\/script>/
    );
    expect(scriptMatch).not.toBeNull();

    const graph = JSON.parse(scriptMatch![1]!);
    expect(graph["@type"]).toBe("ProfilePage");
    expect(graph.mainEntity["@type"]).toBe("Person");
    expect(graph.mainEntity.name).toBe("Fixture Person");
  });
});
