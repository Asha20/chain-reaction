import { XY } from "./chain_reaction";
import { Player } from "./runner";

export const PlayRandomly: Player = {
	play({ width, height }) {
		return {
			x: Math.floor(width * Math.random()),
			y: Math.floor(height * Math.random()),
		};
	},
};

export const PlayPos = (pos: XY): Player => ({
	play() {
		return pos;
	},
});
