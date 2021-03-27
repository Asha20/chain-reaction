import { Playable } from "../runner";

export interface Player<
	TName extends string,
	TPlayable extends Playable = Playable
> {
	name: TName;
	create(): TPlayable;
}
