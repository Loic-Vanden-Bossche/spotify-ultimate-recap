import eslintAstro from "eslint-plugin-astro";
import eslint from "@eslint/js";
// eslint-disable-next-line import/no-unresolved
import tseslint from "typescript-eslint";
import eslintImport from "eslint-plugin-import";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  // eslint-disable-next-line import/no-named-as-default-member
  eslintAstro.configs.recommended,
  eslintImport.flatConfigs.recommended,
  {
    ignores: ["*.config.js", "dist/**/*", ".astro/**/*"],
    rules: {
      // ..other rules
      "import/order": [
        1,
        {
          groups: [
            "external",
            "builtin",
            "internal",
            "sibling",
            "parent",
            "index",
          ],
        },
      ],
      "import/no-unresolved": [
        0,
        {
          ignore: ["^astro", "@astrojs"],
        },
      ],
      "import/no-named-as-default-member": 0,
      "import/no-named-as-default": 0,
      "import/default": 0,
      "import/namespace": 0,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn", // or "error"
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
);
