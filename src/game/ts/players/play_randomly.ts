import { Playable } from "../runner";
import { assert, random } from "@common/util";
import { XY } from "@game/chain_reaction";

function toXY(pos: number, width: number): XY {
	return { x: pos % width, y: Math.floor(pos / width) };
}

export const PlayRandomly: Playable<"PlayRandomly"> = {
	name: "PlayRandomly",
	play({ width, emptyCells, ownedCells, player }) {
		const ownCells = ownedCells[player];
		const availableCells = new Set([...ownCells, ...emptyCells]);

		assert(availableCells.size, "Making a move is impossible.");

		const index = Math.floor(availableCells.size * random());
		const pos = [...availableCells][index];

		return toXY(pos, width);
	},
};
