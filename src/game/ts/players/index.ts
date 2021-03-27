import { assert } from "@common/util";
import { Player, PlayerMeta } from "./common";
import { PlayRandomly } from "./play_randomly";
import { PlayUserInput } from "./play_user_input";

type Players = typeof PlayRandomly | typeof PlayUserInput;

const playerFactories: Players[] = [PlayRandomly, PlayUserInput];

export type JsPlayerName = Players["meta"]["id"];
export type WasmPlayerName = Extract<JsPlayerName, "PlayRandomly">;

export const playersJS: JsPlayerName[] = ["PlayRandomly", "PlayUserInput"];
export const playersWASM: WasmPlayerName[] = ["PlayRandomly"];

export function getPlayer<TId extends Players["meta"]["id"]>(
	id: TId,
): ReturnType<Extract<Players, Player<TId>>["create"]> {
	const player = playerFactories.find(x => x.meta.id === id);
	assert(player, `There is no player with id ${id}.`);

	return player.create() as ReturnType<Extract<Players, Player<TId>>["create"]>;
}

export function getPlayerMeta<TId extends Players["meta"]["id"]>(
	id: TId,
): PlayerMeta<TId> {
	const player = playerFactories.find(x => x.meta.id === id);
	assert(player, `There is no player with id ${id}.`);
	return player.meta as PlayerMeta<TId>;
}
