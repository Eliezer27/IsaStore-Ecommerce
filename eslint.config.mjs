import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // JS/CSS de terceros copiados tal cual del template (IsaWebPlantilla) a
    // public/assets — no es código nuestro, no tiene sentido lintearlo.
    "public/assets/**",
  ]),
]);

export default eslintConfig;
