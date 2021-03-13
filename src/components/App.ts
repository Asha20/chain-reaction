import m from "mithril";
import { PlayRandomly, restrict, Runner, sleep } from "../game/ts/lib";
import { GameCanvas } from "./GameCanvas";

const colors = ["red", "blue"];

const MIN_SIZE = 2;
const MAX_SIZE = 10;

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

export function App(): m.Component {
	let width = 3;
	let height = 3;
	const runs = 10;

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
		runner.cancel();
		const tally = await tallyPromise;
		console.log("Tally:", tally);

		runner = getRunner();
		tallyPromise = runner.run(runs);
		m.redraw();
	}

	async function setWidth(e: InputEvent) {
		const value = Number((e.target as HTMLInputElement).value);
		const newWidth = restrict(value, MIN_SIZE, MAX_SIZE);

		if (newWidth !== width) {
			width = newWidth;
			await updateGame();
		}
	}

	async function setHeight(e: InputEvent) {
		const value = Number((e.target as HTMLInputElement).value);
		const newHeight = restrict(value, MIN_SIZE, MAX_SIZE);

		if (newHeight !== width) {
			height = newHeight;
			await updateGame();
		}
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
				[
					m(GameCanvas, {
						game: runner.game,
						options: { colors, width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
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
