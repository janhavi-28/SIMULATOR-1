import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals.js";

const spread = (x) => (Array.isArray(x) ? x : [x]);

// Use only core-web-vitals; typescript.js can trigger "Plugin '' not found" in some setups
const eslintConfig = defineConfig([
  ...spread(nextVitals),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
