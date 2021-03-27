import { Playable } from "../runner";
import { assert, random } from "@common/util";
import { XY } from "@game/chain_reaction";
import { Player } from "./common";

function toXY(pos: number, width: number): XY {
	return { x: pos % width, y: Math.floor(pos / width) };
}

const singleton: Playable = {
	play({ width, emptyCells, ownedCells, player }) {
		const ownCells = ownedCells[player];
		const availableCells = new Set([...ownCells, ...emptyCells]);

		assert(availableCells.size, "Making a move is impossible.");

		const index = Math.floor(availableCells.size * random());
		const pos = [...availableCells][index];

		return toXY(pos, width);
	},
};

export const PlayRandomly: Player<"PlayRandomly"> = {
	meta: {
		id: "PlayRandomly",
		name: "Play randomly",
		description: "Places a cell on a random available position.",
	},
	create() {
		return singleton;
	},
};
