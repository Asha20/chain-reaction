/* eslint-env node */
module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier",
	],
	rules: {
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": "warn",
	},
	env: {
		browser: true,
	},
};
