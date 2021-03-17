import m from "mithril";
import { array, CancelPromise, RepeatablePromise, sleep } from "@common/util";
import { PlayerRenderOptions, PlayRandomly, Runner, wasmRunner } from "@game";
import { GameCanvas } from "./GameCanvas";
import { Config } from "./Config";
import { Controls } from "./Controls";
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
	let endPromise = CancelPromise<number[]>();
	let tally = array(runner.game.players, () => 0);
	let gameId = 0;

	const advancePromise = RepeatablePromise();

	function getRunner() {
		const runner = new Runner({
			width: state.game.width,
			height: state.game.height,
			players: [PlayRandomly, PlayRandomly],
		});

		const explosionDelay = state.manual
			? () => advancePromise.promise
			: () => sleep(state.game.explosionDelay);

		const turnDelay = state.manual
			? () => advancePromise.promise
			: () => sleep(state.game.turnDelay);

		runner.hooks.add("explosionDelay", explosionDelay);
		runner.hooks.add("turnDelay", turnDelay);

		return runner;
	}

	async function updateGame() {
		endPromise.cancel();
		await endPromise.promise;

		if (!state.wasm) {
			runner = getRunner();
		}

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

	function toggleWASM() {
		actions.toggleWASM();
		return updateGame();
	}

	function advance() {
		if (!state.manual) {
			return;
		}

		advancePromise.cancel();
	}

	function onGameFinished(winner: number, id: number) {
		tally[winner] += 1;
		gameId = id;
		m.redraw();
	}

	function refresh(newGameId: number, newTally: number[]) {
		gameId = newGameId;
		tally = newTally;
		m.redraw();
	}

	function runSimulation() {
		if (state.game.active) {
			return;
		}

		tally = array(runner.game.players, () => 0);
		gameId = 0;

		actions.setActive(true);

		endPromise = state.wasm
			? wasmRunner.run(state.game, 100, refresh)
			: runner.run(state.game.runs, onGameFinished);

		void endPromise.promise
			.then(result => {
				actions.setActive(false);
				tally = result;
			})
			.then(updateGame);
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

				m(Controls, {
					onStart: runSimulation,
					onCancel: updateGame,
					onAdvance: advance,
				}),

				m(Tally, { tally, gameId, runs: state.game.runs }),

				m(Config, {
					disabled: state.game.active,
					setWidth,
					setHeight,
					setRuns,
					setExplosionDelay,
					setTurnDelay,
					toggleManualProgress,
					toggleWASM,
				}),
			];
		},
	};
}
