import { Runner, mount, sleep, PlayPos } from "./lib";

async function main() {
	const runner = new Runner({
		width: 3,
		height: 3,
		players: [PlayPos({ x: 0, y: 0 }), PlayPos({ x: 2, y: 2 })],
	});

	const canvas = document.createElement("canvas");
	document.body.appendChild(canvas);
	mount(runner.game, canvas, { colors: ["red", "blue"] });

	runner.game.addHook("update", () => sleep(500));

	const winner = await runner.run();

	console.log(`The winner is ${winner}.`);
}

main();
