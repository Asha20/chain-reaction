import { buildQueryString, parseQueryString } from "mithril";
import { DeepPartial, Immutable, overwrite, supportsWasm } from "@ui/util";
import { EventEmitter } from "@ui/event_emitter";
import { JsPlayerName, WasmPlayerName } from "@game";
import { assert } from "@common/util";
import * as draw from "@ui/renderer/draw";

interface MutableState {
	game: {
		width: number;
		height: number;
		runs: number;
		players: {
			js: JsPlayerName[];
			wasm: WasmPlayerName[];
		};

		active: boolean;
		explosionDelay: number;
		turnDelay: number;
		gameDelay: number;
	};

	manual: boolean;
	wasm: boolean;
}

export type State = Immutable<MutableState>;

type StateEventEmitter = {
	width(width: number): void;
	height(height: number): void;
	runs(runs: number): void;
	updatePlayerCountJS(count: number): void;
	updatePlayerCountWASM(count: number): void;
	updatePlayerJS(index: number, players: JsPlayerName): void;
	updatePlayerWASM(index: number, players: WasmPlayerName): void;

	active(active: boolean): void;
	explosionDelay(explosionDelay: number): void;
	turnDelay(turnDelay: number): void;
	gameDelay(gameDelay: number): void;

	manual(manual: boolean): void;
	wasm(wasm: boolean): void;

	update(): void;
	refresh(): void;
};

export function defaultState(): MutableState {
	return {
		game: {
			width: 3,
			height: 3,
			runs: 5,
			players: {
				js: ["PlayRandomly", "PlayRandomly"],
				wasm: ["PlayRandomly", "PlayRandomly"],
			},
			active: false,

			explosionDelay: 500,
			turnDelay: 500,
			gameDelay: 500,
		},
		manual: false,
		wasm: false,
	};
}

const state: MutableState = (() => {
	const base = defaultState();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const parsed = parseQueryString(location.search) as Record<string, any>;
	overwrite(base, parsed);

	/**
	 * When parsing a querystring, numbers get turned to strings,
	 * so ensure that these fields are actually numbers.
	 */
	const numberFields = [
		"explosionDelay",
		"turnDelay",
		"gameDelay",
		"width",
		"height",
		"runs",
	] as const;

	numberFields.forEach(key => {
		if (parsed.game?.[key] !== undefined) {
			base.game[key] = +parsed.game[key];
		}
	});

	// Allow WASM only if the browser supports it.
	base.wasm &&= supportsWasm;

	return base;
})();

const immutableState: State = state;

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
		players: {
			min: 2,
			max: draw.players.length,

			js: "PlayRandomly" as JsPlayerName,
			wasm: "PlayRandomly" as WasmPlayerName,
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

export type StateEmitter = typeof $state;

$state.on("width", x => (state.game.width = x));
$state.on("height", x => (state.game.height = x));
$state.on("runs", x => (state.game.runs = x));
$state.on("updatePlayerCountJS", x => {
	if (x < state.game.players.js.length) {
		state.game.players.js.splice(x);
	} else {
		while (state.game.players.js.length < x) {
			state.game.players.js.push(defaults.game.players.js);
		}
	}
});
$state.on("updatePlayerCountWASM", x => {
	if (x < state.game.players.wasm.length) {
		state.game.players.wasm.splice(x);
	} else {
		while (state.game.players.wasm.length < x) {
			state.game.players.wasm.push(defaults.game.players.wasm);
		}
	}
});
$state.on("updatePlayerJS", (i, x) => {
	assert(i >= 0 && i < state.game.players.js.length);
	state.game.players.js[i] = x;
});
$state.on("updatePlayerWASM", (i, x) => {
	assert(i >= 0 && i < state.game.players.wasm.length);
	state.game.players.wasm[i] = x;
});
$state.on("active", x => (state.game.active = x));
$state.on("explosionDelay", x => (state.game.explosionDelay = x));
$state.on("turnDelay", x => (state.game.turnDelay = x));
$state.on("gameDelay", x => (state.game.gameDelay = x));
$state.on("manual", x => (state.manual = x));
$state.on("wasm", x => (state.wasm = supportsWasm && x));

$state.on(
	[
		"width",
		"height",
		"runs",
		"updatePlayerCountJS",
		"updatePlayerCountWASM",
		"updatePlayerJS",
		"updatePlayerWASM",
		"active",
		"explosionDelay",
		"turnDelay",
		"gameDelay",
		"manual",
		"wasm",
	],
	() => {
		const diff = difference(defaultState(), state);

		const query = buildQueryString((diff as unknown) as Record<string, string>);
		const newUrl = new URL(location.href);
		newUrl.search = "?" + query;

		history.replaceState({ path: newUrl.href }, "", newUrl.href);
	},
);

function equals(a: unknown, b: unknown): boolean {
	if (a === null || b === null) {
		return a === b;
	}

	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((x, i) => equals(x, b[i]));
	}

	if (typeof a === "object" && typeof b === "object") {
		const aObject = a as Record<string, unknown>;
		const bObject = b as Record<string, unknown>;
		// eslint-disable-next-line @typescript-eslint/ban-types
		const aKeys = Object.keys(aObject);
		return (
			aKeys.length === Object.keys(bObject).length &&
			aKeys.every(key => equals(aObject[key], bObject[key]))
		);
	}

	return a === b;
}

function difference<T>(a: T, b: T): DeepPartial<T> {
	const result: DeepPartial<T> = {};

	for (const key of Object.keys(b) as Array<keyof T>) {
		if (!equals(a[key], b[key])) {
			if (typeof b[key] === "object" && b[key] && !Array.isArray(b[key])) {
				result[key] = difference(a[key], b[key]);
			} else {
				result[key] = b[key];
			}
		}
	}

	return result;
}
