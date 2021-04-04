import { assert } from "@common/util";
import { Player, PlayerMeta } from "./common";
import { PlayRandomly } from "./play_randomly";
import { PlayUserInput } from "./play_user_input";
import { AvoidOthers } from "./avoid_others";
import { FormChains } from "./form_chains";

type IsWasmPlayer<T> = T extends Player<string, true> ? T : never;
type WasmPlayer<T extends readonly Player<string>[]> = IsWasmPlayer<T[number]>;

function registerPlayers<T extends readonly Player<string>[]>(...players: T) {
	const playersJS: T[number]["meta"]["id"][] = players.map(x => x.meta.id);
	const playersWASM: WasmPlayer<T>["meta"]["id"][] = players
		.filter(x => x.meta.wasm)
		.map(x => x.meta.id);

	return { players, playersJS, playersWASM };
}

// To add a new player, pass it to this registerPlayers call.
const { players, playersJS, playersWASM } = registerPlayers(
	PlayRandomly,
	PlayUserInput,
	AvoidOthers,
	FormChains,
);

export { players, playersJS, playersWASM };

export type JsPlayerName = typeof playersJS[number];
export type WasmPlayerName = typeof playersWASM[number];

export type Players = typeof players[number];
export type PlayerUserInput = ReturnType<typeof PlayUserInput["create"]>;

export function getPlayer<TId extends Players["meta"]["id"]>(
	id: TId,
): ReturnType<Extract<Players, Player<TId>>["create"]> {
	const player = players.find(x => x.meta.id === id);
	assert(player, `There is no player with id ${id}.`);

	return player.create() as ReturnType<Extract<Players, Player<TId>>["create"]>;
}

export function getPlayerMeta<TId extends Players["meta"]["id"]>(
	id: TId,
): PlayerMeta<TId> {
	const player = players.find(x => x.meta.id === id);
	assert(player, `There is no player with id ${id}.`);
	return player.meta as PlayerMeta<TId>;
}
