import m from "mithril";
import { PlayRandomly, Runner, sleep } from "../game/ts/lib";
import { GameCanvas } from "./GameCanvas";
import { Config } from "./Config";

const colors = ["red", "blue"];

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

			// Redraw so that mounting inside GameCanvas can use
			// canvas.getBoundingClientRect() and get proper values from it.
			m.redraw();
		},

		view() {
			return [
				m(GameCanvas, {
					game: runner.game,
					options: { colors },
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
			];
		},
	};
}
