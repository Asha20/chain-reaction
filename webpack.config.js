/* eslint-env node */
const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { DefinePlugin } = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = function (env, argv) {
	const production = argv.mode === "production";

	return {
		context: path.resolve(__dirname),
		mode: production ? "production" : "development",
		entry: "./src/main.ts",
		devtool: production ? "source-map" : "inline-source-map",
		output: {
			path: path.resolve(__dirname, "dist"),
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
			],
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

			production && new CleanWebpackPlugin(),
		].filter(Boolean),

		stats: production ? "normal" : "minimal",

		devServer: {
			stats: "errors-only",
		},
	};
};
