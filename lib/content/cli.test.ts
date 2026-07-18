import { formatCliOutput } from "./cli";

describe("formatCliOutput", () => {
  it("renders an error with a field as 'file: field: message'", () => {
    const lines = formatCliOutput({
      valid: false,
      errors: [{ file: "experience/acme.yaml", field: "role", message: "Required" }],
    });

    expect(lines).toEqual(["experience/acme.yaml: role: Required"]);
  });

  it("renders an error without a field as 'file: message'", () => {
    const lines = formatCliOutput({
      valid: false,
      errors: [{ file: "profile.yaml", message: "file is missing" }],
    });

    expect(lines).toEqual(["profile.yaml: file is missing"]);
  });

  it("renders no lines for a valid result", () => {
    const lines = formatCliOutput({ valid: true, errors: [] });

    expect(lines).toEqual([]);
  });
});
