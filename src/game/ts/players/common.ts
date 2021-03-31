import { Playable } from "../runner";
import { XY } from "../common";

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

export function toXY(pos: number, width: number): XY {
	return { x: pos % width, y: Math.floor(pos / width) };
}
