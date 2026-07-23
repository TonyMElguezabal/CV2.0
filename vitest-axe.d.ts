// vitest-axe ships its type augmentation for the old `Vi.Assertion` global
// namespace (matching its vitest ^0.17.0 devDependency), which the
// installed Vitest 4 no longer uses — see @testing-library/jest-dom's
// working `declare module "vitest"` pattern, mirrored here.
import "vitest";
import type { AxeMatchers } from "vitest-axe/matchers";

declare module "vitest" {
  interface Assertion<T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
