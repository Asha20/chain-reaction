import { Immutable } from "./game/ts/util";

interface State {
	game: {
		width: number;
		height: number;
		runs: number;
	};
}

function defaultState(): State {
	return {
		game: {
			width: 3,
			height: 3,
			runs: 5,
		},
	};
}

const state = defaultState();
const immutableState: Immutable<State> = state;

export const defaults = {
	game: {
		width: {
			min: 2,
			max: 10,
		},
		height: {
			min: 2,
			max: 10,
		},
		runs: {
			min: 1,
			max: 100,
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
};
