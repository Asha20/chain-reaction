import { assert } from "@common/util";
import { Player } from "./common";
import { PlayRandomly } from "./play_randomly";
import { PlayUserInput } from "./play_user_input";

type Players = typeof PlayRandomly | typeof PlayUserInput;

const playerFactories: Players[] = [PlayRandomly, PlayUserInput];

export type JsPlayerName = Players["name"];
export type WasmPlayerName = Extract<JsPlayerName, "PlayRandomly">;

export const playersJS: JsPlayerName[] = ["PlayRandomly", "PlayUserInput"];
export const playersWASM: WasmPlayerName[] = ["PlayRandomly"];

export function getPlayer<TName extends Players["name"]>(
	name: TName,
): ReturnType<Extract<Players, Player<TName>>["create"]> {
	const player = playerFactories.find(x => x.name === name);
	assert(player, `There is no player with name ${name}.`);

	return player.create() as ReturnType<
		Extract<Players, Player<TName>>["create"]
	>;
}
