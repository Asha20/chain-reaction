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

	const runner = new Runner({
		width,
		height,
		players,
	});

	mount(runner.game, canvas, { colors, tileSize });
	runner.game.addHook("update", () => sleep(100));

	console.time("run");
	const tally = await runner.run(1000);
	console.timeEnd("run");
	console.log("Tally:", tally);
}

main();
