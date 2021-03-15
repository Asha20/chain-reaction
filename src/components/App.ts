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
import { state, actions } from "../state";

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
	let runner = getRunner();
	let tallyPromise: Promise<number[]> = Promise.resolve([]);

	function getRunner() {
		const runner = new Runner({
			width: state.game.width,
			height: state.game.height,
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
		await tallyPromise;

		runner = getRunner();
		m.redraw();
	}

	function setWidth(value: number) {
		actions.setWidth(value);
		return updateGame();
	}

	function setHeight(value: number) {
		actions.setHeight(value);
		return updateGame();
	}

	function setRuns(value: number) {
		actions.setRuns(value);
		return updateGame();
	}

	function runSimulation() {
		if (!runner.running) {
			tallyPromise = runner.run(state.game.runs).then(tally => {
				console.log("Tally:", tally);
				return tally;
			});
		}
	}

	return {
		oncreate() {
			// Redraw so that mounting inside GameCanvas can use
			// canvas.getBoundingClientRect() and get proper values from it.
			m.redraw();
		},

		view() {
			return [
				m(GameCanvas, { game: runner.game, options: { players } }),

				m("section.controls", [
					m(Config, { setWidth, setHeight, setRuns }),

					m(
						"button",
						{ disabled: runner.running, onclick: runSimulation },
						"Start",
					),

					m("button#advance", "Advance"),
				]),
			];
		},
	};
}
