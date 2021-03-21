import { PlayRandomly } from "./play_randomly";
import { PlayUserInput } from "./play_user_input";
import { Playable } from "../runner";

type GetPlayer<
	T extends Playable | ((...args: never[]) => Playable)
> = T extends (...args: never[]) => infer U ? U : T;

export type Player = GetPlayer<typeof PlayRandomly | typeof PlayUserInput>;

export { PlayRandomly, PlayUserInput };
