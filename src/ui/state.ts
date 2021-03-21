import { Immutable } from "@ui/util";
import { EventEmitter } from "@ui/event_emitter";

interface State {
	game: {
		width: number;
		height: number;
		runs: number;
		players: number;

		active: boolean;
		explosionDelay: number;
		turnDelay: number;
		gameDelay: number;
	};

	manual: boolean;
	wasm: boolean;
	pvp: boolean;
}

type StateEventEmitter = {
	width(width: number): void;
	height(height: number): void;
	runs(runs: number): void;
	players(players: number): void;

	active(active: boolean): void;
	explosionDelay(explosionDelay: number): void;
	turnDelay(turnDelay: number): void;
	gameDelay(gameDelay: number): void;

	manual(manual: boolean): void;
	wasm(wasm: boolean): void;
	pvp(pvp: boolean): void;
};

function defaultState(): State {
	return {
		game: {
			width: 3,
			height: 3,
			runs: 5,
			players: 2,
			active: false,

			explosionDelay: 50,
			turnDelay: 50,
			gameDelay: 500,
		},
		manual: false,
		wasm: false,
		pvp: false,
	};
}

const state = defaultState();
const immutableState: Immutable<State> = state;

export const defaults = {
	game: {
		width: {
			min: 2,
			max: 30,
		},
		height: {
			min: 2,
			max: 30,
		},
		runs: {
			min: 1,
			max: 10_000,
		},
		explosionDelay: {
			min: 10,
			max: 50_000,
		},
		turnDelay: {
			min: 10,
			max: 50_000,
		},
		gameDelay: {
			min: 10,
			max: 50_000,
		},
	},
};

export { immutableState as state };

export const $state = EventEmitter<StateEventEmitter>();

$state.on("width", x => (state.game.width = x));
$state.on("height", x => (state.game.height = x));
$state.on("runs", x => (state.game.runs = x));
$state.on("players", x => (state.game.players = x));
$state.on("active", x => (state.game.active = x));
$state.on("explosionDelay", x => (state.game.explosionDelay = x));
$state.on("turnDelay", x => (state.game.turnDelay = x));
$state.on("gameDelay", x => (state.game.gameDelay = x));
$state.on("manual", x => (state.manual = x));
$state.on("wasm", x => (state.wasm = x));
$state.on("pvp", x => (state.pvp = x));
