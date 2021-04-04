import { Playable } from "../runner";
import { XY } from "../common";

export interface PlayerMeta<
	TId extends string,
	TWasm extends boolean = boolean
> {
	id: TId;
	name: string;
	description: string;
	wasm: TWasm;
}

export interface Player<
	TId extends string,
	TWasm extends boolean = boolean,
	TPlayable extends Playable = Playable
> {
	meta: PlayerMeta<TId, TWasm>;
	create(): TPlayable;
}

export function toXY(pos: number, width: number): XY {
	return { x: pos % width, y: Math.floor(pos / width) };
}

export function createPlayer<
	TId extends string,
	TWasm extends boolean,
	TPlayable extends Playable
>(
	singleton: TPlayable,
	meta: PlayerMeta<TId, TWasm>,
): Player<TId, TWasm, TPlayable> {
	return {
		meta,
		create() {
			return singleton;
		},
	};
}

export function createStatefulPlayer<
	TId extends string,
	TWasm extends boolean,
	TPlayable extends Playable
>(
	create: () => TPlayable,
	meta: PlayerMeta<TId, TWasm>,
): Player<TId, TWasm, TPlayable> {
	return { meta, create };
}
