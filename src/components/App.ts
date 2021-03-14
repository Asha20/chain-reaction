import m from "mithril";
import {
	assert,
	PlayerRenderOptions,
	PlayRandomly,
	Runner,
	waitForEvent,
} from "../game/ts/lib";
import { GameCanvas } from "./GameCanvas";
import { Config } from "./Config";

const players: PlayerRenderOptions[] = [
	{
		cellColor: "red",
		textColor: "white",
		shape: "circle",
	},
	{
		cellColor: "blue",
		textColor: "white",
		shape: "star",
	},
];

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

		runner.game.addHook("update", () => {
			const advanceButton = document.getElementById("advance");
			assert(advanceButton);
			return waitForEvent(advanceButton, "click");
		});
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

	return {
		oncreate() {
			tallyPromise = runner.run(runs);

			// Redraw so that mounting inside GameCanvas can use
			// canvas.getBoundingClientRect() and get proper values from it.
			m.redraw();
		},

		view() {
			return [
				m(GameCanvas, { game: runner.game, options: { players } }),

				m(Config, { setWidth, setHeight, setRuns }),

				m("button#advance", "Advance"),
			];
		},
	};
}
