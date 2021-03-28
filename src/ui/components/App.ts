import m from "mithril";
import { array, CancelPromise, RepeatablePromise, sleep } from "@common/util";
import { PlayerRenderOptions, Runner, wasmRunner, getPlayer } from "@game";
import { GameCanvas } from "./GameCanvas";
import { Config } from "./Config";
import { Controls } from "./Controls";
import { Grid } from "./Grid";
import { state, $state } from "@ui/state";
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
	{
		cellColor: "green",
		textColor: "white",
		shape: "square",
	},
	{
		cellColor: "purple",
		textColor: "white",
		shape: "diamond",
	},
];

export function App(): m.Component {
	const HumanPlayer = getPlayer("PlayUserInput");
	let runner = getRunner();
	let endPromise = CancelPromise<number[]>();
	let tally = array(runner.game.players, () => 0);
	let gameId = 0;

	const advancePromise = RepeatablePromise();

	function getRunner() {
		HumanPlayer.setBoardSize(state.game.width, state.game.height);

		const runner = new Runner({
			width: state.game.width,
			height: state.game.height,

			// Use own HumanPlayer because that's the one that
			// attaches to the canvas and updates when the board size
			// changes.
			players: state.game.players.js.map(id =>
				id === "PlayUserInput" ? HumanPlayer : getPlayer(id),
			),
		});

		const pvp = state.game.players.js.every(id => id === "PlayUserInput");

		const explosionDelay =
			!pvp && state.manual
				? () => advancePromise.promise
				: () => sleep(state.game.explosionDelay);

		const turnDelay =
			!pvp && state.manual
				? () => advancePromise.promise
				: pvp
				? () => sleep(0)
				: () => sleep(state.game.turnDelay);

		const gameDelay = () => sleep(state.game.gameDelay);

		runner.hooks.add("explosionDelay", explosionDelay);
		runner.hooks.add("turnDelay", turnDelay);
		runner.hooks.add("gameDelay", gameDelay);

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

	$state.on(
		[
			"width",
			"height",
			"runs",
			"explosionDelay",
			"turnDelay",
			"gameDelay",
			"manual",
			"wasm",
			"updatePlayerJS",
			"updatePlayerWASM",
			"updatePlayerCountJS",
			"updatePlayerCountWASM",
		],
		updateGame,
	);

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

		$state.emit("active", true);

		endPromise = state.wasm
			? wasmRunner.run(
					{
						width: state.game.width,
						height: state.game.height,
						runs: state.game.runs,
						players: state.game.players.wasm,
					},
					100,
					refresh,
			  )
			: runner.run(state.game.runs, onGameFinished);

		console.time("start");
		void endPromise.promise
			.then(result => {
				$state.emit("active", false);
				tally = result;
				console.timeEnd("start");
			})
			.then(updateGame);
	}

	return {
		oncreate(vnode) {
			const canvasBoard = vnode.dom.querySelector<HTMLCanvasElement>(".board");

			if (canvasBoard) {
				HumanPlayer.setCanvas(canvasBoard);
				void updateGame();
			} else {
				// Redraw so that mounting inside GameCanvas can use
				// canvas.getBoundingClientRect() and get proper values from it.
				m.redraw();
			}
		},

		view() {
			return m(Grid, {
				canvas: m(
					".wrapper",
					m(GameCanvas, {
						game: runner.game,
						options: { players },
					}),
				),
				controls: m(Controls, {
					onStart: runSimulation,
					onCancel: updateGame,
					onAdvance: advance,
				}),
				tally: m(Tally, { tally, gameId, runs: state.game.runs }),
				config: m(Config, { disabled: state.game.active }),
			});
		},
	};
}
