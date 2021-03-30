import { array, CancelPromise, RepeatablePromise, sleep } from "@common/util";
import {
	ChainReaction,
	getPlayer,
	Runner,
	wasmRunner,
	PlayerUserInput,
} from "@game";
import { State, StateEmitter } from "./state";

export interface Simulator {
	update(): Promise<void>;
	advance(): void;
	run(): void;

	HumanPlayer(): PlayerUserInput;
	gameId(): number;
	tally(): number[];
	game(): ChainReaction;
	endPromise(): CancelPromise<number[]>;
}

export function Simulator(state: State, $state: StateEmitter): Simulator {
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

	async function update() {
		endPromise.cancel();
		await endPromise.promise;

		if (!state.wasm) {
			runner = getRunner();
		}
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
		update,
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
		$state.emit("refresh");
	}

	function refresh(newGameId: number, newTally: number[]) {
		tally = newTally;
		gameId = newGameId;
		$state.emit("refresh");
	}

	function run() {
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
			.then(update);
	}

	return {
		update,
		advance,
		run,

		HumanPlayer() {
			return HumanPlayer;
		},

		gameId() {
			return gameId;
		},

		tally() {
			return tally;
		},

		game() {
			return runner.game;
		},

		endPromise() {
			return endPromise;
		},
	};
}
