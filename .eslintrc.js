/* eslint-env node */
module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "./tsconfig.json",
	},
	plugins: ["@typescript-eslint"],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier",
	],
	rules: {
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": "warn",
		"@typescript-eslint/no-floating-promises": "error",
	},
	env: {
		browser: true,
	},
};
