/* eslint-disable @typescript-eslint/no-unused-vars */

import { Runner, mount, sleep } from "./lib";
import { PlayRandomly } from "./players";

async function main() {
	const canvas = document.createElement("canvas");
	document.body.appendChild(canvas);

	const width = 4;
	const height = 4;
	const tileSize = 100;
	const players = [PlayRandomly, PlayRandomly];
	const colors = ["red", "blue"];
	const times = 1000;

	const runner = new Runner({
		width,
		height,
		players,
	});

	// mount(runner.game, canvas, { colors, tileSize });
	// runner.game.addHook("update", () => sleep(100));

	console.time("js-run");
	const tally = await runner.run(times);
	console.timeEnd("js-run");
	console.log("Tally:", tally);

	import("./rust/pkg/index").then(mod => {
		console.time("wasm-run");
		const result = mod.run(width, height, players.length, times);
		console.timeEnd("wasm-run");
		console.log("Tally:", result);
	});
}

main();
