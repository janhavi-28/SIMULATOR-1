import { dirname } from "path";
import { fileURLToPath } from "url";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const eslintConfig = [
  // 1. Next.js Core Web Vitals (Flat Config ready)
  nextPlugin.configs['core-web-vitals'],

  // 2. React (using plugin's flat config if available, or manual setup)
  // eslint-plugin-react v7.35+ exports flat configs
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],

  // 3. React Hooks
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },

  // 4. Ignores
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"]
  }
];

export default eslintConfig;
