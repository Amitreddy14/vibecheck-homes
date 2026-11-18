import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Next.js recommended rules (React, hooks, accessibility, Core Web Vitals, TypeScript)
 * plus project rules from rules.md §3.
 */
const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "coverage/**"],
  },
  {
    rules: {
      "no-console": "error", // use the logger (rules.md §3)
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description" },
      ],
      "react/no-danger": "error", // never inject raw HTML from user content (rules.md §4)
      eqeqeq: ["error", "always"],
    },
  },
];

export default config;
