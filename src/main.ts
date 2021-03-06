import { Runner, mount, sleep } from "./lib";
import { PlayUserInput, PlayRandomly } from "./players";

async function main() {
	const canvas = document.createElement("canvas");
	document.body.appendChild(canvas);

	const width = 3;
	const height = 3;
	const tileSize = 100;
	const players = [PlayUserInput({ canvas, tileSize }), PlayRandomly];
	const colors = ["red", "blue"];

	const runner = new Runner({
		width,
		height,
		players,
	});

	mount(runner.game, canvas, { colors, tileSize });
	runner.game.addHook("update", () => sleep(500));

	const winner = await runner.run();
	console.log(`The winner is ${winner}.`);
}

main();
