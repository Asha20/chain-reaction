import m from "mithril";
import { PlayRandomly, Runner, sleep } from "../game/ts/lib";
import { GameCanvas } from "./GameCanvas";

const colors = ["red", "blue"];
const tileSize = 100;

export function App(): m.Component {
	let width = 3;
	let height = 3;
	const runs = 10;

	let canvasKey = 1;
	let runner = getRunner();

	let tallyPromise: Promise<number[]> = Promise.resolve([]);

	function getRunner() {
		const runner = new Runner({
			width,
			height,
			players: [PlayRandomly, PlayRandomly],
		});

		runner.game.addHook("update", () => sleep(200));
		return runner;
	}

	async function updateGame() {
		console.log("updateGame()");
		runner.cancel();
		const tally = await tallyPromise;
		console.log("Tally:", tally);

		runner = getRunner();
		tallyPromise = runner.run(runs);
		canvasKey = +!canvasKey;
		m.redraw();
	}

	async function setWidth(e: InputEvent) {
		width = Number((e.target as HTMLInputElement).value);
		await updateGame();
	}

	async function setHeight(e: InputEvent) {
		height = Number((e.target as HTMLInputElement).value);
		await updateGame();
	}

	function cancel() {
		runner.cancel();
	}

	return {
		oncreate() {
			tallyPromise = runner.run(runs);
		},

		view() {
			return m("div", [
				m("p", "My app"),
				[
					m(GameCanvas, {
						key: canvasKey,
						game: runner.game,
						options: { colors, tileSize },
					}),
				],

				m("button", { onclick: cancel }, "Cancel"),

				m(
					"label",
					"Width",
					m("input[type=number]", { value: width, oninput: setWidth }),
				),
				m(
					"label",
					"Height",
					m("input[type=number]", { value: height, oninput: setHeight }),
				),
			]);
		},
	};
}
