/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const ppath = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { DefinePlugin } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

const PROJECT_ROOT = ppath.resolve(__dirname);

function path(...parts) {
	return ppath.resolve(PROJECT_ROOT, ...parts);
}

module.exports = function (env, argv) {
	const production = argv.mode === "production";

	return {
		context: PROJECT_ROOT,
		mode: production ? "production" : "development",
		entry: "./src/main.ts",
		devtool: production ? "source-map" : "inline-source-map",
		output: {
			path: path("dist"),
			filename: production ? "[name].[contenthash].js" : "[name].js",
			chunkFilename: "[name].[chunkhash].js",
		},

		resolve: {
			extensions: [".js", ".ts"],
			alias: {
				"@game": path("src/game/ts"),
				"@ui": path("src/ui"),
				"@public": path("public"),
				"@common": path("src/common"),
			},
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
				{
					test: /\.s[ac]ss$/,
					use: [
						MiniCssExtractPlugin.loader,
						"css-loader",
						production && "postcss-loader",
						"sass-loader",
					].filter(Boolean),
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
				crateDirectory: path("src/game/rust"),
			}),
			new MiniCssExtractPlugin(),

			production && new CleanWebpackPlugin(),
		].filter(Boolean),

		stats: production ? "normal" : "minimal",

		devServer: {
			stats: "errors-only",
		},
	};
};
