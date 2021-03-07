/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { DefinePlugin } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

const PROJECT_ROOT = path.resolve(__dirname);

module.exports = function (env, argv) {
	const production = argv.mode === "production";

	return {
		context: PROJECT_ROOT,
		mode: production ? "production" : "development",
		entry: "./src/main.ts",
		devtool: production ? "source-map" : "inline-source-map",
		output: {
			path: path.resolve(PROJECT_ROOT, "dist"),
			filename: production ? "[name].[contenthash].js" : "[name].js",
			chunkFilename: "[name].[chunkhash].js",
		},

		resolve: {
			extensions: [".js", ".ts"],
		},

		module: {
			rules: [
				{
					test: /\.ts$/,
					loader: "babel-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.wasm$/,
					type: "webassembly/sync",
				},
			],
		},

		experiments: {
			syncWebAssembly: true,
		},

		plugins: [
			new DefinePlugin({
				PRODUCTION: JSON.stringify(production),
			}),
			new HtmlWebpackPlugin({
				title: "Chain Reaction",
				template: "public/index.html",
				chunks: "all",
			}),
			new ForkTsCheckerWebpackPlugin({
				typescript: {
					diagnosticOptions: {
						semantic: true,
						syntactic: true,
					},
				},
			}),
			new WasmPackPlugin({
				crateDirectory: path.resolve(PROJECT_ROOT, "src/game/rust"),
			}),

			production && new CleanWebpackPlugin(),
		].filter(Boolean),

		stats: production ? "normal" : "minimal",

		devServer: {
			stats: "errors-only",
		},
	};
};
