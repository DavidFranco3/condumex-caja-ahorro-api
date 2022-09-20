const RULES = {
  OFF: "off",
  WARN: "warn",
  ERROR: "error",
};

module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
  },
  extends: ["standard", "prettier"],
  parserOptions: {
    ecmaVersion: 12,
  },
  plugins: ["prettier", "standard"],
  rules: {
    "no-console": RULES.OFF,
  },
};
