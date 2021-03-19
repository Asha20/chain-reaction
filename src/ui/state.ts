import { Immutable } from "@ui/util";

interface State {
	game: {
		width: number;
		height: number;
		runs: number;
		players: number;

		active: boolean;
		explosionDelay: number;
		turnDelay: number;
	};

	manual: boolean;
	wasm: boolean;
	pvp: boolean;
}

function defaultState(): State {
	return {
		game: {
			width: 3,
			height: 3,
			runs: 5,
			players: 2,
			active: false,

			explosionDelay: 200,
			turnDelay: 500,
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
	},
};

export { immutableState as state };

export const actions = {
	setWidth(value: number): void {
		state.game.width = value;
	},

	setHeight(value: number): void {
		state.game.height = value;
	},

	setRuns(value: number): void {
		state.game.runs = value;
	},

	setActive(value: boolean): void {
		state.game.active = value;
	},

	setExplosionDelay(value: number): void {
		state.game.explosionDelay = value;
	},

	setTurnDelay(value: number): void {
		state.game.turnDelay = value;
	},

	toggleManualProgress(): void {
		state.manual = !state.manual;
	},

	toggleWASM(): void {
		state.wasm = !state.wasm;
	},

	togglePvP(): void {
		state.pvp = !state.pvp;
	},
};
