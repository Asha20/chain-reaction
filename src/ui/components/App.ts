import m from "mithril";
import { array, RepeatablePromise, sleep } from "@common/util";
import { PlayerRenderOptions, PlayRandomly, Runner } from "@game";
import { GameCanvas } from "./GameCanvas";
import { Config } from "./Config";
import { state, actions } from "@ui/state";
import { Tally } from "./Tally";

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

	const advancePromise = RepeatablePromise();

	function getRunner() {
		const runner = new Runner({
			width: state.game.width,
			height: state.game.height,
			players: [PlayRandomly, PlayRandomly],
		});

		const explosionDelay = state.game.manual
			? () => advancePromise.promise
			: () => sleep(state.game.explosionDelay);

		const turnDelay = state.game.manual
			? () => advancePromise.promise
			: () => sleep(state.game.turnDelay);

		runner.hooks.add("explosionDelay", explosionDelay);
		runner.hooks.add("turnDelay", turnDelay);

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

	function setExplosionDelay(value: number) {
		actions.setExplosionDelay(value);
		return updateGame();
	}

	function setTurnDelay(value: number) {
		actions.setTurnDelay(value);
		return updateGame();
	}

	function toggleManualProgress() {
		actions.toggleManualProgress();
		return updateGame();
	}

	function advance() {
		if (!state.game.manual) {
			return;
		}

		advancePromise.cancel();
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
				m(
					".grid--canvas",
					m(GameCanvas, { game: runner.game, options: { players } }),
				),

				m("section.controls.grid--controls", [
					m(Tally, { tally, gameId, runs: state.game.runs }),

					m(Config, {
						disabled: state.game.active,
						setWidth,
						setHeight,
						setRuns,
						setExplosionDelay,
						setTurnDelay,
						toggleManualProgress,
					}),

					m(
						".config__field--1",
						m(
							"button",
							{ disabled: state.game.active, onclick: runSimulation },
							"Start",
						),
					),

					m(
						".config__field--1",
						m(
							"button",
							{ disabled: !state.game.active, onclick: updateGame },
							"Cancel",
						),
					),

					state.game.manual &&
						m(
							".config__field--1",
							m(
								"button",
								{ disabled: !state.game.active, onclick: advance },
								"Advance",
							),
						),
				]),
			];
		},
	};
}
