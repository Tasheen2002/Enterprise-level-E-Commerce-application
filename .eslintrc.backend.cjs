module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: { node: true, es2022: true },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
    "no-constant-condition": ["error", { checkLoops: false }],
    "no-undef": "off",
    "no-empty": ["error", { allowEmptyCatch: true }],
  },
  ignorePatterns: ["**/node_modules/**", "**/dist/**", "**/generated/**"],
  // Existing enums expose conversion helpers through declaration merging.
  overrides: [
    {
      files: ["modules/**/domain/value-objects/*.ts"],
      rules: { "@typescript-eslint/no-namespace": "off" },
    },
  ],
};
