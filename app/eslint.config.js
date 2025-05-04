import eslintAstro from "eslint-plugin-astro";
import eslint from "@eslint/js";
// eslint-disable-next-line import/no-unresolved
import tseslint from "typescript-eslint";
import eslintImport from "eslint-plugin-import";

export default [
  {
    ignores: [
      "*.config.js",
      "dist/**/*",
      ".astro/**/*",
      "node_modules/**/*",
      "src/generated/client/*",
    ],
  },
  ...tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    eslintAstro.configs.recommended,
    eslintImport.flatConfigs.recommended,
    {
      settings: {
        "import/ignore": ["node_modules"],
      },
      rules: {
        "import/order": [
          "warn",
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
        "import/no-named-as-default-member": "off",
        "import/no-named-as-default": "off",
        "import/default": "off",
        "import/namespace": "off",
        "import/no-extraneous-dependencies": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
      },
    },
  ),
];
