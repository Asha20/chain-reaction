import { Playable } from "../runner";

export interface PlayerMeta<TId extends string> {
	id: TId;
	name: string;
	description: string;
}

export interface Player<
	TId extends string,
	TPlayable extends Playable = Playable
> {
	meta: PlayerMeta<TId>;
	create(): TPlayable;
}
