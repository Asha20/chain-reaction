import m from "mithril";
import { PlayRandomly, Runner, sleep } from "../game/ts/lib";
import { GameCanvas } from "./GameCanvas";
import { Config } from "./Config";

const colors = ["red", "blue"];

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

export function App(): m.Component {
	let width = 3;
	let height = 3;
	let runs = 10;

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

	function setWidth(value: number) {
		width = value;
		return updateGame();
	}

	function setHeight(value: number) {
		height = value;
		return updateGame();
	}

	function setRuns(value: number) {
		runs = value;
		return updateGame();
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
				m(GameCanvas, {
					game: runner.game,
					options: { colors, width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
				}),

				m(Config, {
					width,
					height,
					runs,
					cancel,
					setWidth,
					setHeight,
					setRuns,
				}),
			]);
		},
	};
}
