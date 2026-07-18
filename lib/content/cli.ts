import { validateContent, type ValidationResult } from "./validate.ts";

export function formatCliOutput(result: ValidationResult): string[] {
  return result.errors.map((error) =>
    error.field
      ? `${error.file}: ${error.field}: ${error.message}`
      : `${error.file}: ${error.message}`,
  );
}

function main(): void {
  const result = validateContent();
  for (const line of formatCliOutput(result)) {
    console.error(line);
  }
  process.exit(result.valid ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
