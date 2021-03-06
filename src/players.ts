import { XY } from "./chain_reaction";
import { Player } from "./runner";
import { waitForEvent } from "./util";

export const PlayRandomly: Player = {
	play({ width, height, canPlace }) {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const x = Math.floor(width * Math.random());
			const y = Math.floor(height * Math.random());

			if (canPlace(x, y)) {
				return { x, y };
			}
		}
	},
};

export function PlayPos(pos: XY): Player {
	return {
		play() {
			return pos;
		},
	};
}

interface PlayUserInputOptions {
	canvas: HTMLCanvasElement;
	tileSize: number;
}

export function PlayUserInput({
	canvas,
	tileSize,
}: PlayUserInputOptions): Player {
	return {
		async play({ canPlace }) {
			// eslint-disable-next-line no-constant-condition
			while (true) {
				const e = await waitForEvent(canvas, "click");

				const x = Math.floor(e.clientX / tileSize);
				const y = Math.floor(e.clientY / tileSize);

				if (canPlace(x, y)) {
					return { x, y };
				}
			}
		},
	};
}
