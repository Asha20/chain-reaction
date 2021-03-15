import m from "mithril";
import { assert, sleep } from "@util";
import { PlayerRenderOptions, PlayRandomly, Runner } from "@game";
import { GameCanvas } from "./GameCanvas";
import { Config } from "./Config";
import { state, actions } from "@ui/state";
import { Tally } from "./Tally";
import { array } from "@util";

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
	let endPromise: Promise<void> = Promise.resolve();
	let tally = array(runner.game.players, () => 0);
	let gameId = 0;

	function getRunner() {
		const runner = new Runner({
			width: state.game.width,
			height: state.game.height,
			players: [PlayRandomly, PlayRandomly],
		});

		runner.game.addHook("update", () => {
			const advanceButton = document.getElementById("advance");
			assert(advanceButton);
			// return waitForEvent(advanceButton, "click");
			return sleep(200);
		});
		return runner;
	}

	async function updateGame() {
		runner.cancel();
		await endPromise;
		actions.setActive(false);

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

	function onGameFinished(winner: number, id: number) {
		tally[winner] += 1;
		gameId = id;
		m.redraw();
	}

	function runSimulation() {
		if (!runner.running) {
			actions.setActive(true);
			tally = array(runner.game.players, () => 0);
			gameId = 0;
			endPromise = runner.run(state.game.runs, onGameFinished).then(result => {
				actions.setActive(false);
				tally = result;
				m.redraw();
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
					m(Tally, { tally, gameId, runs: state.game.runs }),

					m(Config, {
						disabled: state.game.active,
						setWidth,
						setHeight,
						setRuns,
					}),

					m(
						"button",
						{ disabled: state.game.active, onclick: runSimulation },
						"Start",
					),

					m(
						"button",
						{ disabled: !state.game.active, onclick: updateGame },
						"Cancel",
					),

					m("button#advance", "Advance"),
				]),
			];
		},
	};
}
