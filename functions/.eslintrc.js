module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "indent": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
    {
      files: ["lib/config.js", "./lib/config.js", "**/lib/config.js"],
      rules: {
        "valid-jsdoc": "off",
        "require-jsdoc": "off",
        "indent": "off",
        "max-len": ["error", {"code": 100, "ignoreUrls": true}],
      },
    },
    {
      files: ["index.js", "./index.js", "**/functions/index.js"],
      rules: {
        "indent": "off",
      },
    },
  ],
  globals: {},
};
